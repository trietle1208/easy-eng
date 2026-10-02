import { describe, expect, it } from "vitest";

import {
  exampleContainsHeadword,
  enrichModelBatchSchema,
  softValidateEnrichItem,
  validateBatchAgainstIds,
  wordCount,
} from "../lib/enrich-schema";
import {
  IRREGULAR_VERBS,
  altSpellingFromNotes,
  chunkArray,
  enrichInputHash,
  mergeEnrichment,
  selectPilotWords,
  toEnrichInput,
  unwrapBatchPayload,
} from "../lib/enrich";
import type { ClassifiedWord } from "../lib/classify";

function fakeWord(
  partial: Partial<ClassifiedWord> & Pick<ClassifiedWord, "id" | "word" | "level">,
): ClassifiedWord {
  return {
    partOfSpeech: "noun",
    ipa: "/tɛst/",
    ipaSource: "dictionary",
    frequencyRank: 100,
    flagged: false,
    source: "cefrj-1.5",
    notes: null,
    otherLevels: [],
    isMultiWord: false,
    promptVersion: "classify.v1",
    inputHash: "abc",
    topicId: "Daily life",
    confidence: 0.9,
    reason: "test",
    classifyMethod: "lexicon",
    ...partial,
  };
}

describe("enrich schema", () => {
  it("counts words and detects headword in examples", () => {
    expect(wordCount("a detailed plan of a journey")).toBe(6);
    expect(exampleContainsHeadword("I go to work.", "go")).toBe(true);
    expect(exampleContainsHeadword("She went home early.", "go")).toBe(true);
    expect(exampleContainsHeadword("bank account number", "bank account")).toBe(
      true,
    );
  });

  it("rejects definition with headword and long defs", () => {
    const item = {
      id: "w-delay-noun",
      meaningVi: "sự chậm trễ",
      definitionEn: "a delay that happens later than planned time",
      examples: [
        { en: "There was a long delay today.", vi: "Hôm nay bị chậm lâu." },
        { en: "Sorry for the delay.", vi: "Xin lỗi vì chậm." },
      ],
      collocations: ["flight delay", "without delay"],
      notes: null,
    };
    const issues = softValidateEnrichItem(item, {
      word: "delay",
      level: "B1",
    });
    expect(issues.some((i) => i.code === "DEF_HEADWORD")).toBe(true);
  });

  it("validates batch ids exactly", () => {
    const batch = enrichModelBatchSchema.parse([
      {
        id: "a",
        meaningVi: "đi",
        definitionEn: "to move to a place",
        examples: [
          { en: "I go home now.", vi: "Tôi về nhà." },
          { en: "We go by bus.", vi: "Chúng tôi đi xe buýt." },
        ],
        collocations: ["go home", "go by bus"],
        notes: null,
      },
    ]);
    const missing = validateBatchAgainstIds(batch, ["a", "b"]);
    expect(missing.ok).toBe(false);
    expect(missing.issues.some((i) => i.code === "MISSING_ID")).toBe(true);
  });
});

describe("enrich helpers", () => {
  it("parses UK spelling from skeleton notes", () => {
    expect(altSpellingFromNotes("Also UK: colour")).toBe("colour");
    expect(altSpellingFromNotes(null)).toBeNull();
  });

  it("hashes enrich input by prompt version", () => {
    const w = fakeWord({ id: "w-color-noun", word: "color", level: "A2", notes: "Also UK: colour" });
    const h1 = enrichInputHash(toEnrichInput(w));
    expect(h1).toHaveLength(16);
  });

  it("selectPilotWords returns 25 per level with mix", () => {
    const words: ClassifiedWord[] = [];
    const topics = [
      "Food",
      "Travel",
      "Work",
      "Health",
      "School",
      "Home",
      "Sports",
      "Daily life",
    ];
    let n = 0;
    for (const level of ["A1", "A2", "B1", "B2"] as const) {
      for (let i = 0; i < 80; i++) {
        const word =
          i === 0
            ? "bank account"
            : i === 1
              ? "go"
              : i === 2
                ? "light"
                : `word${level}${i}`;
        words.push(
          fakeWord({
            id: `w-${n++}`,
            word,
            level,
            partOfSpeech: i === 1 ? "verb" : "noun",
            isMultiWord: word.includes(" "),
            topicId: topics[i % topics.length]!,
          }),
        );
      }
    }
    const pilot = selectPilotWords(words, 25, 4);
    expect(pilot).toHaveLength(100);
    expect(pilot.filter((w) => w.level === "A1")).toHaveLength(25);
    expect(pilot.some((w) => w.isMultiWord)).toBe(true);
    expect(
      pilot.some((w) => w.partOfSpeech === "verb" && IRREGULAR_VERBS.has(w.word)),
    ).toBe(true);
  });

  it("chunkArray and unwrapBatchPayload", () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(unwrapBatchPayload({ items: [1] })).toEqual([1]);
    expect(unwrapBatchPayload([1, 2])).toEqual([1, 2]);
  });

  it("mergeEnrichment sets reviewStatus and source", () => {
    const base = fakeWord({ id: "w-go-verb", word: "go", level: "A1", partOfSpeech: "verb" });
    const merged = mergeEnrichment(
      base,
      {
        id: "w-go-verb",
        meaningVi: "đi",
        definitionEn: "to move or travel to a place",
        examples: [
          { en: "I go to work by bus.", vi: "Tôi đi làm bằng xe buýt." },
          { en: "Shall we go home now?", vi: "Chúng ta về nhà luôn nhé?" },
        ],
        collocations: ["go home", "go to work"],
        notes: "irregular: go / went / gone",
      },
      "hash123",
    );
    expect(merged.reviewStatus).toBe("ai_generated");
    expect(merged.source).toBe("cefrj-1.5+ai");
    expect(merged.examples).toHaveLength(2);
    expect(merged.enrichNotes).toContain("irregular");
  });
});
