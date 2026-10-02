import { describe, expect, it } from "vitest";

import {
  computeQualityGate,
  rowsToCsv,
  parseReviewCsv,
  selectReviewSheet,
  type ReviewSheetRow,
} from "../lib/human-review";
import {
  applyFilledReviews,
  importReviewSheet,
  validateFilledSheet,
} from "../lib/import-review";
import type { ValidatedWord } from "../lib/review";
import { buildXlsx } from "../lib/xlsx-minimal";

function toValidated(
  partial: Partial<ValidatedWord> &
    Pick<ValidatedWord, "id" | "word" | "level" | "meaningVi" | "definitionEn">,
): ValidatedWord {
  return {
    partOfSpeech: "noun",
    ipa: "/tɛst/",
    ipaSource: "dictionary",
    frequencyRank: 100,
    flagged: false,
    source: "cefrj-1.5+ai",
    notes: null,
    otherLevels: [],
    isMultiWord: false,
    promptVersion: "classify.v1",
    inputHash: "abc",
    topicId: "Daily life",
    confidence: 0.9,
    reason: "test",
    classifyMethod: "lexicon",
    examples: [
      { en: "I like this test today.", vi: "Tôi thích bài kiểm tra này." },
      { en: "The test was easy.", vi: "Bài kiểm tra dễ." },
    ],
    collocations: ["take a test", "pass a test"],
    enrichNotes: null,
    enrichPromptVersion: "enrich.v1",
    enrichInputHash: "hash",
    reviewStatus: "ai_checked",
    validationIssues: [],
    aiReview: {
      id: partial.id,
      verdict: "pass",
      issues: [],
      fixes: null,
      promptVersion: "review.v1",
      method: "cursor-rules",
    },
    fixedCopy: null,
    regenerateAttempt: 0,
    ...partial,
  };
}

function baseRow(over: Partial<ReviewSheetRow> & { id: string }): ReviewSheetRow {
  return {
    id: over.id,
    word: over.word ?? "test",
    pos: "noun",
    level: over.level ?? "A1",
    topic: over.topic ?? "Daily life",
    set_title: "T",
    ipa: "/t/",
    meaningVi: "kiểm tra",
    definitionEn: "a small exam",
    example1_en: "I like this test today.",
    example1_vi: "Tôi thích bài này.",
    example2_en: "The test was easy.",
    example2_vi: "Bài kiểm tra dễ.",
    collocations: "take a test",
    notes: "",
    flags: over.flags ?? "sample",
    inclusion: over.inclusion ?? "sample",
    decision: over.decision ?? "",
    fixed_meaningVi: over.fixed_meaningVi ?? "",
    fixed_definitionEn: over.fixed_definitionEn ?? "",
    fixed_example1_en: over.fixed_example1_en ?? "",
    fixed_example1_vi: over.fixed_example1_vi ?? "",
    fixed_example2_en: over.fixed_example2_en ?? "",
    fixed_example2_vi: over.fixed_example2_vi ?? "",
    comment: over.comment ?? "",
  };
}

describe("selectReviewSheet", () => {
  it("includes warnings and samples ≥15% of remainder", () => {
    const words: ValidatedWord[] = [];
    for (let i = 0; i < 100; i++) {
      words.push(
        toValidated({
          id: `w-${i}`,
          word: `word${i}`,
          level: i < 50 ? "A1" : "A2",
          topicId: i % 2 === 0 ? "Food" : "Travel",
          meaningVi: "từ",
          definitionEn: "a short word",
          confidence: 0.9,
        }),
      );
    }
    // Force one warning via missing IPA
    words[0] = {
      ...words[0]!,
      ipa: null,
      ipaSource: "missing",
      validationIssues: [
        { code: "IPA_MISSING", severity: "warning", message: "missing" },
      ],
    };

    const sel = selectReviewSheet(words, { sampleRate: 0.15, seed: 42 });
    expect(sel.mustIds.has("w-0")).toBe(true);
    expect(sel.sampleIds.size).toBeGreaterThanOrEqual(
      Math.ceil((100 - sel.mustIds.size) * 0.15),
    );
    expect(sel.mustIds.size + sel.sampleIds.size).toBe(
      sel.mustIds.size + sel.sampleIds.size,
    );
    for (const id of sel.sampleIds) {
      expect(sel.mustIds.has(id)).toBe(false);
    }
  });
});

describe("import-review round-trip", () => {
  it("applies ok/fix/drop and rejects empty fixes", () => {
    const a = toValidated({
      id: "w-a",
      word: "apple",
      level: "A1",
      meaningVi: "quả táo",
      definitionEn: "a round fruit",
    });
    const b = toValidated({
      id: "w-b",
      word: "banana",
      level: "A1",
      meaningVi: "chuối",
      definitionEn: "a long yellow fruit",
    });
    const c = toValidated({
      id: "w-c",
      word: "cat",
      level: "A1",
      meaningVi: "mèo",
      definitionEn: "a small pet animal",
    });
    const catalog = [a, b, c];
    const catalogMap = new Map(catalog.map((w) => [w.id, w]));

    const bad = validateFilledSheet(
      [baseRow({ id: "w-b", decision: "fix", inclusion: "sample" })],
      catalogMap,
    );
    expect(bad.conflicts.some((c) => c.code === "EMPTY_FIX")).toBe(true);

    const filled = validateFilledSheet(
      [
        baseRow({ id: "w-a", decision: "ok", inclusion: "sample" }),
        baseRow({
          id: "w-b",
          decision: "fix",
          inclusion: "sample",
          fixed_meaningVi: "quả chuối",
          comment: "meaning_vi",
        }),
        baseRow({
          id: "w-c",
          decision: "drop",
          inclusion: "must",
          comment: "sensitive",
        }),
        baseRow({ id: "w-unknown", decision: "ok", inclusion: "sample" }),
      ],
      catalogMap,
    );
    expect(filled.conflicts.some((c) => c.code === "UNKNOWN_ID")).toBe(true);

    const good = validateFilledSheet(
      [
        baseRow({ id: "w-a", decision: "ok", inclusion: "sample" }),
        baseRow({
          id: "w-b",
          decision: "fix",
          inclusion: "sample",
          fixed_meaningVi: "quả chuối",
          comment: "meaning_vi",
        }),
        baseRow({
          id: "w-c",
          decision: "drop",
          inclusion: "must",
          comment: "sensitive",
        }),
      ],
      catalogMap,
    );
    expect(good.conflicts).toHaveLength(0);

    const applied = applyFilledReviews(catalog, good.filled);
    expect(applied.dropped.map((w) => w.id)).toEqual(["w-c"]);
    expect(applied.kept).toHaveLength(2);
    const fixed = applied.kept.find((w) => w.id === "w-b")!;
    expect(fixed.meaningVi).toBe("quả chuối");
    expect(fixed.reviewStatus).toBe("human_reviewed");
    expect(applied.kept.find((w) => w.id === "w-a")!.reviewStatus).toBe(
      "human_reviewed",
    );

    const gate = computeQualityGate(good.filled);
    // sample: w-a ok, w-b fix → 1/2 = 50%
    expect(gate.sampleSize).toBe(2);
    expect(gate.fixOrDrop).toBe(1);
    expect(gate.band).toBe("stop");
  });

  it("CSV round-trips with UTF-8 BOM and Vietnamese", () => {
    const row = baseRow({
      id: "w-vn",
      decision: "ok",
      inclusion: "sample",
    });
    row.meaningVi = "học sinh, sinh viên";
    row.example1_vi = "Tôi đi học bằng xe buýt.";
    const csv = rowsToCsv([row]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const parsed = parseReviewCsv(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.meaningVi).toBe("học sinh, sinh viên");
    expect(parsed[0]!.example1_vi).toContain("xe buýt");

    const result = importReviewSheet(csv, {
      catalog: [
        toValidated({
          id: "w-vn",
          word: "student",
          level: "A1",
          meaningVi: "học sinh, sinh viên",
          definitionEn: "a person who studies",
        }),
      ],
      dryRun: true,
      writeOutputs: false,
    });
    expect(result.ok).toBe(true);
    expect(result.decided).toBe(1);
  });
});

describe("xlsx-minimal", () => {
  it("builds a non-empty zip buffer with PK header", () => {
    const buf = buildXlsx([
      {
        name: "review",
        rows: [
          ["id", "decision"],
          ["w-1", ""],
        ],
        listValidation: {
          col: 1,
          startRow: 2,
          endRow: 2,
          options: ["ok", "fix", "drop"],
        },
      },
    ]);
    expect(buf.subarray(0, 2).toString("utf8")).toBe("PK");
    expect(buf.length).toBeGreaterThan(100);
  });
});
