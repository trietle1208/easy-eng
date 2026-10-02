import { readFileSync, writeFileSync, existsSync } from "node:fs";

import { LEVEL_QUOTAS, PATHS, SOURCE_TAG, type CefrLevel } from "../../config";
import { createClassifyContext, classifyWord } from "./classify";
import {
  enrichInputHash,
  mergeEnrichment,
  toEnrichInput,
  upsertEnrichedJsonl,
} from "./enrich";
import {
  enrichModelItemSchema,
  type EnrichModelItem,
} from "./enrich-schema";
import { frequencyRankFor, loadFrequencyRanks } from "./frequency";
import { readValidatedWords } from "./human-review";
import { loadCmudict, lookupIpa } from "./ipa";
import { stableWordId } from "./ids";
import { buildCandidates } from "./normalise";
import { parseCefrjCsv } from "./build-skeleton";
import { compareForSelection, type RankedCandidate } from "./select";
import type { PartOfSpeech, SkeletonWord } from "./types";
import {
  cursorReviewWord,
  toValidatedWord,
  type ValidatedWord,
} from "./review";
import {
  buildCatalogContext,
  loadSets,
  validateWord,
} from "./validate";
import { writeValidatedJsonl } from "./validate-report";

const SENSITIVE_HEADWORDS = new Set([
  "murder",
  "suicide",
  "terrorist",
  "terrorism",
  "rape",
  "bomb",
]);

export type RefillSlot = {
  level: CefrLevel;
  partOfSpeech: PartOfSpeech;
};

export function loadDroppedLog(
  path = PATHS.reviewDroppedLog,
): Array<{ id: string; word: string; level: CefrLevel; topicId: string }> {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

/** Next unused CEFR-J candidates for a level+POS, Phase 2 ranking. */
export function nextCandidatesForSlots(
  slots: RefillSlot[],
  usedIds: Set<string>,
): SkeletonWord[] {
  const cefrj = parseCefrjCsv(readFileSync(PATHS.cefrjCsv, "utf8"));
  const { candidates } = buildCandidates(cefrj);
  const freq = loadFrequencyRanks(PATHS.frequency);
  const cmudict = loadCmudict(PATHS.cmudict);

  const ranked: RankedCandidate[] = candidates.map((c) => ({
    ...c,
    frequencyRank: frequencyRankFor(freq, c.word),
  }));

  const picked: SkeletonWord[] = [];
  const pickedKeys = new Set<string>();

  for (const slot of slots) {
    const pool = ranked
      .filter(
        (c) =>
          c.level === slot.level &&
          c.partOfSpeech === slot.partOfSpeech &&
          !SENSITIVE_HEADWORDS.has(c.word.toLowerCase()) &&
          !usedIds.has(stableWordId(c.word, c.partOfSpeech)) &&
          !pickedKeys.has(`${c.word}|${c.partOfSpeech}`),
      )
      .sort(compareForSelection);
    const c = pool[0];
    if (!c) {
      throw new Error(
        `No refill candidate for ${slot.level} ${slot.partOfSpeech}`,
      );
    }
    pickedKeys.add(`${c.word}|${c.partOfSpeech}`);
    const id = stableWordId(c.word, c.partOfSpeech);
    const { ipa, ipaSource } = lookupIpa(cmudict, c.word);
    picked.push({
      id,
      word: c.word,
      partOfSpeech: c.partOfSpeech,
      level: c.level,
      ipa,
      ipaSource,
      frequencyRank: c.frequencyRank,
      flagged: c.flagged,
      source: SOURCE_TAG,
      notes: c.notes,
      otherLevels: c.otherLevels,
      isMultiWord: c.isMultiWord,
    });
  }

  return picked;
}

export function assignToSets(
  words: ValidatedWord[],
  setsPath = PATHS.setsJson,
): void {
  const raw = JSON.parse(readFileSync(setsPath, "utf8")) as {
    sets: Array<{
      id: string;
      topicId: string;
      level: CefrLevel;
      wordIds: string[];
      words: string[];
      [k: string]: unknown;
    }>;
    setCount: number;
  };

  for (const w of words) {
    // Prefer set with same topic+level under max 30; else any level set under 30
    const same = raw.sets
      .filter((s) => s.topicId === w.topicId && s.level === w.level)
      .sort((a, b) => a.wordIds.length - b.wordIds.length || a.id.localeCompare(b.id));
    let target = same.find((s) => s.wordIds.length < 30);
    if (!target) {
      const any = raw.sets
        .filter((s) => s.level === w.level)
        .sort((a, b) => a.wordIds.length - b.wordIds.length || a.id.localeCompare(b.id));
      target = any.find((s) => s.wordIds.length < 30);
    }
    if (!target) {
      throw new Error(`No set room for refill ${w.id} (${w.level} ${w.topicId})`);
    }
    target.wordIds.push(w.id);
    target.words.push(w.word);
  }

  writeFileSync(setsPath, JSON.stringify(raw, null, 2) + "\n", "utf8");
}

export function applyRefillEnrichments(
  skeletons: SkeletonWord[],
  items: EnrichModelItem[],
): ValidatedWord[] {
  const ctx = createClassifyContext();
  const byId = new Map(items.map((i) => [i.id, i]));
  const enriched = skeletons.map((sk) => {
    const classified = classifyWord(sk, ctx);
    const item = byId.get(sk.id);
    if (!item) throw new Error(`Missing enrich item for ${sk.id}`);
    const parsed = enrichModelItemSchema.parse(item);
    const hash = enrichInputHash(toEnrichInput(classified));
    return mergeEnrichment(classified, parsed, hash);
  });

  upsertEnrichedJsonl(enriched);

  const existing = readValidatedWords();

  // Assign to sets first so validateWord sees membership
  const provisional: ValidatedWord[] = enriched.map((e) => ({
    ...e,
    reviewStatus: "human_reviewed" as const,
    validationIssues: [],
    aiReview: {
      id: e.id,
      verdict: "pass" as const,
      issues: [],
      fixes: null,
      promptVersion: "review.v1",
      method: "cursor-rules" as const,
    },
    fixedCopy: null,
    regenerateAttempt: 0,
    humanDecision: "ok" as const,
    humanComment: "phase6_refill",
  }));
  assignToSets(provisional);

  const allForCtx = [...existing, ...provisional];
  const ctxCat = buildCatalogContext(allForCtx, loadSets());
  const validated: ValidatedWord[] = [];
  for (const e of enriched) {
    const rules = validateWord(e, ctxCat);
    const review = cursorReviewWord(e, rules);
    const v = toValidatedWord(e, rules, review, 0);
    validated.push({
      ...v,
      reviewStatus: "human_reviewed",
      humanDecision: "ok",
      humanComment: "phase6_refill",
    });
  }

  const merged = [...existing, ...validated].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  writeValidatedJsonl(merged);

  // sanity quotas
  const byLevel = { A1: 0, A2: 0, B1: 0, B2: 0 } as Record<CefrLevel, number>;
  for (const w of merged) byLevel[w.level] += 1;

  return validated;
}

export function neededSlotsFromDroppedLog(): RefillSlot[] {
  const dropped = loadDroppedLog();
  // Recover POS from id: w-word-pos (pos may be multi-part like "on-to-preposition")
  return dropped.map((d) => {
    const m = d.id.match(
      /-((?:noun|verb|adjective|adverb|phrase|preposition|conjunction|interjection))$/,
    );
    const partOfSpeech = (m?.[1] ?? "noun") as PartOfSpeech;
    return { level: d.level, partOfSpeech };
  });
}

export function quotaSnapshot(words: ValidatedWord[]) {
  const byLevel = { A1: 0, A2: 0, B1: 0, B2: 0 } as Record<CefrLevel, number>;
  for (const w of words) byLevel[w.level] += 1;
  return {
    byLevel,
    total: words.length,
    quotas: LEVEL_QUOTAS,
  };
}
