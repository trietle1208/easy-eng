import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import {
  HUMAN_REVIEW_SAMPLE_RATE,
  HUMAN_REVIEW_SEED,
  LOW_CONFIDENCE_THRESHOLD,
  PATHS,
  QUALITY_GATE_ACCEPT,
  QUALITY_GATE_WARN,
  type CefrLevel,
} from "../../config";
import { parseCsv } from "./csv";
import type { ValidatedWord } from "./review";
import { loadSets } from "./validate";

export const REVIEW_DECISIONS = ["ok", "fix", "drop"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

export const REVIEW_SHEET_HEADERS = [
  "id",
  "word",
  "pos",
  "level",
  "topic",
  "set_title",
  "ipa",
  "meaningVi",
  "definitionEn",
  "example1_en",
  "example1_vi",
  "example2_en",
  "example2_vi",
  "collocations",
  "notes",
  "flags",
  "inclusion",
  "decision",
  "fixed_meaningVi",
  "fixed_definitionEn",
  "fixed_example1_en",
  "fixed_example1_vi",
  "fixed_example2_en",
  "fixed_example2_vi",
  "comment",
] as const;

export type ReviewSheetHeader = (typeof REVIEW_SHEET_HEADERS)[number];

export type InclusionKind = "must" | "sample";

export type ReviewSheetRow = {
  id: string;
  word: string;
  pos: string;
  level: CefrLevel;
  topic: string;
  set_title: string;
  ipa: string;
  meaningVi: string;
  definitionEn: string;
  example1_en: string;
  example1_vi: string;
  example2_en: string;
  example2_vi: string;
  collocations: string;
  notes: string;
  flags: string;
  inclusion: InclusionKind;
  decision: string;
  fixed_meaningVi: string;
  fixed_definitionEn: string;
  fixed_example1_en: string;
  fixed_example1_vi: string;
  fixed_example2_en: string;
  fixed_example2_vi: string;
  comment: string;
};

export type FilledReviewRow = ReviewSheetRow & {
  decision: ReviewDecision;
};

export type SelectionResult = {
  mustIds: Set<string>;
  sampleIds: Set<string>;
  flagsById: Map<string, string[]>;
  remainingPoolSize: number;
  sampleTarget: number;
};

/** Deterministic 32-bit LCG seeded from string + seed. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(label: string, seed: number): number {
  const h = createHash("sha256")
    .update(`${seed}:${label}`)
    .digest();
  return h.readUInt32BE(0);
}

export function buildSetTitleMap(
  setsPath = PATHS.setsJson,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!existsSync(setsPath)) return map;
  const sets = loadSets(setsPath);
  for (const s of sets) {
    for (const wid of s.wordIds) {
      if (!map.has(wid)) map.set(wid, s.title);
    }
  }
  return map;
}

export function flagsForWord(w: ValidatedWord): string[] {
  const flags: string[] = [];
  if (w.reviewStatus === "needs_human") flags.push("needs_human");
  for (const i of w.validationIssues) {
    if (i.severity === "warning") flags.push(`warning:${i.code}`);
    if (i.severity === "error") flags.push(`error:${i.code}`);
  }
  if (w.confidence < LOW_CONFIDENCE_THRESHOLD) {
    flags.push(`low_confidence:${w.confidence.toFixed(2)}`);
  }
  for (const i of w.aiReview.issues) {
    flags.push(`ai:${i.code}`);
  }
  return flags;
}

export function isMustInclude(w: ValidatedWord): boolean {
  if (w.reviewStatus === "needs_human") return true;
  if (w.validationIssues.some((i) => i.severity === "warning" || i.severity === "error")) {
    return true;
  }
  if (w.confidence < LOW_CONFIDENCE_THRESHOLD) return true;
  return false;
}

/**
 * Must-include = needs_human + warnings/errors + low-confidence topics.
 * Sample ≥ 15% of the remainder, stratified by level × topic (deterministic).
 */
export function selectReviewSheet(
  words: ValidatedWord[],
  opts: { sampleRate?: number; seed?: number } = {},
): SelectionResult {
  const sampleRate = opts.sampleRate ?? HUMAN_REVIEW_SAMPLE_RATE;
  const seed = opts.seed ?? HUMAN_REVIEW_SEED;

  const mustIds = new Set<string>();
  const flagsById = new Map<string, string[]>();
  for (const w of words) {
    const flags = flagsForWord(w);
    if (flags.length) flagsById.set(w.id, flags);
    if (isMustInclude(w)) mustIds.add(w.id);
  }

  const remaining = words.filter((w) => !mustIds.has(w.id));
  const sampleTarget = Math.max(
    0,
    Math.ceil(remaining.length * sampleRate),
  );

  // Group remaining by level|topic
  const buckets = new Map<string, ValidatedWord[]>();
  for (const w of remaining) {
    const key = `${w.level}|${w.topicId}`;
    const list = buckets.get(key) ?? [];
    list.push(w);
    buckets.set(key, list);
  }

  // Proportional allocation with largest remainder
  const keys = [...buckets.keys()].sort();
  const alloc = new Map<string, number>();
  let assigned = 0;
  const fracs: Array<{ key: string; frac: number; size: number }> = [];
  for (const key of keys) {
    const size = buckets.get(key)!.length;
    const raw = (size / remaining.length) * sampleTarget;
    const floor = Math.min(size, Math.floor(raw));
    alloc.set(key, floor);
    assigned += floor;
    fracs.push({ key, frac: raw - Math.floor(raw), size });
  }
  fracs.sort(
    (a, b) => b.frac - a.frac || b.size - a.size || a.key.localeCompare(b.key),
  );
  let left = sampleTarget - assigned;
  for (const f of fracs) {
    if (left <= 0) break;
    const cur = alloc.get(f.key) ?? 0;
    if (cur >= f.size) continue;
    alloc.set(f.key, cur + 1);
    left -= 1;
  }

  const sampleIds = new Set<string>();
  for (const key of keys) {
    const n = alloc.get(key) ?? 0;
    if (n <= 0) continue;
    const pool = [...buckets.get(key)!].sort((a, b) => a.id.localeCompare(b.id));
    const rng = mulberry32(seedFrom(key, seed));
    // Fisher-Yates shuffle (deterministic)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    for (let i = 0; i < n; i++) {
      const id = pool[i]!.id;
      sampleIds.add(id);
      const prev = flagsById.get(id) ?? [];
      flagsById.set(id, [...prev, "sample"]);
    }
  }

  return {
    mustIds,
    sampleIds,
    flagsById,
    remainingPoolSize: remaining.length,
    sampleTarget,
  };
}

export function wordToReviewRow(
  w: ValidatedWord,
  setTitle: string,
  flags: string[],
  inclusion: InclusionKind,
): ReviewSheetRow {
  return {
    id: w.id,
    word: w.word,
    pos: w.partOfSpeech,
    level: w.level,
    topic: w.topicId,
    set_title: setTitle,
    ipa: w.ipa ?? "",
    meaningVi: w.meaningVi,
    definitionEn: w.definitionEn,
    example1_en: w.examples[0]?.en ?? "",
    example1_vi: w.examples[0]?.vi ?? "",
    example2_en: w.examples[1]?.en ?? "",
    example2_vi: w.examples[1]?.vi ?? "",
    collocations: w.collocations?.join("; ") ?? "",
    notes: w.enrichNotes ?? w.notes ?? "",
    flags: flags.join("|"),
    inclusion,
    decision: "",
    fixed_meaningVi: "",
    fixed_definitionEn: "",
    fixed_example1_en: "",
    fixed_example1_vi: "",
    fixed_example2_en: "",
    fixed_example2_vi: "",
    comment: "",
  };
}

export function buildReviewRows(
  words: ValidatedWord[],
  selection: SelectionResult,
  setTitles: Map<string, string>,
): ReviewSheetRow[] {
  const byId = new Map(words.map((w) => [w.id, w]));
  const ids = [...selection.mustIds, ...selection.sampleIds].sort();
  return ids.map((id) => {
    const w = byId.get(id)!;
    const inclusion: InclusionKind = selection.mustIds.has(id)
      ? "must"
      : "sample";
    return wordToReviewRow(
      w,
      setTitles.get(id) ?? "",
      selection.flagsById.get(id) ?? [],
      inclusion,
    );
  });
}

/** Full catalog browse sheet (read-only — decision columns left empty). */
export function catalogBrowseRows(
  words: ValidatedWord[],
  setTitles: Map<string, string>,
): ReviewSheetRow[] {
  return [...words]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((w) => ({
      ...wordToReviewRow(
        w,
        setTitles.get(w.id) ?? "",
        flagsForWord(w),
        "must",
      ),
      inclusion: "must" as InclusionKind,
      decision: "",
      comment: "read-only",
    }));
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function rowsToCsv(rows: ReviewSheetRow[]): string {
  const header = REVIEW_SHEET_HEADERS.join(",");
  const lines = rows.map((r) =>
    REVIEW_SHEET_HEADERS.map((h) => csvEscape(String(r[h] ?? ""))).join(","),
  );
  return "\uFEFF" + [header, ...lines].join("\n") + "\n";
}

export function rowToCells(r: ReviewSheetRow): string[] {
  return REVIEW_SHEET_HEADERS.map((h) => String(r[h] ?? ""));
}

export function parseReviewCsv(text: string): ReviewSheetRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = table[0]!;
  const idx = (name: string) => header.indexOf(name);
  for (const h of REVIEW_SHEET_HEADERS) {
    if (idx(h) < 0) {
      throw new Error(`Review sheet missing column: ${h}`);
    }
  }
  return table.slice(1).map((cells) => {
    const get = (name: ReviewSheetHeader) => cells[idx(name)] ?? "";
    return {
      id: get("id"),
      word: get("word"),
      pos: get("pos"),
      level: get("level") as CefrLevel,
      topic: get("topic"),
      set_title: get("set_title"),
      ipa: get("ipa"),
      meaningVi: get("meaningVi"),
      definitionEn: get("definitionEn"),
      example1_en: get("example1_en"),
      example1_vi: get("example1_vi"),
      example2_en: get("example2_en"),
      example2_vi: get("example2_vi"),
      collocations: get("collocations"),
      notes: get("notes"),
      flags: get("flags"),
      inclusion: get("inclusion") as InclusionKind,
      decision: get("decision").trim().toLowerCase(),
      fixed_meaningVi: get("fixed_meaningVi"),
      fixed_definitionEn: get("fixed_definitionEn"),
      fixed_example1_en: get("fixed_example1_en"),
      fixed_example1_vi: get("fixed_example1_vi"),
      fixed_example2_en: get("fixed_example2_en"),
      fixed_example2_vi: get("fixed_example2_vi"),
      comment: get("comment"),
    };
  });
}

export type QualityGateBand = "accept" | "warn" | "stop";

export type QualityGateResult = {
  sampleSize: number;
  fixOrDrop: number;
  errorRate: number;
  band: QualityGateBand;
  byLevel: Record<
    CefrLevel,
    { sample: number; fixOrDrop: number; errorRate: number }
  >;
  errorTypes: Record<string, number>;
};

export function qualityGateBand(rate: number): QualityGateBand {
  if (rate <= QUALITY_GATE_ACCEPT) return "accept";
  if (rate <= QUALITY_GATE_WARN) return "warn";
  return "stop";
}

/**
 * Error rate = (fix|drop in stratified sample) / sample size.
 * Must-include rows are excluded from the gate denominator.
 */
export function computeQualityGate(
  filled: FilledReviewRow[],
): QualityGateResult {
  const sample = filled.filter((r) => r.inclusion === "sample");
  const byLevel: QualityGateResult["byLevel"] = {
    A1: { sample: 0, fixOrDrop: 0, errorRate: 0 },
    A2: { sample: 0, fixOrDrop: 0, errorRate: 0 },
    B1: { sample: 0, fixOrDrop: 0, errorRate: 0 },
    B2: { sample: 0, fixOrDrop: 0, errorRate: 0 },
  };
  const errorTypes: Record<string, number> = {};
  let fixOrDrop = 0;

  for (const r of sample) {
    byLevel[r.level].sample += 1;
    if (r.decision === "fix" || r.decision === "drop") {
      fixOrDrop += 1;
      byLevel[r.level].fixOrDrop += 1;
      const key = r.comment.trim() || r.flags || r.decision;
      errorTypes[key] = (errorTypes[key] ?? 0) + 1;
    }
  }
  for (const lv of Object.keys(byLevel) as CefrLevel[]) {
    const b = byLevel[lv];
    b.errorRate = b.sample === 0 ? 0 : b.fixOrDrop / b.sample;
  }
  const errorRate = sample.length === 0 ? 0 : fixOrDrop / sample.length;
  return {
    sampleSize: sample.length,
    fixOrDrop,
    errorRate,
    band: qualityGateBand(errorRate),
    byLevel,
    errorTypes,
  };
}

export function readValidatedWords(
  filePath = PATHS.validatedJsonl,
): ValidatedWord[] {
  if (!existsSync(filePath)) return [];
  return readFileSync(filePath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ValidatedWord);
}
