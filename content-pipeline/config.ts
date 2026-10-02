import path from "node:path";
import { fileURLToPath } from "node:url";

export const PIPELINE_ROOT = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(PIPELINE_ROOT, "..");

export const PATHS = {
  cefrjCsv: path.join(
    PIPELINE_ROOT,
    "data/raw/cefrj-vocabulary-profile-1.5.csv",
  ),
  cmudict: path.join(PIPELINE_ROOT, "data/raw/cmudict/cmudict.dict"),
  frequency: path.join(
    PIPELINE_ROOT,
    "data/raw/frequency/top_english_words_lower_20000.txt",
  ),
  topicsJson: path.join(REPO_ROOT, "content/topics.json"),
  workDir: path.join(PIPELINE_ROOT, "work"),
  skeletonJsonl: path.join(PIPELINE_ROOT, "work/skeleton.jsonl"),
  manifest: path.join(PIPELINE_ROOT, "work/manifest.json"),
  skeletonSample: path.join(PIPELINE_ROOT, "work/skeleton-sample.csv"),
  classifiedJsonl: path.join(PIPELINE_ROOT, "work/classified.jsonl"),
  setsJson: path.join(PIPELINE_ROOT, "work/sets.json"),
  topicReportCsv: path.join(PIPELINE_ROOT, "work/topic-report.csv"),
  classifyPrompt: path.join(PIPELINE_ROOT, "prompts/classify.v1.md"),
  setTitlePrompt: path.join(PIPELINE_ROOT, "prompts/set-title.v1.md"),
  classifyCorrections: path.join(
    PIPELINE_ROOT,
    "data/classify-corrections.jsonl",
  ),
  enrichPrompt: path.join(PIPELINE_ROOT, "prompts/enrich.v1.md"),
  enrichedJsonl: path.join(PIPELINE_ROOT, "work/enriched.jsonl"),
  enrichFailedJsonl: path.join(PIPELINE_ROOT, "work/enrich-failed.jsonl"),
  enrichBatchesDir: path.join(PIPELINE_ROOT, "work/enrich-batches"),
  pilotWordsJson: path.join(PIPELINE_ROOT, "work/pilot-words.json"),
  pilotCsv: path.join(PIPELINE_ROOT, "work/pilot.csv"),
  phase4Manifest: path.join(PIPELINE_ROOT, "work/phase4-manifest.json"),
  reviewPrompt: path.join(PIPELINE_ROOT, "prompts/review.v1.md"),
  validatedJsonl: path.join(PIPELINE_ROOT, "work/validated.jsonl"),
  reviewQueueCsv: path.join(PIPELINE_ROOT, "work/review-queue.csv"),
  validationReportMd: path.join(PIPELINE_ROOT, "work/validation-report.md"),
  reviewBatchesDir: path.join(PIPELINE_ROOT, "work/review-batches"),
  regenerateBatchesDir: path.join(PIPELINE_ROOT, "work/regen-batches"),
  phase5Manifest: path.join(PIPELINE_ROOT, "work/phase5-manifest.json"),
  reviewSheetXlsx: path.join(PIPELINE_ROOT, "work/review-sheet.xlsx"),
  reviewSheetCsv: path.join(PIPELINE_ROOT, "work/review-sheet.csv"),
  catalogSheetCsv: path.join(PIPELINE_ROOT, "work/catalog-readonly.csv"),
  reviewFilledCsv: path.join(PIPELINE_ROOT, "work/review-filled.csv"),
  reviewDroppedLog: path.join(PIPELINE_ROOT, "work/review-dropped.jsonl"),
  qualityGateMd: path.join(PIPELINE_ROOT, "work/quality-gate.md"),
  phase6Manifest: path.join(PIPELINE_ROOT, "work/phase6-manifest.json"),
} as const;

/** Phase 3 — classification / sets */
export const CLASSIFY_PROMPT_VERSION = "classify.v1";
export const SET_TITLE_PROMPT_VERSION = "set-title.v1";
export const LOW_CONFIDENCE_THRESHOLD = 0.7;
export const SET_TARGET_SIZE = 25;
export const SET_MIN_SIZE = 12;
export const SET_MAX_SIZE = 30;
export const CLASSIFY_BATCH_SIZE = 80;

/** Phase 4 — enrichment (Cursor-only; budget = words / session) */
export const ENRICH_PROMPT_VERSION = "enrich.v1";
export const ENRICH_BATCH_SIZE = 25;
/** Max words to process in one CLI invocation (session budget cap). */
export const ENRICH_BUDGET_CAP = 200;
export const PILOT_SIZE = 100;
export const PILOT_PER_LEVEL = 25;
export const PILOT_SEED = 4;
export const SOURCE_TAG_ENRICHED = "cefrj-1.5+ai";

/** Phase 5 — validation / AI review (Cursor-only; $0 API) */
export const REVIEW_PROMPT_VERSION = "review.v1";
export const REVIEW_BATCH_SIZE = 25;
/** Max words to queue for Cursor review/regen in one CLI invocation. */
export const VALIDATE_BUDGET_CAP = 200;

/** Phase 6 — human review sheet / import */
export const HUMAN_REVIEW_SAMPLE_RATE = 0.15;
export const HUMAN_REVIEW_SEED = 42;
/** Error-rate gates on the stratified random sample only. */
export const QUALITY_GATE_ACCEPT = 0.03;
export const QUALITY_GATE_WARN = 0.08;

/** Approved Phase 0 quotas (A1–B2). */
export const LEVEL_QUOTAS = {
  A1: 800,
  A2: 900,
  B1: 800,
  B2: 500,
} as const;

export type CefrLevel = keyof typeof LEVEL_QUOTAS;

export const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2"];

export const LEVEL_RANK: Record<CefrLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
};

/** Closed-class POS values excluded from the system catalog (Phase 0 D2). */
export const EXCLUDED_POS = new Set([
  "determiner",
  "pronoun",
  "be-verb",
  "do-verb",
  "have-verb",
  "modal auxiliary",
  "infinitive-to",
  "number",
]);

/** Existing hand-written words — keep ids; do not duplicate headword+pos. */
export const RESERVED_WORD_IDS = [
  "w-itinerary",
  "w-boarding-pass",
  "w-gate",
] as const;

export const RESERVED_HEADWORDS = [
  { word: "itinerary", partOfSpeech: "noun" },
  { word: "boarding pass", partOfSpeech: "noun" },
  { word: "gate", partOfSpeech: "noun" },
] as const;

export const SAMPLE_SIZE = 150;
export const SAMPLE_SEED = 42;
export const SOURCE_TAG = "cefrj-1.5";
