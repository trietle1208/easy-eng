import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import {
  CLASSIFY_PROMPT_VERSION,
  LOW_CONFIDENCE_THRESHOLD,
  PATHS,
  type CefrLevel,
} from "../../config";
import { loadCefrjTagIndex, topicFromCefrjTags } from "./cefrj-tags";
import { buildLexiconIndex } from "./classify-lexicon";
import { patternClassify } from "./classify-patterns";
import type { PartOfSpeech, SkeletonWord } from "./types";
import { loadTopics, topicIdSet } from "./topics";

export type ClassifiedWord = SkeletonWord & {
  topicId: string;
  confidence: number;
  reason: string;
  classifyMethod: string;
  promptVersion: string;
  inputHash: string;
};

export type ClassifyCorrection = {
  id: string;
  topicId: string;
  confidence?: number;
  reason?: string;
};

const GRAMMAR_POS = new Set<PartOfSpeech>([
  "preposition",
  "conjunction",
  "interjection",
]);

export function inputHashFor(word: SkeletonWord): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        id: word.id,
        word: word.word,
        partOfSpeech: word.partOfSpeech,
        level: word.level,
        prompt: CLASSIFY_PROMPT_VERSION,
      }),
    )
    .digest("hex")
    .slice(0, 16);
}

function clampConfidence(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Pattern / stem heuristics when lexicon misses. */
function heuristicTopic(
  word: string,
  pos: PartOfSpeech,
): { topicId: string; confidence: number; reason: string } | null {
  const w = word.toLowerCase();

  if (/(?:ology|physics|chemistry|algebra|geometry)$/.test(w)) {
    return { topicId: "School", confidence: 0.75, reason: "academic subject word" };
  }
  if (/(?:itis|osis|emia|pathy)$/.test(w) && pos === "noun") {
    return { topicId: "Health", confidence: 0.7, reason: "medical suffix" };
  }
  if (/(?:^cyber|digital|software|hardware|malware)$/.test(w) || /ware$/.test(w)) {
    return { topicId: "Technology", confidence: 0.65, reason: "tech-like form" };
  }
  if (/(?:ball|sport|olympic)/.test(w)) {
    return { topicId: "Sports", confidence: 0.7, reason: "sport-like form" };
  }
  if (/(?:ism|cracy|lation)$/.test(w) && pos === "noun") {
    return { topicId: "Society", confidence: 0.55, reason: "abstract civic noun" };
  }
  if (pos === "adverb" && /ly$/.test(w)) {
    // manner adverbs often Daily life unless emotion (*happily*)
    if (/(?:happy|sad|angry|nervous|proud|glad|excited)/.test(w)) {
      return { topicId: "Feelings", confidence: 0.7, reason: "emotion adverb" };
    }
  }
  return null;
}

export type ClassifyContext = {
  tags: Map<string, string[]>;
  lexicon: Map<string, string>;
  validTopics: Set<string>;
  corrections: Map<string, ClassifyCorrection>;
};

export function loadCorrections(
  path = PATHS.classifyCorrections,
): Map<string, ClassifyCorrection> {
  const map = new Map<string, ClassifyCorrection>();
  if (!existsSync(path)) return map;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as ClassifyCorrection;
    map.set(row.id, row);
  }
  return map;
}

export function createClassifyContext(): ClassifyContext {
  const topics = loadTopics();
  return {
    tags: loadCefrjTagIndex(),
    lexicon: buildLexiconIndex(),
    validTopics: topicIdSet(topics),
    corrections: loadCorrections(),
  };
}

/**
 * Cursor-only classifier (no API): CEFR-J tags → POS grammar → lexicon →
 * heuristics → Daily life fallback. Optional corrections JSONL overrides.
 */
export function classifyWord(
  word: SkeletonWord,
  ctx: ClassifyContext,
): ClassifiedWord {
  const hash = inputHashFor(word);
  const base = {
    ...word,
    promptVersion: CLASSIFY_PROMPT_VERSION,
    inputHash: hash,
  };

  const correction = ctx.corrections.get(word.id);
  if (correction) {
    const topicId = correction.topicId;
    if (!ctx.validTopics.has(topicId)) {
      throw new Error(`Correction topic invalid for ${word.id}: ${topicId}`);
    }
    return {
      ...base,
      topicId,
      confidence: clampConfidence(correction.confidence ?? 0.95),
      reason: correction.reason ?? "manual correction",
      classifyMethod: "correction",
    };
  }

  if (GRAMMAR_POS.has(word.partOfSpeech)) {
    return {
      ...base,
      topicId: "Grammar words",
      confidence: 0.98,
      reason: `${word.partOfSpeech} → grammar`,
      classifyMethod: "pos_rule",
    };
  }

  const tagKey = `${word.word}|${word.partOfSpeech}`;
  const tags = ctx.tags.get(tagKey);
  if (tags?.length) {
    const topicId = topicFromCefrjTags(tags);
    if (topicId && ctx.validTopics.has(topicId)) {
      return {
        ...base,
        topicId,
        confidence: 0.9,
        reason: `CEFR-J tag ${tags[0]}`,
        classifyMethod: "cefrj_tag",
      };
    }
  }

  const lex = ctx.lexicon.get(word.word.toLowerCase());
  if (lex && ctx.validTopics.has(lex)) {
    return {
      ...base,
      topicId: lex,
      confidence: 0.82,
      reason: "lexicon match",
      classifyMethod: "lexicon",
    };
  }

  // Try first token of multi-word
  if (word.isMultiWord) {
    const first = word.word.split(/\s+/)[0]!;
    const lexFirst = ctx.lexicon.get(first);
    if (lexFirst && ctx.validTopics.has(lexFirst)) {
      return {
        ...base,
        topicId: lexFirst,
        confidence: 0.72,
        reason: "multi-word head lexicon",
        classifyMethod: "lexicon_multi",
      };
    }
  }

  const patterned = patternClassify(word.word, word.partOfSpeech);
  if (patterned && ctx.validTopics.has(patterned.topicId)) {
    return {
      ...base,
      topicId: patterned.topicId,
      confidence: patterned.confidence,
      reason: patterned.reason,
      classifyMethod: "pattern",
    };
  }

  const heur = heuristicTopic(word.word, word.partOfSpeech);
  if (heur && ctx.validTopics.has(heur.topicId)) {
    return {
      ...base,
      topicId: heur.topicId,
      confidence: heur.confidence,
      reason: heur.reason,
      classifyMethod: "heuristic",
    };
  }

  // Untagged general vocabulary → Daily life (prompt fallback rule).
  // High-frequency lemmas are confidently general; rare ones stay low-conf.
  const freq = word.frequencyRank;
  const conf =
    freq != null && freq <= 5000 ? 0.75 : freq != null && freq <= 12000 ? 0.6 : 0.45;

  return {
    ...base,
    topicId: "Daily life",
    confidence: conf,
    reason: "general / no strong topic",
    classifyMethod: "fallback",
  };
}

export function classifyAll(
  words: SkeletonWord[],
  ctx = createClassifyContext(),
): ClassifiedWord[] {
  return words.map((w) => classifyWord(w, ctx));
}

export function readSkeletonJsonl(
  path = PATHS.skeletonJsonl,
): SkeletonWord[] {
  const text = readFileSync(path, "utf8");
  return text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as SkeletonWord);
}

export function readClassifiedJsonl(
  path = PATHS.classifiedJsonl,
): ClassifiedWord[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as ClassifiedWord);
}

export type TopicLevelCounts = Record<string, Record<CefrLevel, number>>;

export function countTopicLevel(words: ClassifiedWord[]): TopicLevelCounts {
  const out: TopicLevelCounts = {};
  for (const w of words) {
    out[w.topicId] ??= { A1: 0, A2: 0, B1: 0, B2: 0 };
    out[w.topicId]![w.level] += 1;
  }
  return out;
}

export function lowConfidenceWords(
  words: ClassifiedWord[],
  threshold = LOW_CONFIDENCE_THRESHOLD,
): ClassifiedWord[] {
  return words
    .filter((w) => w.confidence < threshold)
    .sort(
      (a, b) =>
        a.confidence - b.confidence ||
        a.word.localeCompare(b.word) ||
        a.partOfSpeech.localeCompare(b.partOfSpeech),
    );
}

export function topicReportCsv(
  counts: TopicLevelCounts,
  topicOrder: string[],
): string {
  const header = ["topic", "A1", "A2", "B1", "B2", "total"];
  const lines = [header.join(",")];
  for (const topic of topicOrder) {
    const c = counts[topic] ?? { A1: 0, A2: 0, B1: 0, B2: 0 };
    const total = c.A1 + c.A2 + c.B1 + c.B2;
    lines.push([topic, c.A1, c.A2, c.B1, c.B2, total].join(","));
  }
  return lines.join("\n") + "\n";
}
