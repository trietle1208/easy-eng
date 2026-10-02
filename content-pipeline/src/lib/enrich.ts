import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import path from "node:path";

import {
  ENRICH_BATCH_SIZE,
  ENRICH_PROMPT_VERSION,
  LEVEL_ORDER,
  PATHS,
  PILOT_PER_LEVEL,
  PILOT_SEED,
  SOURCE_TAG_ENRICHED,
  type CefrLevel,
} from "../../config";
import type { ClassifiedWord } from "./classify";
import {
  enrichModelBatchSchema,
  softValidateEnrichItem,
  validateBatchAgainstIds,
  type EnrichIssue,
  type EnrichModelItem,
} from "./enrich-schema";
import { seededSample } from "./select";

/** Common irregular verbs — prefer some in the pilot mix. */
export const IRREGULAR_VERBS = new Set([
  "go",
  "come",
  "take",
  "make",
  "get",
  "see",
  "know",
  "think",
  "give",
  "find",
  "tell",
  "become",
  "leave",
  "feel",
  "bring",
  "begin",
  "keep",
  "hold",
  "write",
  "stand",
  "hear",
  "let",
  "mean",
  "set",
  "meet",
  "run",
  "pay",
  "sit",
  "speak",
  "lie",
  "lead",
  "read",
  "grow",
  "lose",
  "fall",
  "send",
  "build",
  "understand",
  "draw",
  "break",
  "spend",
  "cut",
  "rise",
  "drive",
  "buy",
  "wear",
  "choose",
  "seek",
  "throw",
  "catch",
  "eat",
  "drink",
  "sleep",
  "swim",
  "sing",
  "win",
  "sell",
  "fight",
  "forget",
  "forgive",
]);

/** Headwords with several everyday senses — prefer a few in the pilot. */
export const POLYSEMOUS = new Set([
  "bank",
  "light",
  "right",
  "left",
  "match",
  "watch",
  "book",
  "point",
  "run",
  "set",
  "interest",
  "charge",
  "plant",
  "address",
  "present",
  "park",
  "order",
  "fair",
  "mean",
  "close",
  "fine",
  "case",
  "check",
  "train",
  "pass",
  "note",
  "kind",
  "change",
  "work",
  "play",
]);

export type EnrichInput = {
  id: string;
  word: string;
  partOfSpeech: string;
  level: CefrLevel;
  topicId: string;
  ipa: string | null;
  altSpelling: string | null;
};

export type EnrichedWord = ClassifiedWord & {
  meaningVi: string;
  definitionEn: string;
  examples: Array<{ en: string; vi: string }>;
  collocations: string[] | null;
  enrichNotes: string | null;
  reviewStatus: "ai_generated";
  enrichPromptVersion: string;
  enrichInputHash: string;
};

export type FailedEnrich = {
  id: string;
  word: string;
  level: CefrLevel;
  issues: EnrichIssue[];
  attempt: number;
  at: string;
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

/** Extract UK spelling from skeleton notes like "Also UK: colour". */
export function altSpellingFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/Also UK:\s*([^.;\n]+)/i);
  return m?.[1]?.trim() || null;
}

export function toEnrichInput(w: ClassifiedWord): EnrichInput {
  return {
    id: w.id,
    word: w.word,
    partOfSpeech: w.partOfSpeech,
    level: w.level,
    topicId: w.topicId,
    ipa: w.ipa,
    altSpelling: altSpellingFromNotes(w.notes),
  };
}

export function enrichInputHash(input: EnrichInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        id: input.id,
        word: input.word,
        partOfSpeech: input.partOfSpeech,
        level: input.level,
        topicId: input.topicId,
        ipa: input.ipa,
        altSpelling: input.altSpelling,
        prompt: ENRICH_PROMPT_VERSION,
      }),
    )
    .digest("hex")
    .slice(0, 16);
}

/**
 * Pick 25 words per level: force some multi-word, irregular verbs, polysemous;
 * fill with topic-diverse seeded sample.
 */
export function selectPilotWords(
  words: ClassifiedWord[],
  perLevel = PILOT_PER_LEVEL,
  seed = PILOT_SEED,
): ClassifiedWord[] {
  const out: ClassifiedWord[] = [];
  const rand = mulberry32(seed);

  for (const level of LEVEL_ORDER) {
    const pool = words.filter((w) => w.level === level);
    const picked = new Map<string, ClassifiedWord>();

    const take = (candidates: ClassifiedWord[], n: number) => {
      const avail = candidates.filter((w) => !picked.has(w.id));
      shuffleInPlace(avail, rand);
      for (const w of avail.slice(0, n)) picked.set(w.id, w);
    };

    take(
      pool.filter((w) => w.isMultiWord),
      3,
    );
    take(
      pool.filter(
        (w) => w.partOfSpeech === "verb" && IRREGULAR_VERBS.has(w.word),
      ),
      3,
    );
    take(
      pool.filter((w) => POLYSEMOUS.has(w.word)),
      3,
    );

    // Topic diversity: one from as many topics as possible
    const byTopic = new Map<string, ClassifiedWord[]>();
    for (const w of pool) {
      if (picked.has(w.id)) continue;
      const list = byTopic.get(w.topicId) ?? [];
      list.push(w);
      byTopic.set(w.topicId, list);
    }
    const topics = [...byTopic.keys()].sort();
    shuffleInPlace(topics, rand);
    for (const t of topics) {
      if (picked.size >= perLevel) break;
      const list = byTopic.get(t) ?? [];
      if (list.length === 0) continue;
      const [choice] = seededSample(list, 1, seed + picked.size + t.length);
      if (choice) picked.set(choice.id, choice);
    }

    // Fill remainder
    const rest = pool.filter((w) => !picked.has(w.id));
    const need = perLevel - picked.size;
    if (need > 0) {
      for (const w of seededSample(rest, need, seed + level.length * 17)) {
        picked.set(w.id, w);
      }
    }

    const levelWords = [...picked.values()].slice(0, perLevel);
    levelWords.sort(
      (a, b) =>
        a.topicId.localeCompare(b.topicId) || a.word.localeCompare(b.word),
    );
    out.push(...levelWords);
  }

  return out;
}

export function readClassifiedJsonl(
  filePath = PATHS.classifiedJsonl,
): ClassifiedWord[] {
  const text = readFileSync(filePath, "utf8");
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ClassifiedWord);
}

export function readEnrichedJsonl(
  filePath = PATHS.enrichedJsonl,
): Map<string, EnrichedWord> {
  const map = new Map<string, EnrichedWord>();
  if (!existsSync(filePath)) return map;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.trim().split("\n")) {
    if (!line.trim()) continue;
    const w = JSON.parse(line) as EnrichedWord;
    map.set(w.id, w);
  }
  return map;
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function writePilotWords(
  words: ClassifiedWord[],
  filePath = PATHS.pilotWordsJson,
): EnrichInput[] {
  const inputs = words.map(toEnrichInput);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    JSON.stringify(
      {
        promptVersion: ENRICH_PROMPT_VERSION,
        seed: PILOT_SEED,
        count: inputs.length,
        words: inputs,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
  return inputs;
}

/** Write pending batch input files for Cursor sessions. */
export function writePendingBatches(
  words: ClassifiedWord[],
  batchSize = ENRICH_BATCH_SIZE,
  dir = PATHS.enrichBatchesDir,
): string[] {
  mkdirSync(dir, { recursive: true });
  const chunks = chunkArray(words, batchSize);
  const paths: string[] = [];
  chunks.forEach((chunk, i) => {
    const n = String(i + 1).padStart(2, "0");
    const file = path.join(dir, `pending-${n}.json`);
    const payload = {
      promptVersion: ENRICH_PROMPT_VERSION,
      batch: i + 1,
      batchCount: chunks.length,
      inputs: chunk.map(toEnrichInput),
    };
    writeFileSync(file, JSON.stringify(payload, null, 2) + "\n", "utf8");
    paths.push(file);
  });
  return paths;
}

export type ApplyResult = {
  accepted: EnrichedWord[];
  failed: FailedEnrich[];
  softIssues: EnrichIssue[];
};

export function applyEnrichBatch(
  classifiedById: Map<string, ClassifiedWord>,
  raw: unknown,
  expectedIds: string[],
  attempt = 1,
): ApplyResult {
  const parsed = enrichModelBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      accepted: [],
      failed: expectedIds.map((id) => ({
        id,
        word: classifiedById.get(id)?.word ?? id,
        level: classifiedById.get(id)?.level ?? "A1",
        issues: [
          {
            id,
            code: "SCHEMA",
            message: parsed.error.issues.map((i) => i.message).join("; "),
          },
        ],
        attempt,
        at: new Date().toISOString(),
      })),
      softIssues: [],
    };
  }

  const { ok, issues: idIssues, byId } = validateBatchAgainstIds(
    parsed.data,
    expectedIds,
  );
  if (!ok) {
    return {
      accepted: [],
      failed: expectedIds.map((id) => ({
        id,
        word: classifiedById.get(id)?.word ?? id,
        level: classifiedById.get(id)?.level ?? "A1",
        issues: idIssues.filter((i) => i.id === id),
        attempt,
        at: new Date().toISOString(),
      })),
      softIssues: idIssues,
    };
  }

  const accepted: EnrichedWord[] = [];
  const failed: FailedEnrich[] = [];
  const softIssues: EnrichIssue[] = [];

  for (const id of expectedIds) {
    const item = byId.get(id)!;
    const base = classifiedById.get(id);
    if (!base) {
      failed.push({
        id,
        word: id,
        level: "A1",
        issues: [{ id, code: "UNKNOWN_ID", message: "not in classified" }],
        attempt,
        at: new Date().toISOString(),
      });
      continue;
    }

    const soft = softValidateEnrichItem(item, {
      word: base.word,
      level: base.level,
    });
    const hard = soft.filter((i) =>
      ["DEF_LEN", "DEF_HEADWORD", "EX_LEN", "EX_HEADWORD", "COLLOC"].includes(
        i.code,
      ),
    );
    softIssues.push(...soft);

    if (hard.length > 0) {
      failed.push({
        id,
        word: base.word,
        level: base.level,
        issues: hard,
        attempt,
        at: new Date().toISOString(),
      });
      continue;
    }

    const input = toEnrichInput(base);
    accepted.push(mergeEnrichment(base, item, enrichInputHash(input)));
  }

  return { accepted, failed, softIssues };
}

export function mergeEnrichment(
  base: ClassifiedWord,
  item: EnrichModelItem,
  hash: string,
): EnrichedWord {
  return {
    ...base,
    meaningVi: item.meaningVi.trim(),
    definitionEn: item.definitionEn.trim(),
    examples: item.examples.map((e) => ({
      en: e.en.trim(),
      vi: e.vi.trim(),
    })),
    collocations: item.collocations,
    enrichNotes: item.notes,
    notes: mergeNotes(base.notes, item.notes),
    source: SOURCE_TAG_ENRICHED,
    reviewStatus: "ai_generated",
    enrichPromptVersion: ENRICH_PROMPT_VERSION,
    enrichInputHash: hash,
  };
}

function mergeNotes(
  skeletonNotes: string | null,
  enrichNotes: string | null,
): string | null {
  const parts = [skeletonNotes, enrichNotes]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  if (parts.length === 0) return null;
  return [...new Set(parts)].join(" · ");
}

export function upsertEnrichedJsonl(
  words: EnrichedWord[],
  filePath = PATHS.enrichedJsonl,
): void {
  const existing = readEnrichedJsonl(filePath);
  for (const w of words) existing.set(w.id, w);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const lines =
    [...existing.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((w) => JSON.stringify(w))
      .join("\n") + (existing.size ? "\n" : "");
  writeFileSync(filePath, lines, "utf8");
}

export function appendFailed(
  failed: FailedEnrich[],
  filePath = PATHS.enrichFailedJsonl,
): void {
  if (!failed.length) return;
  mkdirSync(path.dirname(filePath), { recursive: true });
  const chunk = failed.map((f) => JSON.stringify(f)).join("\n") + "\n";
  appendFileSync(filePath, chunk, "utf8");
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function enrichedToPilotCsv(words: EnrichedWord[]): string {
  const header = [
    "id",
    "word",
    "partOfSpeech",
    "level",
    "topicId",
    "ipa",
    "altSpelling",
    "meaningVi",
    "definitionEn",
    "example1_en",
    "example1_vi",
    "example2_en",
    "example2_vi",
    "collocations",
    "notes",
    "reviewStatus",
    "source",
  ];
  const rows = words.map((w) => {
    const alt = altSpellingFromNotes(
      w.notes?.includes("Also UK:") ? w.notes : null,
    );
    // Prefer explicit alt from original skeleton note if still present
    const altSpelling =
      alt ??
      (w.notes?.match(/Also UK:\s*([^.;·\n]+)/i)?.[1]?.trim() ?? "");
    return [
      w.id,
      w.word,
      w.partOfSpeech,
      w.level,
      w.topicId,
      w.ipa ?? "",
      altSpelling,
      w.meaningVi,
      w.definitionEn,
      w.examples[0]?.en ?? "",
      w.examples[0]?.vi ?? "",
      w.examples[1]?.en ?? "",
      w.examples[1]?.vi ?? "",
      w.collocations?.join("; ") ?? "",
      w.notes ?? "",
      w.reviewStatus,
      w.source,
    ]
      .map((c) => csvEscape(String(c)))
      .join(",");
  });
  return "\uFEFF" + [header.join(","), ...rows].join("\n") + "\n";
}

export function writePilotCsv(
  words: EnrichedWord[],
  filePath = PATHS.pilotCsv,
): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, enrichedToPilotCsv(words), "utf8");
}

export function loadDoneBatch(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

/** Accept either a raw array or `{ items: [...] }` / `{ output: [...] }`. */
export function unwrapBatchPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.output)) return o.output;
    if (Array.isArray(o.results)) return o.results;
  }
  return raw;
}

export function pendingExpectedIds(pendingPath: string): string[] {
  const raw = JSON.parse(readFileSync(pendingPath, "utf8")) as {
    inputs: EnrichInput[];
  };
  return raw.inputs.map((i) => i.id);
}

export function summarizePilotMix(words: ClassifiedWord[]): {
  byLevel: Record<CefrLevel, number>;
  multiWord: number;
  irregularVerbs: number;
  polysemous: number;
  topics: number;
} {
  const byLevel = { A1: 0, A2: 0, B1: 0, B2: 0 } as Record<CefrLevel, number>;
  let multiWord = 0;
  let irregularVerbs = 0;
  let polysemous = 0;
  const topics = new Set<string>();
  for (const w of words) {
    byLevel[w.level] += 1;
    if (w.isMultiWord) multiWord += 1;
    if (w.partOfSpeech === "verb" && IRREGULAR_VERBS.has(w.word)) {
      irregularVerbs += 1;
    }
    if (POLYSEMOUS.has(w.word)) polysemous += 1;
    topics.add(w.topicId);
  }
  return {
    byLevel,
    multiWord,
    irregularVerbs,
    polysemous,
    topics: topics.size,
  };
}
