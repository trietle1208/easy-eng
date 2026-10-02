import { z } from "zod";

import { REVIEW_PROMPT_VERSION } from "../../config";
import type { EnrichedWord } from "./enrich";
import { enrichExampleSchema, wordCount } from "./enrich-schema";
import {
  hasError,
  isVietnameseMeaning,
  type ValidationIssue,
} from "./validate";

export type ReviewVerdict = "pass" | "fix" | "reject";

export type ReviewIssue = {
  code: string;
  message: string;
};

export type EnrichFields = {
  meaningVi: string;
  definitionEn: string;
  examples: Array<{ en: string; vi: string }>;
  collocations: string[] | null;
  notes: string | null;
};

export type AiReviewResult = {
  id: string;
  verdict: ReviewVerdict;
  issues: ReviewIssue[];
  fixes: EnrichFields | null;
  promptVersion: string;
  method: "cursor-rules" | "cursor-batch";
};

export const reviewModelItemSchema = z.object({
  id: z.string().min(1),
  verdict: z.enum(["pass", "fix", "reject"]),
  issues: z
    .array(
      z.object({
        code: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .default([]),
  fixes: z
    .object({
      meaningVi: z.string().min(1),
      definitionEn: z.string().min(1),
      examples: z.array(enrichExampleSchema).length(2),
      collocations: z.array(z.string().min(1)).min(2).max(4).nullable(),
      notes: z.string().min(1).nullable(),
    })
    .nullable()
    .optional(),
});

export const reviewModelBatchSchema = z.array(reviewModelItemSchema);

export type ReviewModelItem = z.infer<typeof reviewModelItemSchema>;

/**
 * Cursor-only reviewer (Phase 0 D7): deterministic checks aligned with
 * `prompts/review.v1.md`. Optional Cursor batches can override via --apply.
 */
export function cursorReviewWord(
  w: EnrichedWord,
  ruleIssues: ValidationIssue[],
): AiReviewResult {
  const issues: ReviewIssue[] = [];

  // Rule errors already fatal for pass
  for (const ri of ruleIssues.filter((i) => i.severity === "error")) {
    issues.push({ code: ri.code, message: ri.message });
  }

  // Meaning vs POS heuristics
  const meaning = (w.meaningVi ?? "").trim();
  const def = (w.definitionEn ?? "").trim();
  if (w.partOfSpeech === "verb") {
    // English defs for verbs often start with "to "; VN should not look like a noun gloss only
    if (/^(a|an|the)\s+/i.test(def) && !/^to\s+/i.test(def)) {
      issues.push({
        code: "POS_MISMATCH",
        message: "definition reads like a noun phrase for a verb entry",
      });
    }
  }
  if (w.partOfSpeech === "noun") {
    if (/^to\s+\w+/i.test(def) && wordCount(def) <= 6) {
      issues.push({
        code: "POS_MISMATCH",
        message: "definition reads like a verb gloss for a noun entry",
      });
    }
  }

  if (meaning && !isVietnameseMeaning(meaning)) {
    issues.push({
      code: "VI_UNNATURAL",
      message: "Vietnamese meaning looks unnatural or non-Vietnamese",
    });
  }

  // Example naturalness: avoid definition pasted as example
  for (let i = 0; i < (w.examples?.length ?? 0); i++) {
    const en = w.examples[i]?.en?.trim() ?? "";
    if (!en) continue;
    if (en.toLowerCase() === def.toLowerCase()) {
      issues.push({
        code: "EX_UNNATURAL",
        message: `example[${i}] copies the definition`,
      });
    }
    // All-caps or telegram style
    if (en === en.toUpperCase() && /[A-Z]/.test(en) && en.length > 8) {
      issues.push({
        code: "EX_UNNATURAL",
        message: `example[${i}] is all caps`,
      });
    }
  }

  // Misleading: meaning empty of substance
  if (meaning.length > 0 && meaning.length < 2) {
    issues.push({
      code: "MISLEADING",
      message: "meaningVi too short to be useful",
    });
  }

  const hard = issues.filter((i) =>
    ["POS_MISMATCH", "VI_UNNATURAL", "MISLEADING", "BANNED", "MEANING_VI"].includes(
      i.code,
    ),
  );
  const ruleErrors = hasError(ruleIssues);

  let verdict: ReviewVerdict = "pass";
  if (ruleErrors || hard.length > 0) {
    // Prefer reject for banned / schema-level; fix for soft semantic
    if (
      issues.some((i) =>
        ["BANNED", "SCHEMA", "DUP_SYSTEM"].includes(i.code),
      )
    ) {
      verdict = "reject";
    } else if (
      issues.some((i) =>
        ["POS_MISMATCH", "VI_UNNATURAL", "EX_UNNATURAL", "MISLEADING"].includes(
          i.code,
        ),
      )
    ) {
      verdict = "fix";
    } else {
      verdict = "reject";
    }
  }

  return {
    id: w.id,
    verdict,
    issues,
    fixes: null, // Cursor batch may supply fixes; rules-only never invents content
    promptVersion: REVIEW_PROMPT_VERSION,
    method: "cursor-rules",
  };
}

/** Merge a Cursor-batch review item over the rules review. */
export function applyReviewModelItem(
  item: ReviewModelItem,
  fallback: AiReviewResult,
): AiReviewResult {
  return {
    id: item.id,
    verdict: item.verdict,
    issues: item.issues ?? [],
    fixes: item.fixes
      ? {
          meaningVi: item.fixes.meaningVi,
          definitionEn: item.fixes.definitionEn,
          examples: item.fixes.examples,
          collocations: item.fixes.collocations,
          notes: item.fixes.notes,
        }
      : null,
    promptVersion: REVIEW_PROMPT_VERSION,
    method: "cursor-batch",
  };
}

export function fieldsFromWord(w: EnrichedWord): EnrichFields {
  return {
    meaningVi: w.meaningVi,
    definitionEn: w.definitionEn,
    examples: w.examples.map((e) => ({ en: e.en, vi: e.vi })),
    collocations: w.collocations,
    notes: w.enrichNotes,
  };
}

/** Apply fixes onto a copy; original fields stay on the word. */
export function applyFixesToCopy(
  w: EnrichedWord,
  fixes: EnrichFields,
): EnrichFields {
  return {
    meaningVi: fixes.meaningVi.trim(),
    definitionEn: fixes.definitionEn.trim(),
    examples: fixes.examples.map((e) => ({
      en: e.en.trim(),
      vi: e.vi.trim(),
    })),
    collocations: fixes.collocations,
    notes: fixes.notes?.trim() || null,
  };
}

export type ReviewStatus =
  | "ai_checked"
  | "needs_human"
  | "human_reviewed";

export type ValidatedWord = Omit<EnrichedWord, "reviewStatus"> & {
  reviewStatus: ReviewStatus;
  validationIssues: ValidationIssue[];
  aiReview: AiReviewResult;
  /** Suggested corrections from AI review — never overwrites original fields. */
  fixedCopy: EnrichFields | null;
  regenerateAttempt: number;
  /** Set by Phase 6 import when a human decided on this row. */
  humanDecision?: "ok" | "fix" | "drop";
  humanComment?: string | null;
};

/**
 * Final status: rules + review must both pass → `ai_checked`.
 * Warnings alone do not block `ai_checked` (they still go to review-queue.csv).
 * `fix` / `reject` / rule errors → `needs_human` (after regenerate-once flow).
 */
export function toValidatedWord(
  w: EnrichedWord,
  ruleIssues: ValidationIssue[],
  review: AiReviewResult,
  regenerateAttempt: number,
): ValidatedWord {
  const errors = hasError(ruleIssues);
  const finalStatus: "ai_checked" | "needs_human" =
    !errors && review.verdict === "pass" ? "ai_checked" : "needs_human";

  const fixedCopy =
    review.fixes != null ? applyFixesToCopy(w, review.fixes) : null;

  return {
    ...w,
    reviewStatus: finalStatus,
    validationIssues: ruleIssues,
    aiReview: review,
    fixedCopy,
    regenerateAttempt,
  };
}

/** True when the word should be regenerated once (errors or reject/fix). */
export function shouldRegenerate(
  ruleIssues: ValidationIssue[],
  review: AiReviewResult,
  regenerateAttempt: number,
): boolean {
  if (regenerateAttempt >= 1) return false;
  if (hasError(ruleIssues)) return true;
  return review.verdict === "reject" || review.verdict === "fix";
}
