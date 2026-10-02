/**
 * Phase 5 — automated validation + Cursor-only AI review.
 *
 * Usage:
 *   pnpm content:validate                 # full run → validated.jsonl + report
 *   pnpm content:validate -- --dry-run
 *   pnpm content:validate -- --status
 *   pnpm content:validate -- --write-regen # only write regen enrich batches
 *   pnpm content:validate -- --apply-review PATH.json
 *   pnpm content:validate -- --limit 100
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import {
  ENRICH_BATCH_SIZE,
  ENRICH_PROMPT_VERSION,
  PATHS,
  REVIEW_PROMPT_VERSION,
  VALIDATE_BUDGET_CAP,
} from "../config";
import {
  chunkArray,
  readEnrichedJsonl,
  toEnrichInput,
  type EnrichedWord,
} from "./lib/enrich";
import {
  applyReviewModelItem,
  cursorReviewWord,
  reviewModelBatchSchema,
  shouldRegenerate,
  toValidatedWord,
  type ValidatedWord,
} from "./lib/review";
import {
  buildIssueCounts,
  topIssueTypes,
  writeReviewQueueCsv,
  writeValidatedJsonl,
  writeValidationReportMd,
} from "./lib/validate-report";
import {
  buildCatalogContext,
  loadSets,
  validateCatalog,
  validateWord,
  type ValidationIssue,
} from "./lib/validate";

function parseArgs(argv: string[]) {
  let limit: number | null = null;
  let dryRun = false;
  let status = false;
  let writeRegen = false;
  let applyReview: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit") limit = Number(argv[++i]);
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--status") status = true;
    else if (a === "--write-regen") writeRegen = true;
    else if (a === "--apply-review") applyReview = argv[++i] ?? null;
  }
  return { limit, dryRun, status, writeRegen, applyReview };
}

function readValidatedJsonl(
  filePath = PATHS.validatedJsonl,
): Map<string, ValidatedWord> {
  const map = new Map<string, ValidatedWord>();
  if (!existsSync(filePath)) return map;
  for (const line of readFileSync(filePath, "utf8").trim().split("\n")) {
    if (!line.trim()) continue;
    const w = JSON.parse(line) as ValidatedWord;
    map.set(w.id, w);
  }
  return map;
}

function writeRegenBatches(words: EnrichedWord[]): string[] {
  mkdirSync(PATHS.regenerateBatchesDir, { recursive: true });
  const chunks = chunkArray(words, ENRICH_BATCH_SIZE);
  const paths: string[] = [];
  chunks.forEach((chunk, i) => {
    const n = String(i + 1).padStart(2, "0");
    const file = path.join(PATHS.regenerateBatchesDir, `pending-${n}.json`);
    writeFileSync(
      file,
      JSON.stringify(
        {
          promptVersion: ENRICH_PROMPT_VERSION,
          purpose: "phase5-regenerate-once",
          batch: i + 1,
          batchCount: chunks.length,
          inputs: chunk.map(toEnrichInput),
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );
    paths.push(file);
  });
  return paths;
}

function unwrap(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.results)) return o.results;
  }
  return raw;
}

function runValidation(
  enriched: EnrichedWord[],
  prior: Map<string, ValidatedWord>,
  batchReviews: Map<string, ReturnType<typeof cursorReviewWord>>,
): {
  words: ValidatedWord[];
  catalogIssues: ValidationIssue[];
  regenIds: string[];
} {
  const sets = loadSets();
  const ctx = buildCatalogContext(enriched, sets);
  const catalogIssues = validateCatalog(enriched, ctx);
  const regenIds: string[] = [];
  const words: ValidatedWord[] = [];

  for (const w of enriched) {
    const ruleIssues = validateWord(w, ctx);
    const prev = prior.get(w.id);
    const attempt = prev?.regenerateAttempt ?? 0;
    const baseReview = cursorReviewWord(w, ruleIssues);
    const review = batchReviews.get(w.id)
      ? applyReviewModelItem(
          {
            id: w.id,
            verdict: batchReviews.get(w.id)!.verdict,
            issues: batchReviews.get(w.id)!.issues,
            fixes: batchReviews.get(w.id)!.fixes ?? undefined,
          },
          baseReview,
        )
      : baseReview;

    if (shouldRegenerate(ruleIssues, review, attempt)) {
      regenIds.push(w.id);
    }

    // Words queued for regen keep prior attempt; after regen content lands,
    // caller bumps attempt via --mark-regenerated or re-run after enrich apply.
    const regenerateAttempt =
      attempt >= 1 || (prev && prev.regenerateAttempt >= 1) ? 1 : 0;

    // If this word was in regen set and content hash changed vs prior, count as regenerated
    let finalAttempt = regenerateAttempt;
    if (prev && prev.enrichInputHash === w.enrichInputHash) {
      // same enrichment
      if (
        shouldRegenerate(ruleIssues, review, 0) &&
        prev.regenerateAttempt >= 1
      ) {
        finalAttempt = 1;
      } else if (prev.regenerateAttempt >= 1) {
        finalAttempt = 1;
      }
    } else if (prev && prev.enrichInputHash !== w.enrichInputHash) {
      // enrichment changed → treat as post-regen
      finalAttempt = Math.max(1, prev.regenerateAttempt || 0);
      if (prev.regenerateAttempt === 0 && regenIds.includes(w.id)) {
        // Was queued; now new content — mark attempt 1 and re-evaluate
        finalAttempt = 1;
      }
    }

    // First pass: if needs regen and never regenerated, still emit needs_human
    // until regen applied; attempt stays 0 so queue is clear.
    if (regenIds.includes(w.id) && finalAttempt === 0) {
      words.push(toValidatedWord(w, ruleIssues, review, 0));
    } else {
      words.push(toValidatedWord(w, ruleIssues, review, finalAttempt));
    }
  }

  return { words, catalogIssues, regenIds };
}

function writePhase5Manifest(
  words: ValidatedWord[],
  catalogIssues: ValidationIssue[],
  regenIds: string[],
): void {
  const checked = words.filter((w) => w.reviewStatus === "ai_checked").length;
  const human = words.filter((w) => w.reviewStatus === "needs_human").length;
  const counts = buildIssueCounts(words, catalogIssues);
  const payload = {
    generatedAt: new Date().toISOString(),
    promptVersion: REVIEW_PROMPT_VERSION,
    totals: {
      words: words.length,
      aiChecked: checked,
      needsHuman: human,
      catalogIssues: catalogIssues.length,
      regeneratedQueued: regenIds.length,
    },
    topIssues: topIssueTypes(counts, 10),
    hashes: {
      note: "validated.jsonl is git-ignored; regenerate via pnpm content:validate",
    },
  };
  writeFileSync(
    PATHS.phase5Manifest,
    JSON.stringify(payload, null, 2) + "\n",
    "utf8",
  );
}

function printStatus(): void {
  const enriched = readEnrichedJsonl();
  const validated = readValidatedJsonl();
  let checked = 0;
  let human = 0;
  for (const w of validated.values()) {
    if (w.reviewStatus === "ai_checked") checked += 1;
    else human += 1;
  }
  console.log(`Enriched: ${enriched.size}`);
  console.log(`Validated: ${validated.size}`);
  console.log(`  ai_checked: ${checked}`);
  console.log(`  needs_human: ${human}`);
  console.log(
    `Report: ${existsSync(PATHS.validationReportMd) ? PATHS.validationReportMd : "(missing)"}`,
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.status) {
    printStatus();
    return;
  }

  const enrichedMap = readEnrichedJsonl();
  if (enrichedMap.size === 0) {
    console.error("No enriched.jsonl — run Phase 4 enrich first.");
    process.exit(1);
  }

  let enriched = [...enrichedMap.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  if (args.limit != null && Number.isFinite(args.limit)) {
    enriched = enriched.slice(0, args.limit);
  }

  const prior = readValidatedJsonl();
  const batchReviews = new Map<string, ReturnType<typeof cursorReviewWord>>();

  if (args.applyReview) {
    if (!existsSync(args.applyReview)) {
      console.error(`Missing review file: ${args.applyReview}`);
      process.exit(1);
    }
    const raw = unwrap(JSON.parse(readFileSync(args.applyReview, "utf8")));
    const parsed = reviewModelBatchSchema.safeParse(raw);
    if (!parsed.success) {
      console.error("Invalid review batch:", parsed.error.message);
      process.exit(1);
    }
    for (const item of parsed.data) {
      const w = enrichedMap.get(item.id);
      if (!w) continue;
      const rules = validateWord(
        w,
        buildCatalogContext([...enrichedMap.values()], loadSets()),
      );
      batchReviews.set(
        item.id,
        applyReviewModelItem(item, cursorReviewWord(w, rules)),
      );
    }
    console.log(`Loaded ${batchReviews.size} Cursor review overrides`);
  }

  const { words, catalogIssues, regenIds } = runValidation(
    enriched,
    prior,
    batchReviews,
  );

  // Cap regen queue for session budget messaging
  const regenBudget = Math.min(regenIds.length, VALIDATE_BUDGET_CAP);
  const regenWords = regenIds
    .slice(0, regenBudget)
    .map((id) => enrichedMap.get(id)!)
    .filter(Boolean);

  if (args.writeRegen || regenWords.length > 0) {
    if (!args.dryRun && regenWords.length > 0) {
      const paths = writeRegenBatches(regenWords);
      console.log(
        `Wrote ${paths.length} regen batch(es) for ${regenWords.length} words → ${PATHS.regenerateBatchesDir}`,
      );
      console.log(
        `Fill with prompts/enrich.v1.md, then: pnpm content:enrich -- --apply <done.json>`,
      );
      console.log(`Re-run: pnpm content:validate`);
    } else if (args.dryRun) {
      console.log(`[dry-run] would write regen for ${regenWords.length} words`);
    }
  }

  // Words that still need regen (attempt 0 + in regenIds) stay needs_human;
  // after enrich apply + re-validate, attempt bumps and may become ai_checked.
  // Mark attempt=1 for words whose prior validated entry already had attempt 1
  // OR whose enrichment changed since prior needs_human.
  const finalized = words.map((w) => {
    if (!regenIds.includes(w.id)) return w;
    const prev = prior.get(w.id);
    if (!prev) return w;
    if (prev.enrichInputHash !== w.enrichInputHash) {
      // Regenerated content applied — re-finalize with attempt 1
      return toValidatedWord(
        enrichedMap.get(w.id)!,
        w.validationIssues,
        w.aiReview,
        1,
      );
    }
    return w;
  });

  // After regen applied: if still failing → needs_human (already).
  // Promote pass words that were regenerated successfully.
  const stillFailingAfterRegen = finalized
    .filter(
      (w) =>
        w.regenerateAttempt >= 1 && w.reviewStatus === "needs_human",
    )
    .map((w) => w.id);

  const checked = finalized.filter((w) => w.reviewStatus === "ai_checked").length;
  const human = finalized.filter((w) => w.reviewStatus === "needs_human").length;
  const counts = buildIssueCounts(finalized, catalogIssues);

  console.log(`Validated ${finalized.length} words`);
  console.log(`  ai_checked: ${checked}`);
  console.log(`  needs_human: ${human}`);
  console.log(`  regen queued: ${regenIds.length}`);
  console.log(`  catalog issues: ${catalogIssues.length}`);
  console.log(
    `  top issues: ${topIssueTypes(counts, 5)
      .map((t) => `${t.code}=${t.count}`)
      .join(", ")}`,
  );

  if (args.dryRun) {
    console.log("[dry-run] skip writing outputs");
    return;
  }

  writeValidatedJsonl(finalized);
  const queueN = writeReviewQueueCsv(finalized);
  writeValidationReportMd(finalized, catalogIssues, {
    regeneratedIds: regenIds,
    stillFailingAfterRegen,
    promptVersion: REVIEW_PROMPT_VERSION,
  });
  writePhase5Manifest(finalized, catalogIssues, regenIds);

  console.log(`Wrote ${PATHS.validatedJsonl}`);
  console.log(`Wrote ${PATHS.reviewQueueCsv} (${queueN} rows)`);
  console.log(`Wrote ${PATHS.validationReportMd}`);
  console.log(`Wrote ${PATHS.phase5Manifest}`);
}

main();
