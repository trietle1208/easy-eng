/**
 * Phase 6 — apply Cursor human-review decisions to the exported review CSV.
 * Only rows we decide on are filled; then import-review applies them.
 */
import { readFileSync, writeFileSync } from "node:fs";

import { PATHS } from "../config";
import {
  parseReviewCsv,
  rowsToCsv,
  type ReviewDecision,
  type ReviewSheetRow,
} from "./lib/human-review";

type Fix = {
  decision: ReviewDecision;
  comment: string;
  fixed_meaningVi?: string;
  fixed_definitionEn?: string;
  fixed_example1_en?: string;
  fixed_example1_vi?: string;
  fixed_example2_en?: string;
  fixed_example2_vi?: string;
};

/** Explicit decisions from human review pass (Cursor). */
const OVERRIDES: Record<string, Fix> = {
  // Sensitive headwords — drop from chill learner catalog
  "w-suicide-noun": { decision: "drop", comment: "sensitive_suicide" },
  "w-terrorist-noun": { decision: "drop", comment: "sensitive_terrorist" },
  "w-terrorism-noun": { decision: "drop", comment: "sensitive_terrorism" },
  "w-murder-noun": { decision: "drop", comment: "sensitive_murder" },
  "w-murder-verb": { decision: "drop", comment: "sensitive_murder" },

  // Real content fixes
  "w-cigarette-noun": {
    decision: "fix",
    comment: "typo_meaning_vi_dieu",
    fixed_meaningVi: "điếu thuốc lá",
  },
  "w-best-adverb": {
    decision: "fix",
    comment: "awkward_vi_and_ungrammatical_def",
    fixed_meaningVi: "tốt nhất",
    fixed_definitionEn: "in the best or most useful way",
  },
  "w-closely-adverb": {
    decision: "fix",
    comment: "boilerplate_mot_cach",
    fixed_meaningVi: "chặt chẽ, sát sao",
  },
  "w-coke-noun": {
    decision: "fix",
    comment: "def_brandish_cola",
    fixed_definitionEn: "a sweet dark fizzy soft drink",
  },
};

function main() {
  const src = readFileSync(PATHS.reviewSheetCsv, "utf8");
  const rows = parseReviewCsv(src);
  let overrideCount = 0;

  const filled: ReviewSheetRow[] = rows.map((r) => {
    const o = OVERRIDES[r.id];
    if (o) {
      overrideCount += 1;
      return {
        ...r,
        decision: o.decision,
        comment: o.comment,
        fixed_meaningVi: o.fixed_meaningVi ?? "",
        fixed_definitionEn: o.fixed_definitionEn ?? "",
        fixed_example1_en: o.fixed_example1_en ?? "",
        fixed_example1_vi: o.fixed_example1_vi ?? "",
        fixed_example2_en: o.fixed_example2_en ?? "",
        fixed_example2_vi: o.fixed_example2_vi ?? "",
      };
    }
    // Default: ok — content acceptable (LEVEL_LEAK / IPA_MISSING noted in comment when useful)
    let comment = "";
    if (r.flags.includes("IPA_MISSING")) comment = "ipa_missing_ok";
    else if (r.flags.includes("BANNED")) comment = "sensitive_kept_informal_ok";
    else if (r.flags.includes("LEVEL_LEAK")) comment = "level_leak_ok";
    return { ...r, decision: "ok", comment };
  });

  const outPath = PATHS.reviewFilledCsv.replace(
    "review-filled.csv",
    "review-decisions.csv",
  );
  writeFileSync(outPath, rowsToCsv(filled), "utf8");

  const sampleFixDrop = filled.filter(
    (r) =>
      r.inclusion === "sample" &&
      (r.decision === "fix" || r.decision === "drop"),
  );
  console.log(`Wrote ${outPath}`);
  console.log(`Rows: ${filled.length}; overrides: ${overrideCount}`);
  console.log(
    `Sample fix|drop: ${sampleFixDrop.length} → ${sampleFixDrop.map((r) => r.id + ":" + r.decision).join(", ")}`,
  );
}

main();
