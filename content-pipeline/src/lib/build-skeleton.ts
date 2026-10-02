import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  LEVEL_ORDER,
  LEVEL_QUOTAS,
  PATHS,
  SAMPLE_SEED,
  SAMPLE_SIZE,
  SOURCE_TAG,
  type CefrLevel,
} from "../../config";
import { parseCsv } from "./csv";
import { loadFrequencyRanks } from "./frequency";
import { loadCmudict } from "./ipa";
import { buildCandidates } from "./normalise";
import { selectByQuotas, seededSample } from "./select";
import type {
  CefrRow,
  RejectedRow,
  SkeletonManifest,
  SkeletonWord,
} from "./types";

export type BuildSkeletonResult = {
  words: SkeletonWord[];
  rejected: RejectedRow[];
  reservedExcluded: Array<{ word: string; partOfSpeech: string }>;
  manifest: SkeletonManifest;
  sample: SkeletonWord[];
  cefrjSha256: string;
};

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function parseCefrjCsv(text: string): CefrRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0]!.map((h) => h.trim());
  const expected = [
    "headword",
    "pos",
    "CEFR",
    "CoreInventory 1",
    "CoreInventory 2",
    "Threshold",
  ];
  for (let i = 0; i < expected.length; i++) {
    if (header[i] !== expected[i]) {
      throw new Error(
        `Unexpected CEFR-J header at col ${i}: got ${JSON.stringify(header[i])}, want ${JSON.stringify(expected[i])}`,
      );
    }
  }

  const out: CefrRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]!;
    out.push({
      headword: r[0] ?? "",
      pos: r[1] ?? "",
      cefr: r[2] ?? "",
      coreInventory1: r[3] ?? "",
      coreInventory2: r[4] ?? "",
      threshold: r[5] ?? "",
      line: i + 1,
    });
  }
  return out;
}

export function buildSkeleton(options?: {
  cefrjPath?: string;
  cmudictPath?: string;
  frequencyPath?: string;
  quotas?: Record<CefrLevel, number>;
  sampleSize?: number;
  sampleSeed?: number;
  generatedAt?: string;
}): BuildSkeletonResult {
  const cefrjPath = options?.cefrjPath ?? PATHS.cefrjCsv;
  const cmudictPath = options?.cmudictPath ?? PATHS.cmudict;
  const frequencyPath = options?.frequencyPath ?? PATHS.frequency;
  const quotas = options?.quotas ?? LEVEL_QUOTAS;
  const sampleSize = options?.sampleSize ?? SAMPLE_SIZE;
  const sampleSeed = options?.sampleSeed ?? SAMPLE_SEED;

  const cefrjText = readFileSync(cefrjPath, "utf8");
  const cefrjSha256 = sha256(cefrjText);
  const rows = parseCefrjCsv(cefrjText);
  const { candidates, rejected, reservedExcluded } = buildCandidates(rows);

  const frequencyRanks = loadFrequencyRanks(frequencyPath);
  const cmudict = loadCmudict(cmudictPath);
  const words = selectByQuotas(candidates, frequencyRanks, cmudict, quotas);

  const byLevel = Object.fromEntries(
    LEVEL_ORDER.map((l) => [l, 0]),
  ) as Record<CefrLevel, number>;
  const byPos: Record<string, number> = {};
  let flagged = 0;
  let ipaMissing = 0;
  let ipaDictionary = 0;
  let multiWord = 0;
  let withFrequencyRank = 0;

  for (const w of words) {
    byLevel[w.level] += 1;
    byPos[w.partOfSpeech] = (byPos[w.partOfSpeech] ?? 0) + 1;
    if (w.flagged) flagged += 1;
    if (w.ipaSource === "missing") ipaMissing += 1;
    else ipaDictionary += 1;
    if (w.isMultiWord) multiWord += 1;
    if (w.frequencyRank != null) withFrequencyRank += 1;
  }

  const byReason: Record<string, number> = {};
  for (const r of rejected) {
    const key = r.reason.includes(":")
      ? r.reason.slice(0, r.reason.indexOf(":"))
      : r.reason;
    byReason[key] = (byReason[key] ?? 0) + 1;
  }

  const skeletonBody =
    words.map((w) => JSON.stringify(w)).join("\n") + (words.length ? "\n" : "");
  const skeletonSha256 = sha256(skeletonBody);

  const quotaTolerancePct = 2;
  let withinQuotaTolerance = true;
  for (const level of LEVEL_ORDER) {
    const target = quotas[level];
    const actual = byLevel[level];
    const pct = target === 0 ? 0 : (Math.abs(actual - target) / target) * 100;
    if (pct > quotaTolerancePct && actual !== target) {
      // Exact match preferred; allow ±2% only when pool is short.
      if (actual < target * (1 - quotaTolerancePct / 100)) {
        withinQuotaTolerance = false;
      }
    }
    // Over-quota should never happen (we slice to quota).
    if (actual > target) withinQuotaTolerance = false;
  }

  const generatedAt = options?.generatedAt ?? new Date().toISOString();

  const manifest: SkeletonManifest = {
    generatedAt,
    source: SOURCE_TAG,
    quotas: { ...quotas },
    totals: {
      selected: words.length,
      byLevel,
      byPos,
      flagged,
      ipaMissing,
      ipaDictionary,
      multiWord,
      withFrequencyRank,
    },
    rejected: {
      total: rejected.length,
      byReason,
      samples: rejected.slice(0, 50),
    },
    reservedExcluded,
    quotaTolerancePct,
    withinQuotaTolerance,
    hashes: {
      skeletonSha256,
      cefrjSha256,
    },
  };

  const sample = seededSample(words, sampleSize, sampleSeed).sort(
    (a, b) =>
      a.word.localeCompare(b.word) ||
      a.partOfSpeech.localeCompare(b.partOfSpeech),
  );

  return {
    words,
    rejected,
    reservedExcluded,
    manifest,
    sample,
    cefrjSha256,
  };
}

export function sampleToCsv(words: SkeletonWord[]): string {
  const header = [
    "id",
    "word",
    "partOfSpeech",
    "level",
    "ipa",
    "ipaSource",
    "frequencyRank",
    "flagged",
    "isMultiWord",
    "notes",
  ];
  const escape = (v: string) => {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const lines = [header.join(",")];
  for (const w of words) {
    lines.push(
      [
        w.id,
        w.word,
        w.partOfSpeech,
        w.level,
        w.ipa ?? "",
        w.ipaSource,
        w.frequencyRank?.toString() ?? "",
        w.flagged ? "1" : "0",
        w.isMultiWord ? "1" : "0",
        w.notes ?? "",
      ]
        .map(escape)
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}
