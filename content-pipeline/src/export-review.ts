/**
 * Phase 6 — export human review sheet (XLSX + CSV).
 *
 * Usage:
 *   pnpm content:export-review
 *   pnpm content:export-review -- --dry-run
 *   pnpm content:export-review -- --status
 */
import { writeFileSync } from "node:fs";

import { PATHS } from "../config";
import { exportReviewSheet } from "./lib/export-review";
import { readValidatedWords } from "./lib/human-review";

function parseArgs(argv: string[]) {
  let dryRun = false;
  let status = false;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    else if (a === "--status") status = true;
  }
  return { dryRun, status };
}

function main() {
  const { dryRun, status } = parseArgs(process.argv.slice(2));
  const words = readValidatedWords();
  if (!words.length) {
    console.error("No validated.jsonl — run pnpm content:validate first.");
    process.exit(1);
  }

  if (status) {
    const result = exportReviewSheet(words, { dryRun: true });
    console.log(
      JSON.stringify(
        {
          catalog: words.length,
          reviewRows: result.reviewRows.length,
          must: result.selection.mustIds.size,
          sample: result.selection.sampleIds.size,
          remainingPool: result.selection.remainingPoolSize,
          sampleTarget: result.selection.sampleTarget,
        },
        null,
        2,
      ),
    );
    return;
  }

  const result = exportReviewSheet(words, { dryRun });
  const must = result.selection.mustIds.size;
  const sample = result.selection.sampleIds.size;

  console.log(`Catalog: ${words.length}`);
  console.log(`Review sheet rows: ${result.reviewRows.length} (must ${must} + sample ${sample})`);
  console.log(
    `Remaining pool: ${result.selection.remainingPoolSize} → sample target ${result.selection.sampleTarget}`,
  );

  if (!dryRun) {
    console.log(`Wrote ${result.paths.xlsx}`);
    console.log(`Wrote ${result.paths.reviewCsv}`);
    console.log(`Wrote ${result.paths.catalogCsv}`);
    writeFileSync(
      PATHS.phase6Manifest.replace(
        "phase6-manifest.json",
        "phase6-export-manifest.json",
      ),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          catalog: words.length,
          reviewRows: result.reviewRows.length,
          must,
          sample,
          remainingPool: result.selection.remainingPoolSize,
          sampleTarget: result.selection.sampleTarget,
          paths: result.paths,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
  } else {
    console.log("(dry-run — no files written)");
  }
}

main();
