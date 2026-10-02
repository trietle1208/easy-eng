import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import {
  PATHS,
  QUALITY_GATE_ACCEPT,
  QUALITY_GATE_WARN,
  type CefrLevel,
} from "../../config";
import {
  computeQualityGate,
  parseReviewCsv,
  readValidatedWords,
  REVIEW_DECISIONS,
  rowsToCsv,
  type FilledReviewRow,
  type QualityGateResult,
  type ReviewDecision,
  type ReviewSheetRow,
} from "./human-review";
import type { ValidatedWord } from "./review";
import { writeValidatedJsonl } from "./validate-report";

export type ImportConflict = {
  id: string;
  code: string;
  message: string;
};

export type ImportReviewResult = {
  ok: boolean;
  conflicts: ImportConflict[];
  decided: number;
  appliedFixes: number;
  dropped: ValidatedWord[];
  kept: ValidatedWord[];
  qualityGate: QualityGateResult | null;
  decidedIds: string[];
};

function isDecision(v: string): v is ReviewDecision {
  return (REVIEW_DECISIONS as readonly string[]).includes(v);
}

function fixFieldsPresent(r: ReviewSheetRow): boolean {
  return Boolean(
    r.fixed_meaningVi.trim() ||
      r.fixed_definitionEn.trim() ||
      r.fixed_example1_en.trim() ||
      r.fixed_example1_vi.trim() ||
      r.fixed_example2_en.trim() ||
      r.fixed_example2_vi.trim(),
  );
}

function applyFixToWord(w: ValidatedWord, r: ReviewSheetRow): ValidatedWord {
  const meaningVi = r.fixed_meaningVi.trim() || w.meaningVi;
  const definitionEn = r.fixed_definitionEn.trim() || w.definitionEn;
  const ex1en = r.fixed_example1_en.trim() || w.examples[0]?.en || "";
  const ex1vi = r.fixed_example1_vi.trim() || w.examples[0]?.vi || "";
  const ex2en = r.fixed_example2_en.trim() || w.examples[1]?.en || "";
  const ex2vi = r.fixed_example2_vi.trim() || w.examples[1]?.vi || "";
  return {
    ...w,
    meaningVi,
    definitionEn,
    examples: [
      { en: ex1en, vi: ex1vi },
      { en: ex2en, vi: ex2vi },
    ],
    reviewStatus: "human_reviewed",
    humanDecision: "fix",
    humanComment: r.comment.trim() || null,
  };
}

/**
 * Validate a filled review sheet. Reports conflicts instead of guessing.
 * Empty `decision` rows are skipped (not decided — stay as-is).
 */
export function validateFilledSheet(
  rows: ReviewSheetRow[],
  catalog: Map<string, ValidatedWord>,
): { conflicts: ImportConflict[]; filled: FilledReviewRow[] } {
  const conflicts: ImportConflict[] = [];
  const filled: FilledReviewRow[] = [];
  const seen = new Set<string>();

  for (const r of rows) {
    if (!r.id.trim()) {
      conflicts.push({
        id: "",
        code: "EMPTY_ID",
        message: "Row with empty id",
      });
      continue;
    }
    if (seen.has(r.id)) {
      conflicts.push({
        id: r.id,
        code: "DUP_ROW",
        message: "Duplicate id in sheet",
      });
      continue;
    }
    seen.add(r.id);

    if (!catalog.has(r.id)) {
      conflicts.push({
        id: r.id,
        code: "UNKNOWN_ID",
        message: "Id not in validated.jsonl",
      });
      continue;
    }

    const decision = r.decision.trim().toLowerCase();
    if (!decision) continue; // undecided — leave alone

    if (!isDecision(decision)) {
      conflicts.push({
        id: r.id,
        code: "BAD_DECISION",
        message: `decision must be ok|fix|drop, got "${r.decision}"`,
      });
      continue;
    }

    if (decision === "fix" && !fixFieldsPresent(r)) {
      conflicts.push({
        id: r.id,
        code: "EMPTY_FIX",
        message: "decision=fix but all fixed_* columns are empty",
      });
      continue;
    }

    if (decision === "fix") {
      // Partial fixes OK; require at least one example pair completeness if either side set
      const e1en = r.fixed_example1_en.trim();
      const e1vi = r.fixed_example1_vi.trim();
      const e2en = r.fixed_example2_en.trim();
      const e2vi = r.fixed_example2_vi.trim();
      if ((e1en && !e1vi) || (!e1en && e1vi) || (e2en && !e2vi) || (!e2en && e2vi)) {
        conflicts.push({
          id: r.id,
          code: "PARTIAL_EXAMPLE_FIX",
          message: "example fix needs both en and vi",
        });
        continue;
      }
    }

    filled.push({ ...r, decision });
  }

  return { conflicts, filled };
}

export function applyFilledReviews(
  catalogWords: ValidatedWord[],
  filled: FilledReviewRow[],
): {
  kept: ValidatedWord[];
  dropped: ValidatedWord[];
  appliedFixes: number;
  decidedIds: string[];
} {
  const byId = new Map(catalogWords.map((w) => [w.id, w]));
  const dropped: ValidatedWord[] = [];
  const decidedIds: string[] = [];
  let appliedFixes = 0;

  for (const r of filled) {
    const w = byId.get(r.id);
    if (!w) continue;
    decidedIds.push(r.id);
    if (r.decision === "drop") {
      dropped.push(w);
      byId.delete(r.id);
      continue;
    }
    if (r.decision === "fix") {
      byId.set(r.id, applyFixToWord(w, r));
      appliedFixes += 1;
    } else {
      byId.set(r.id, {
        ...w,
        reviewStatus: "human_reviewed",
        humanDecision: "ok",
        humanComment: r.comment.trim() || null,
      });
    }
  }

  const kept = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  return { kept, dropped, appliedFixes, decidedIds };
}

export function importReviewSheet(
  filledCsvText: string,
  opts: {
    catalog?: ValidatedWord[];
    dryRun?: boolean;
    writeOutputs?: boolean;
  } = {},
): ImportReviewResult {
  const catalogList = opts.catalog ?? readValidatedWords();
  const catalog = new Map(catalogList.map((w) => [w.id, w]));
  const rows = parseReviewCsv(filledCsvText);
  const { conflicts, filled } = validateFilledSheet(rows, catalog);

  if (conflicts.length) {
    return {
      ok: false,
      conflicts,
      decided: 0,
      appliedFixes: 0,
      dropped: [],
      kept: catalogList,
      qualityGate: null,
      decidedIds: [],
    };
  }

  const { kept, dropped, appliedFixes, decidedIds } = applyFilledReviews(
    catalogList,
    filled,
  );
  const qualityGate = computeQualityGate(filled);

  if (!opts.dryRun && opts.writeOutputs !== false) {
    mkdirSync(PATHS.workDir, { recursive: true });
    writeValidatedJsonl(kept, PATHS.validatedJsonl);
    if (dropped.length) removeDroppedFromSets(dropped.map((w) => w.id));
    writeFileSync(
      PATHS.reviewDroppedLog,
      dropped.map((w) => JSON.stringify({ id: w.id, word: w.word, level: w.level, topicId: w.topicId })).join("\n") +
        (dropped.length ? "\n" : ""),
      "utf8",
    );
    writeFileSync(PATHS.reviewFilledCsv, rowsToCsv(filled), "utf8");
    writeFileSync(
      PATHS.qualityGateMd,
      formatQualityGateMd(qualityGate, {
        decided: decidedIds.length,
        appliedFixes,
        dropped: dropped.length,
        kept: kept.length,
      }),
      "utf8",
    );
    writeFileSync(
      PATHS.phase6Manifest,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          decided: decidedIds.length,
          appliedFixes,
          dropped: dropped.length,
          kept: kept.length,
          humanReviewed: kept.filter((w) => w.reviewStatus === "human_reviewed")
            .length,
          aiCheckedRemaining: kept.filter((w) => w.reviewStatus === "ai_checked")
            .length,
          qualityGate: {
            band: qualityGate.band,
            errorRate: qualityGate.errorRate,
            sampleSize: qualityGate.sampleSize,
            fixOrDrop: qualityGate.fixOrDrop,
            byLevel: qualityGate.byLevel,
            thresholds: {
              accept: QUALITY_GATE_ACCEPT,
              warn: QUALITY_GATE_WARN,
            },
          },
          hashes: {
            note: "validated.jsonl git-ignored; review-filled.csv / quality-gate.md committed when present",
          },
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
  }

  return {
    ok: true,
    conflicts: [],
    decided: decidedIds.length,
    appliedFixes,
    dropped,
    kept,
    qualityGate,
    decidedIds,
  };
}

/** Strip dropped word ids from sets.json so catalog refs stay consistent. */
export function removeDroppedFromSets(droppedIds: string[]): number {
  if (!droppedIds.length || !existsSync(PATHS.setsJson)) return 0;
  const drop = new Set(droppedIds);
  const raw = JSON.parse(readFileSync(PATHS.setsJson, "utf8")) as {
    generatedFrom?: unknown;
    setCount?: number;
    folds?: unknown;
    sets: Array<{ wordIds: string[]; words?: string[]; [k: string]: unknown }>;
  };
  let removed = 0;
  for (const s of raw.sets) {
    const keepIdx: number[] = [];
    s.wordIds.forEach((id, i) => {
      if (!drop.has(id)) keepIdx.push(i);
      else removed += 1;
    });
    const nextIds = keepIdx.map((i) => s.wordIds[i]!);
    if (Array.isArray(s.words) && s.words.length === s.wordIds.length) {
      s.words = keepIdx.map((i) => s.words![i]!);
    }
    s.wordIds = nextIds;
  }
  raw.setCount = raw.sets.length;
  writeFileSync(PATHS.setsJson, JSON.stringify(raw, null, 2) + "\n", "utf8");
  return removed;
}

export function formatQualityGateMd(
  gate: QualityGateResult,
  counts: {
    decided: number;
    appliedFixes: number;
    dropped: number;
    kept: number;
  },
): string {
  const pct = (r: number) => `${(r * 100).toFixed(2)}%`;
  const levels = (["A1", "A2", "B1", "B2"] as CefrLevel[])
    .map((lv) => {
      const b = gate.byLevel[lv];
      return `| ${lv} | ${b.sample} | ${b.fixOrDrop} | ${pct(b.errorRate)} |`;
    })
    .join("\n");
  const types = Object.entries(gate.errorTypes)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `| ${k.replace(/\|/g, "\\|")} | ${n} |`)
    .join("\n");

  return `# Quality gate (Phase 6)

Generated: ${new Date().toISOString()}

## Summary

| Metric | Value |
|---|---:|
| Decided rows | ${counts.decided} |
| Fixes applied | ${counts.appliedFixes} |
| Dropped | ${counts.dropped} |
| Catalog kept | ${counts.kept} |
| Sample size | ${gate.sampleSize} |
| Sample fix\\|drop | ${gate.fixOrDrop} |
| **Error rate** | **${pct(gate.errorRate)}** |
| Band | \`${gate.band}\` |
| Accept ≤ | ${pct(QUALITY_GATE_ACCEPT)} |
| Warn ≤ | ${pct(QUALITY_GATE_WARN)} |

## By level (sample only)

| Level | Sample | fix\\|drop | Error rate |
|---|---:|---:|---:|
${levels}

## Error / comment types (sample fix\\|drop)

| Note | Count |
|---|---:|
${types || "| _(none)_ | 0 |"}

## Band meaning

- \`accept\` (≤3%): unreviewed remainder may stay \`ai_checked\` and publish.
- \`warn\` (3–8%): propose prompt/rule changes; re-run Phases 4–5 for affected slices; second sample 10%.
- \`stop\` (>8%): stop and report root causes.
`;
}
