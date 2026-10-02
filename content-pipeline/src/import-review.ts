/**
 * Phase 6 — import filled human review sheet.
 *
 * Usage:
 *   pnpm content:import-review -- path/to/filled.csv
 *   pnpm content:import-review -- --dry-run path/to/filled.csv
 *
 * Does NOT import into the database. Only updates work/validated.jsonl.
 */
import { existsSync, readFileSync } from "node:fs";

import { importReviewSheet } from "./lib/import-review";

function parseArgs(argv: string[]) {
  let dryRun = false;
  let file: string | null = null;
  for (const a of argv) {
    if (a === "--dry-run") dryRun = true;
    else if (!a.startsWith("--")) file = a;
  }
  return { dryRun, file };
}

function main() {
  const { dryRun, file } = parseArgs(process.argv.slice(2));
  if (!file) {
    console.error(
      "Usage: pnpm content:import-review -- [--dry-run] path/to/filled.csv",
    );
    process.exit(1);
  }
  if (!existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const text = readFileSync(file, "utf8");
  const result = importReviewSheet(text, {
    dryRun,
    writeOutputs: !dryRun,
  });

  if (!result.ok) {
    console.error(`Conflicts: ${result.conflicts.length}`);
    for (const c of result.conflicts.slice(0, 40)) {
      console.error(`  [${c.code}] ${c.id || "(no id)"}: ${c.message}`);
    }
    if (result.conflicts.length > 40) {
      console.error(`  … +${result.conflicts.length - 40} more`);
    }
    process.exit(1);
  }

  const gate = result.qualityGate!;
  console.log(`Decided: ${result.decided}`);
  console.log(`Fixes applied: ${result.appliedFixes}`);
  console.log(`Dropped: ${result.dropped.length}`);
  console.log(`Kept: ${result.kept.length}`);
  console.log(
    `Quality gate: ${(gate.errorRate * 100).toFixed(2)}% (${gate.fixOrDrop}/${gate.sampleSize} sample) → ${gate.band}`,
  );
  for (const lv of ["A1", "A2", "B1", "B2"] as const) {
    const b = gate.byLevel[lv];
    console.log(
      `  ${lv}: ${(b.errorRate * 100).toFixed(2)}% (${b.fixOrDrop}/${b.sample})`,
    );
  }
  if (dryRun) console.log("(dry-run — validated.jsonl unchanged)");
}

main();
