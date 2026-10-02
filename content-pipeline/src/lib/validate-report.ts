import { mkdirSync, writeFileSync } from "node:fs";

import { PATHS, type CefrLevel } from "../../config";
import type { ValidatedWord } from "./review";
import type { ValidationIssue } from "./validate";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildIssueCounts(
  words: ValidatedWord[],
  catalogIssues: ValidationIssue[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  const bump = (code: string) => {
    counts[code] = (counts[code] ?? 0) + 1;
  };
  for (const i of catalogIssues) bump(i.code);
  for (const w of words) {
    for (const i of w.validationIssues) bump(i.code);
    for (const i of w.aiReview.issues) {
      if (!w.validationIssues.some((r) => r.code === i.code)) {
        bump(`AI_${i.code}`);
      }
    }
  }
  return counts;
}

export function topIssueTypes(
  counts: Record<string, number>,
  n = 10,
): Array<{ code: string; count: number }> {
  return Object.entries(counts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
    .slice(0, n);
}

export function writeReviewQueueCsv(
  words: ValidatedWord[],
  filePath = PATHS.reviewQueueCsv,
): number {
  const rows = words.filter(
    (w) =>
      w.reviewStatus === "needs_human" ||
      w.validationIssues.some((i) => i.severity === "warning"),
  );
  const header = [
    "id",
    "word",
    "partOfSpeech",
    "level",
    "topicId",
    "reviewStatus",
    "verdict",
    "errorCodes",
    "warningCodes",
    "aiIssueCodes",
    "meaningVi",
    "definitionEn",
    "example1_en",
    "example2_en",
    "regenerateAttempt",
  ];
  const lines = rows.map((w) => {
    const errors = w.validationIssues
      .filter((i) => i.severity === "error")
      .map((i) => i.code);
    const warnings = w.validationIssues
      .filter((i) => i.severity === "warning")
      .map((i) => i.code);
    return [
      w.id,
      w.word,
      w.partOfSpeech,
      w.level,
      w.topicId,
      w.reviewStatus,
      w.aiReview.verdict,
      errors.join("|"),
      warnings.join("|"),
      w.aiReview.issues.map((i) => i.code).join("|"),
      w.meaningVi,
      w.definitionEn,
      w.examples[0]?.en ?? "",
      w.examples[1]?.en ?? "",
      String(w.regenerateAttempt),
    ]
      .map((c) => csvEscape(String(c)))
      .join(",");
  });
  mkdirSync(PATHS.workDir, { recursive: true });
  writeFileSync(
    filePath,
    "\uFEFF" + [header.join(","), ...lines].join("\n") + "\n",
    "utf8",
  );
  return rows.length;
}

export function writeValidatedJsonl(
  words: ValidatedWord[],
  filePath = PATHS.validatedJsonl,
): void {
  mkdirSync(PATHS.workDir, { recursive: true });
  const lines =
    [...words]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((w) => JSON.stringify(w))
      .join("\n") + (words.length ? "\n" : "");
  writeFileSync(filePath, lines, "utf8");
}

export function pickMistakeExamples(
  words: ValidatedWord[],
  n = 20,
): Array<{
  id: string;
  word: string;
  code: string;
  message: string;
  snippet: string;
}> {
  const out: Array<{
    id: string;
    word: string;
    code: string;
    message: string;
    snippet: string;
  }> = [];
  for (const w of words) {
    for (const i of w.validationIssues) {
      if (i.severity !== "error" && i.code !== "LEVEL_LEAK" && i.code !== "EX_DUP") {
        continue;
      }
      out.push({
        id: w.id,
        word: w.word,
        code: i.code,
        message: i.message,
        snippet: w.definitionEn.slice(0, 80),
      });
      if (out.length >= n) return out;
    }
    for (const i of w.aiReview.issues) {
      out.push({
        id: w.id,
        word: w.word,
        code: `AI_${i.code}`,
        message: i.message,
        snippet: w.meaningVi.slice(0, 80),
      });
      if (out.length >= n) return out;
    }
  }
  return out;
}

export function writeValidationReportMd(
  words: ValidatedWord[],
  catalogIssues: ValidationIssue[],
  meta: {
    regeneratedIds: string[];
    stillFailingAfterRegen: string[];
    promptVersion: string;
  },
  filePath = PATHS.validationReportMd,
): string {
  const counts = buildIssueCounts(words, catalogIssues);
  const top = topIssueTypes(counts, 10);
  const byLevel: Record<CefrLevel, { total: number; checked: number; human: number }> = {
    A1: { total: 0, checked: 0, human: 0 },
    A2: { total: 0, checked: 0, human: 0 },
    B1: { total: 0, checked: 0, human: 0 },
    B2: { total: 0, checked: 0, human: 0 },
  };
  const byTopic = new Map<
    string,
    { total: number; checked: number; human: number }
  >();
  let checked = 0;
  let human = 0;
  let withWarnings = 0;

  for (const w of words) {
    byLevel[w.level].total += 1;
    if (w.reviewStatus === "ai_checked") {
      checked += 1;
      byLevel[w.level].checked += 1;
    } else {
      human += 1;
      byLevel[w.level].human += 1;
    }
    if (w.validationIssues.some((i) => i.severity === "warning")) {
      withWarnings += 1;
    }
    const t = byTopic.get(w.topicId) ?? { total: 0, checked: 0, human: 0 };
    t.total += 1;
    if (w.reviewStatus === "ai_checked") t.checked += 1;
    else t.human += 1;
    byTopic.set(w.topicId, t);
  }

  const mistakes = pickMistakeExamples(words, 20);
  const topicLines = [...byTopic.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(
      ([topic, s]) =>
        `| ${topic} | ${s.total} | ${s.checked} | ${s.human} |`,
    )
    .join("\n");

  const md = `# Validation report (Phase 5)

Generated: ${new Date().toISOString()}  
Prompt: \`${meta.promptVersion}\` · Cursor-only ($0 API)

## Summary

| Metric | Count |
|---|---:|
| Total words | ${words.length} |
| \`ai_checked\` | ${checked} |
| \`needs_human\` | ${human} |
| With warnings (any) | ${withWarnings} |
| Catalog-level issues | ${catalogIssues.length} |
| Regenerated once | ${meta.regeneratedIds.length} |
| Still failing after regen | ${meta.stillFailingAfterRegen.length} |

## By level

| Level | Total | ai_checked | needs_human |
|---|---:|---:|---:|
| A1 | ${byLevel.A1.total} | ${byLevel.A1.checked} | ${byLevel.A1.human} |
| A2 | ${byLevel.A2.total} | ${byLevel.A2.checked} | ${byLevel.A2.human} |
| B1 | ${byLevel.B1.total} | ${byLevel.B1.checked} | ${byLevel.B1.human} |
| B2 | ${byLevel.B2.total} | ${byLevel.B2.checked} | ${byLevel.B2.human} |

## By topic

| Topic | Total | ai_checked | needs_human |
|---|---:|---:|---:|
${topicLines}

## Counts per rule / issue code

| Code | Count |
|---|---:|
${Object.entries(counts)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([code, n]) => `| ${code} | ${n} |`)
  .join("\n")}

## Top 10 issue types

| # | Code | Count |
|---|---|---:|
${top.map((t, i) => `| ${i + 1} | ${t.code} | ${t.count} |`).join("\n")}

## 20 example mistakes caught

${mistakes
  .map(
    (m, i) =>
      `${i + 1}. \`${m.id}\` **${m.word}** — \`${m.code}\`: ${m.message} _(def: ${m.snippet})_`,
  )
  .join("\n") || "_None_"}

## Notes

- Fixes from AI review are stored on \`fixedCopy\` only; originals kept.
- Nothing marked \`human_reviewed\`; no DB import.
`;

  mkdirSync(PATHS.workDir, { recursive: true });
  writeFileSync(filePath, md, "utf8");
  return md;
}
