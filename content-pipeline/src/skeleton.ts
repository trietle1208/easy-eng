/**
 * Phase 2 — build vocabulary skeleton from CEFR-J + CMUdict + Google Books ranks.
 * No model calls. No DB import.
 *
 * Usage: pnpm content:skeleton
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { PATHS } from "../config";
import { buildSkeleton, sampleToCsv } from "./lib/build-skeleton";

function main() {
  const result = buildSkeleton();
  mkdirSync(PATHS.workDir, { recursive: true });

  const jsonl =
    result.words.map((w) => JSON.stringify(w)).join("\n") +
    (result.words.length ? "\n" : "");
  writeFileSync(PATHS.skeletonJsonl, jsonl, "utf8");
  writeFileSync(
    PATHS.manifest,
    JSON.stringify(result.manifest, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(PATHS.skeletonSample, sampleToCsv(result.sample), "utf8");

  const { totals, rejected, reservedExcluded, withinQuotaTolerance, quotas } =
    result.manifest;

  console.log("Skeleton built.");
  console.log(`  selected: ${totals.selected}`);
  for (const [level, n] of Object.entries(totals.byLevel)) {
    console.log(`  ${level}: ${n} / quota ${quotas[level as keyof typeof quotas]}`);
  }
  console.log(`  byPos: ${JSON.stringify(totals.byPos)}`);
  console.log(`  flagged: ${totals.flagged}`);
  console.log(
    `  IPA: dictionary=${totals.ipaDictionary} missing=${totals.ipaMissing}`,
  );
  console.log(`  multiWord: ${totals.multiWord}`);
  console.log(`  withFrequencyRank: ${totals.withFrequencyRank}`);
  console.log(`  rejected: ${rejected.total} ${JSON.stringify(rejected.byReason)}`);
  console.log(`  reservedExcluded: ${JSON.stringify(reservedExcluded)}`);
  console.log(`  withinQuotaTolerance (±2%): ${withinQuotaTolerance}`);
  console.log(`  wrote ${PATHS.skeletonJsonl}`);
  console.log(`  wrote ${PATHS.manifest}`);
  console.log(`  wrote ${PATHS.skeletonSample}`);

  if (!withinQuotaTolerance) {
    console.error("ERROR: selection totals outside approved quota tolerance.");
    process.exitCode = 1;
  }
}

main();
