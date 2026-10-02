/**
 * Phase 3 — classify skeleton words into topics (Cursor-only, no API).
 *
 * Usage:
 *   pnpm content:classify
 *   pnpm content:classify -- --limit 100
 */
import { mkdirSync, writeFileSync } from "node:fs";

import {
  LOW_CONFIDENCE_THRESHOLD,
  PATHS,
  SET_MIN_SIZE,
} from "../config";
import {
  classifyAll,
  countTopicLevel,
  createClassifyContext,
  lowConfidenceWords,
  readSkeletonJsonl,
  topicReportCsv,
} from "./lib/classify";
import { loadTopics } from "./lib/topics";

function parseArgs(argv: string[]) {
  let limit: number | null = null;
  let dryRun = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") {
      limit = Number(argv[++i]);
    } else if (argv[i] === "--dry-run") {
      dryRun = true;
    }
  }
  return { limit, dryRun };
}

function main() {
  const { limit, dryRun } = parseArgs(process.argv.slice(2));
  let words = readSkeletonJsonl();
  if (limit != null && Number.isFinite(limit)) {
    words = words.slice(0, limit);
  }

  const ctx = createClassifyContext();
  const classified = classifyAll(words, ctx);
  const topics = loadTopics();
  const counts = countTopicLevel(classified);
  const low = lowConfidenceWords(classified);
  const report = topicReportCsv(
    counts,
    topics.map((t) => t.id),
  );

  if (!dryRun) {
    mkdirSync(PATHS.workDir, { recursive: true });
    const jsonl =
      classified.map((w) => JSON.stringify(w)).join("\n") +
      (classified.length ? "\n" : "");
    writeFileSync(PATHS.classifiedJsonl, jsonl, "utf8");
    writeFileSync(PATHS.topicReportCsv, report, "utf8");
  }

  console.log(`Classified ${classified.length} words (dryRun=${dryRun}).`);
  console.log(`Methods: ${summarizeMethods(classified)}`);
  console.log(`Low confidence (<${LOW_CONFIDENCE_THRESHOLD}): ${low.length}`);
  console.log("Topic × level:");
  console.log(report.trimEnd());

  // Flag tiny / huge cells before set building
  for (const t of topics) {
    for (const level of ["A1", "A2", "B1", "B2"] as const) {
      const n = counts[t.id]?.[level] ?? 0;
      if (n > 0 && n < SET_MIN_SIZE) {
        console.log(`  SMALL cell: ${t.id} / ${level} = ${n}`);
      }
      if (n > 90) {
        console.log(`  LARGE cell: ${t.id} / ${level} = ${n}`);
      }
    }
  }

  if (!dryRun) {
    console.log(`Wrote ${PATHS.classifiedJsonl}`);
    console.log(`Wrote ${PATHS.topicReportCsv}`);
  }
}

function summarizeMethods(words: { classifyMethod: string }[]): string {
  const m = new Map<string, number>();
  for (const w of words) {
    m.set(w.classifyMethod, (m.get(w.classifyMethod) ?? 0) + 1);
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}:${v}`)
    .join(", ");
}

main();
