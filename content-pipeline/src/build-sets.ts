/**
 * Phase 3 — build word sets from classified.jsonl (deterministic).
 *
 * Usage: pnpm content:build-sets
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { PATHS, SET_MAX_SIZE, SET_MIN_SIZE } from "../config";
import { buildSets, setsSummary } from "./lib/build-sets";
import { readClassifiedJsonl } from "./lib/classify";

function main() {
  const classified = readClassifiedJsonl();
  if (classified.length === 0) {
    console.error("No classified.jsonl — run pnpm content:classify first.");
    process.exit(1);
  }

  const { sets, folds } = buildSets(classified);
  const summary = setsSummary(sets);

  mkdirSync(PATHS.workDir, { recursive: true });
  const payload = {
    generatedFrom: "classified.jsonl",
    setCount: sets.length,
    folds,
    sets,
  };
  writeFileSync(PATHS.setsJson, JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log(`Built ${summary.setCount} sets from ${classified.length} words.`);
  console.log(`Size range: ${summary.sizeMin}–${summary.sizeMax} (target ${SET_MIN_SIZE}–${SET_MAX_SIZE})`);
  console.log(`Folds: ${folds.length}`);
  for (const f of folds) {
    console.log(
      `  fold ${f.topicId} ${f.fromLevel}→${f.toLevel} (${f.wordCount} words)`,
    );
  }
  if (summary.sizesOutOfRange.length) {
    console.log(`OUT OF RANGE sets (${summary.sizesOutOfRange.length}):`);
    for (const s of summary.sizesOutOfRange) {
      console.log(`  ${s.id} ${s.topicId}/${s.level} size=${s.wordIds.length}`);
    }
  }

  // Stable id check: re-run equals
  const again = buildSets(classified);
  const ids1 = sets.map((s) => s.id).join(",");
  const ids2 = again.sets.map((s) => s.id).join(",");
  console.log(`Stable ids across re-run: ${ids1 === ids2}`);
  console.log(`Wrote ${PATHS.setsJson}`);
}

main();
