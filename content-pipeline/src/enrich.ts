/**
 * Phase 4 — enrich classified words (Cursor-only, no Anthropic API).
 *
 * Usage:
 *   pnpm content:enrich -- --pilot              # select 100 + write pending batches
 *   pnpm content:enrich -- --apply PATH.json    # validate agent output, merge JSONL
 *   pnpm content:enrich -- --export-pilot       # write work/pilot.csv from enriched
 *   pnpm content:enrich -- --status             # progress summary
 *   pnpm content:enrich -- --limit 50           # full-run prep: pending for unenriched
 *   pnpm content:enrich -- --dry-run
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  ENRICH_BATCH_SIZE,
  ENRICH_BUDGET_CAP,
  ENRICH_PROMPT_VERSION,
  PATHS,
  PILOT_SEED,
  SOURCE_TAG_ENRICHED,
} from "../config";
import type { ClassifiedWord } from "./lib/classify";
import {
  appendFailed,
  applyEnrichBatch,
  enrichInputHash,
  pendingExpectedIds,
  readClassifiedJsonl,
  readEnrichedJsonl,
  selectPilotWords,
  summarizePilotMix,
  toEnrichInput,
  unwrapBatchPayload,
  upsertEnrichedJsonl,
  writePendingBatches,
  writePilotCsv,
  writePilotWords,
  type EnrichedWord,
} from "./lib/enrich";

function parseArgs(argv: string[]) {
  let limit: number | null = null;
  let dryRun = false;
  let pilot = false;
  let exportPilot = false;
  let status = false;
  let applyPath: string | null = null;
  let retryFailed = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit") limit = Number(argv[++i]);
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--pilot") pilot = true;
    else if (a === "--export-pilot") exportPilot = true;
    else if (a === "--status") status = true;
    else if (a === "--apply") applyPath = argv[++i] ?? null;
    else if (a === "--retry-failed") retryFailed = true;
  }
  return { limit, dryRun, pilot, exportPilot, status, applyPath, retryFailed };
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const classified = readClassifiedJsonl();
  const classifiedById = new Map(classified.map((w) => [w.id, w]));
  const enriched = readEnrichedJsonl();

  if (args.status) {
    printStatus(classified.length, enriched);
    return;
  }

  if (args.exportPilot) {
    if (!existsSync(PATHS.pilotWordsJson)) {
      console.error("Missing pilot-words.json — run --pilot first.");
      process.exit(1);
    }
    const pilotMeta = readJson(PATHS.pilotWordsJson) as {
      words: { id: string }[];
    };
    const rows: EnrichedWord[] = [];
    for (const w of pilotMeta.words) {
      const e = enriched.get(w.id);
      if (!e) {
        console.error(`Pilot word not enriched yet: ${w.id}`);
        process.exit(1);
      }
      rows.push(e);
    }
    if (!args.dryRun) writePilotCsv(rows);
    console.log(`Pilot CSV rows: ${rows.length}`);
    if (!args.dryRun) console.log(`Wrote ${PATHS.pilotCsv}`);
    writePhase4Manifest(classified.length, enriched, { stage: "pilot_export" });
    return;
  }

  if (args.applyPath) {
    applyOne(args.applyPath, classifiedById, args.dryRun);
    return;
  }

  if (args.pilot) {
    const pilotWords = selectPilotWords(classified);
    const mix = summarizePilotMix(pilotWords);
    console.log(
      `Pilot selection: ${pilotWords.length} words (seed=${PILOT_SEED})`,
    );
    console.log(`  byLevel: ${JSON.stringify(mix.byLevel)}`);
    console.log(
      `  multiWord=${mix.multiWord} irregularVerbs=${mix.irregularVerbs} polysemous=${mix.polysemous} topics=${mix.topics}`,
    );

    if (args.dryRun) return;

    writePilotWords(pilotWords);
    const pending = writePendingBatches(pilotWords, ENRICH_BATCH_SIZE);
    writePhase4Manifest(classified.length, enriched, {
      stage: "pilot_pending",
      pilotCount: pilotWords.length,
      pendingBatches: pending.length,
    });
    console.log(`Wrote ${PATHS.pilotWordsJson}`);
    for (const p of pending) console.log(`  pending batch: ${p}`);
    console.log(
      `\nNext: fill each pending-*.json using prompts/enrich.v1.md,\n` +
        `save as done-NN.json (array of enrich objects), then:\n` +
        `  pnpm content:enrich -- --apply content-pipeline/work/enrich-batches/done-01.json\n` +
        `When all 100 are merged: pnpm content:enrich -- --export-pilot`,
    );
    return;
  }

  const budget = Math.min(args.limit ?? ENRICH_BUDGET_CAP, ENRICH_BUDGET_CAP);
  let todo = classified.filter((w) => {
    const existing = enriched.get(w.id);
    if (!existing) return true;
    const hash = enrichInputHash(toEnrichInput(w));
    return (
      existing.enrichInputHash !== hash ||
      existing.enrichPromptVersion !== ENRICH_PROMPT_VERSION
    );
  });

  if (args.retryFailed && existsSync(PATHS.enrichFailedJsonl)) {
    const failedIds = new Set(
      readFileSync(PATHS.enrichFailedJsonl, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((l) => (JSON.parse(l) as { id: string }).id),
    );
    todo = classified.filter((w) => failedIds.has(w.id));
  }

  todo = todo.slice(0, budget);
  console.log(
    `Unenriched / stale: preparing ${todo.length} (budget cap ${ENRICH_BUDGET_CAP})`,
  );
  if (args.dryRun) return;

  const pending = writePendingBatches(todo, ENRICH_BATCH_SIZE);
  writePhase4Manifest(classified.length, enriched, {
    stage: "full_pending",
    pendingWords: todo.length,
    pendingBatches: pending.length,
  });
  for (const p of pending) console.log(`  pending batch: ${p}`);
}

function applyOne(
  applyPath: string,
  classifiedById: Map<string, ClassifiedWord>,
  dryRun: boolean,
) {
  const abs = path.resolve(applyPath);
  if (!existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }

  const base = path.basename(abs);
  const m = base.match(/^(?:done|retry|done-retry)-(\d+)\.json$/);
  const rawFile = unwrapBatchPayload(readJson(abs));

  let expectedIds: string[] | null = null;
  // Retries only re-send failed ids — use payload ids, not the full pending batch
  if (base.includes("retry") && Array.isArray(rawFile)) {
    expectedIds = (rawFile as { id: string }[]).map((x) => x.id);
  } else if (m) {
    const pending = path.join(PATHS.enrichBatchesDir, `pending-${m[1]}.json`);
    if (existsSync(pending)) expectedIds = pendingExpectedIds(pending);
  }

  if (!expectedIds) {
    if (!Array.isArray(rawFile)) {
      console.error(
        "Cannot infer ids; provide done-NN.json matching pending-NN.json",
      );
      process.exit(1);
    }
    expectedIds = (rawFile as { id: string }[]).map((x) => x.id);
  }

  const result = applyEnrichBatch(classifiedById, rawFile, expectedIds, 1);

  console.log(
    `Apply ${base}: accepted=${result.accepted.length} failed=${result.failed.length} softIssues=${result.softIssues.length}`,
  );
  for (const issue of result.softIssues.slice(0, 20)) {
    console.log(`  soft ${issue.code} ${issue.id}: ${issue.message}`);
  }
  for (const f of result.failed) {
    console.log(
      `  FAIL ${f.id}: ${f.issues.map((i) => `${i.code}:${i.message}`).join(" | ")}`,
    );
  }

  if (dryRun) return;

  if (result.accepted.length) upsertEnrichedJsonl(result.accepted);
  if (result.failed.length) {
    if (m && !base.includes("retry")) {
      const retryPath = path.join(PATHS.enrichBatchesDir, `retry-${m[1]}.json`);
      writeFileSync(
        retryPath,
        JSON.stringify(
          {
            promptVersion: ENRICH_PROMPT_VERSION,
            failedIds: result.failed.map((f) => f.id),
            issues: result.failed,
            message:
              "Re-enrich only these ids; save as done-retry-NN.json then --apply",
          },
          null,
          2,
        ) + "\n",
        "utf8",
      );
      console.log(`Wrote retry list: ${retryPath}`);
    } else {
      appendFailed(result.failed);
      console.log(`Appended ${result.failed.length} to ${PATHS.enrichFailedJsonl}`);
    }
  }

  mkdirSync(PATHS.enrichBatchesDir, { recursive: true });
  const archive = path.join(
    PATHS.enrichBatchesDir,
    `applied-${path.basename(abs)}`,
  );
  if (abs.startsWith(PATHS.enrichBatchesDir) && abs !== archive) {
    try {
      renameSync(abs, archive);
      console.log(`Archived → ${archive}`);
    } catch {
      /* keep original */
    }
  }

  const enrichedNow = readEnrichedJsonl();
  writePhase4Manifest(classifiedById.size, enrichedNow, {
    stage: "apply",
    applied: base,
  });
  printStatus(classifiedById.size, enrichedNow);
}

function printStatus(total: number, enriched: Map<string, EnrichedWord>) {
  const done = [...enriched.values()].filter(
    (w) => w.enrichPromptVersion === ENRICH_PROMPT_VERSION,
  ).length;
  console.log(
    `Enrichment progress: ${done}/${total} (${ENRICH_PROMPT_VERSION}, source=${SOURCE_TAG_ENRICHED})`,
  );
  console.log(`Budget cap / session: ${ENRICH_BUDGET_CAP} words`);
  console.log(`Cash API cost: $0 (Cursor-only)`);
}

function writePhase4Manifest(
  classifiedTotal: number,
  enriched: Map<string, EnrichedWord>,
  extra: Record<string, unknown>,
) {
  mkdirSync(PATHS.workDir, { recursive: true });
  const done = [...enriched.values()].filter(
    (w) => w.enrichPromptVersion === ENRICH_PROMPT_VERSION,
  );
  const body = {
    generatedAt: new Date().toISOString(),
    promptVersion: ENRICH_PROMPT_VERSION,
    source: SOURCE_TAG_ENRICHED,
    classifiedTotal,
    enrichedTotal: done.length,
    cashApiCostUsd: 0,
    runtime: "cursor-only",
    usage: {
      anthropicRequests: 0,
      inputTokens: 0,
      outputTokens: 0,
      note: "D7 Cursor-only — no Anthropic usage; Phase 0 $6–8 Batches estimate N/A",
    },
    ...extra,
  };
  writeFileSync(PATHS.phase4Manifest, JSON.stringify(body, null, 2) + "\n");
}

main();
