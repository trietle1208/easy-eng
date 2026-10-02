import { describe, expect, it } from "vitest";

import { findBannedContent } from "../lib/banned";
import {
  countWordsAboveLevel,
  tokenizeContentWords,
  type CefrLevelIndex,
} from "../lib/cefr-level-index";
import type { EnrichedWord } from "../lib/enrich";
import { cursorReviewWord, shouldRegenerate, toValidatedWord } from "../lib/review";
import {
  buildCatalogContext,
  examplesNearDuplicate,
  isVietnameseMeaning,
  looksLikeLatinOnlyCopy,
  validateWord,
} from "../lib/validate";

function fakeWord(
  partial: Partial<EnrichedWord> &
    Pick<EnrichedWord, "id" | "word" | "level" | "meaningVi" | "definitionEn">,
): EnrichedWord {
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
    reviewStatus: "ai_generated",
    enrichPromptVersion: "enrich.v1",
    enrichInputHash: "hash",
    ...partial,
  };
}

describe("vietnamese / banned helpers", () => {
  it("detects Vietnamese orthography", () => {
    expect(isVietnameseMeaning("sự chậm trễ")).toBe(true);
    expect(isVietnameseMeaning("delay later than planned")).toBe(false);
  });

  it("flags Latin-only copy of definition", () => {
    expect(
      looksLikeLatinOnlyCopy(
        "a delay that happens later",
        "a delay that happens later than planned",
      ),
    ).toBe(true);
    expect(looksLikeLatinOnlyCopy("sự chậm trễ", "a late arrival")).toBe(false);
  });

  it("finds banned brands and urls", () => {
    const hits = findBannedContent(["I searched on Google yesterday"]);
    expect(hits.some((h) => h.kind === "name_brand")).toBe(true);
    expect(
      findBannedContent(["see https://example.com"]).some((h) => h.kind === "url"),
    ).toBe(true);
    // Fruit "apple" must not count as the Apple brand
    expect(findBannedContent(["I eat an apple after lunch"])).toEqual([]);
  });
});

describe("example / level helpers", () => {
  it("detects near-duplicate examples", () => {
    expect(
      examplesNearDuplicate(
        "I go to school every day.",
        "I go to school every day!",
      ),
    ).toBe(true);
    expect(
      examplesNearDuplicate("I go to school every day.", "She stays at home."),
    ).toBe(false);
  });

  it("counts content words above target level", () => {
    const index: CefrLevelIndex = new Map([
      ["sophisticated", "B2"],
      ["house", "A1"],
      ["beautiful", "A2"],
    ]);
    expect(tokenizeContentWords("A sophisticated house")).toContain(
      "sophisticated",
    );
    const leak = countWordsAboveLevel(
      ["A sophisticated beautiful house"],
      "A1",
      index,
      "home",
    );
    expect(leak.count).toBe(2);
  });
});

describe("validateWord", () => {
  it("passes a clean entry", () => {
    const w = fakeWord({
      id: "w-test-noun",
      word: "test",
      level: "A2",
      meaningVi: "bài kiểm tra",
      definitionEn: "a set of questions to check knowledge",
      examples: [
        { en: "I have a test tomorrow morning.", vi: "Mai tôi có bài kiểm tra." },
        { en: "The test was not hard.", vi: "Bài kiểm tra không khó." },
      ],
    });
    const ctx = buildCatalogContext(
      [w],
      [{ id: "ws-1", wordIds: [w.id] }],
      new Map([["questions", "A1"], ["check", "A1"], ["knowledge", "A2"]]),
    );
    const issues = validateWord(w, ctx);
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("flags DEF_HEADWORD and MEANING_VI and BANNED", () => {
    const w = fakeWord({
      id: "w-delay-noun",
      word: "delay",
      level: "B1",
      meaningVi: "a delay that happens later than planned",
      definitionEn: "a delay before something happens later",
      examples: [
        { en: "There was a long delay at Google today.", vi: "Chậm ở Google." },
        { en: "Sorry for the delay this morning.", vi: "Xin lỗi vì chậm." },
      ],
    });
    const ctx = buildCatalogContext(
      [w],
      [{ id: "ws-1", wordIds: [w.id] }],
      new Map(),
    );
    const codes = validateWord(w, ctx).map((i) => i.code);
    expect(codes).toContain("DEF_HEADWORD");
    expect(codes).toContain("MEANING_VI");
    expect(codes).toContain("BANNED");
  });

  it("accepts undiacriticized Vietnamese glosses", () => {
    expect(isVietnameseMeaning("mua")).toBe(true);
    expect(isVietnameseMeaning("sau khi")).toBe(true);
    expect(isVietnameseMeaning("trang web")).toBe(true);
  });

  it("flags EX_LEN and EX_HEADWORD", () => {
    const w = fakeWord({
      id: "w-cat-noun",
      word: "cat",
      level: "A1",
      meaningVi: "con mèo",
      definitionEn: "a small animal people keep at home",
      examples: [
        { en: "Hi.", vi: "Chào." },
        { en: "The dog runs fast every morning outside.", vi: "Chó chạy." },
      ],
    });
    const ctx = buildCatalogContext(
      [w],
      [{ id: "ws-1", wordIds: [w.id] }],
      new Map(),
    );
    const codes = validateWord(w, ctx).map((i) => i.code);
    expect(codes).toContain("EX_LEN");
    expect(codes).toContain("EX_HEADWORD");
  });

  it("flags SCHEMA when word missing from sets", () => {
    const w = fakeWord({
      id: "w-orphan-noun",
      word: "orphan",
      level: "B1",
      meaningVi: "trẻ mồ côi",
      definitionEn: "a child without parents",
    });
    const ctx = buildCatalogContext([w], [], new Map());
    expect(validateWord(w, ctx).some((i) => i.code === "SCHEMA")).toBe(true);
  });
});

describe("cursor review", () => {
  it("passes clean words and rejects banned via rules", () => {
    const w = fakeWord({
      id: "w-book-noun",
      word: "book",
      level: "A1",
      meaningVi: "quyển sách",
      definitionEn: "pages with writing that you read",
      examples: [
        { en: "I read a book last night.", vi: "Tối qua tôi đọc sách." },
        { en: "This book is very good.", vi: "Quyển sách này rất hay." },
      ],
    });
    const ctx = buildCatalogContext(
      [w],
      [{ id: "ws-1", wordIds: [w.id] }],
      new Map(),
    );
    const rules = validateWord(w, ctx);
    const review = cursorReviewWord(w, rules);
    expect(review.verdict).toBe("pass");
    const validated = toValidatedWord(w, rules, review, 0);
    expect(validated.reviewStatus).toBe("ai_checked");
  });

  it("shouldRegenerate once for errors", () => {
    const w = fakeWord({
      id: "w-x-noun",
      word: "delay",
      level: "B1",
      meaningVi: "delay copy",
      definitionEn: "a delay in time",
    });
    const ctx = buildCatalogContext(
      [w],
      [{ id: "ws-1", wordIds: [w.id] }],
      new Map(),
    );
    const rules = validateWord(w, ctx);
    const review = cursorReviewWord(w, rules);
    expect(shouldRegenerate(rules, review, 0)).toBe(true);
    expect(shouldRegenerate(rules, review, 1)).toBe(false);
  });
});
