import { describe, expect, it } from "vitest";

import { SET_MAX_SIZE, SET_MIN_SIZE } from "../../config";
import {
  buildSets,
  planSetCount,
  pickFoldTarget,
  splitEvenly,
  titleForSet,
} from "../lib/build-sets";
import {
  classifyAll,
  createClassifyContext,
  inputHashFor,
  lowConfidenceWords,
} from "../lib/classify";
import type { ClassifiedWord } from "../lib/classify";
import type { SkeletonWord } from "../lib/types";
import { loadTopics, topicIdSet } from "../lib/topics";

function sk(
  partial: Partial<SkeletonWord> & Pick<SkeletonWord, "id" | "word" | "partOfSpeech" | "level">,
): SkeletonWord {
  return {
    ipa: null,
    ipaSource: "missing",
    frequencyRank: 100,
    flagged: false,
    source: "cefrj-1.5",
    notes: null,
    otherLevels: [],
    isMultiWord: partial.word.includes(" "),
    ...partial,
  };
}

describe("classify", () => {
  it("maps grammar POS to Grammar words", () => {
    const ctx = createClassifyContext();
    ctx.corrections = new Map();
    const w = classifyAll(
      [sk({ id: "w-about-preposition", word: "about", partOfSpeech: "preposition", level: "A1" })],
      ctx,
    )[0]!;
    expect(w.topicId).toBe("Grammar words");
    expect(w.confidence).toBeGreaterThan(0.9);
  });

  it("only emits topics from topics.json", () => {
    const topics = topicIdSet(loadTopics());
    const ctx = createClassifyContext();
    const words = classifyAll(
      [
        sk({ id: "w-bread-noun", word: "bread", partOfSpeech: "noun", level: "A1", flagged: true }),
        sk({ id: "w-however-adverb", word: "however", partOfSpeech: "adverb", level: "B1" }),
      ],
      ctx,
    );
    for (const w of words) {
      expect(topics.has(w.topicId)).toBe(true);
    }
  });

  it("inputHash is stable", () => {
    const a = sk({ id: "w-x-noun", word: "x", partOfSpeech: "noun", level: "A1" });
    expect(inputHashFor(a)).toBe(inputHashFor({ ...a }));
  });
});

describe("build-sets", () => {
  it("planSetCount keeps sizes in range", () => {
    expect(planSetCount(11)).toBe(0);
    expect(planSetCount(12)).toBe(1);
    expect(planSetCount(25)).toBe(1);
    expect(planSetCount(50)).toBe(2);
    expect(planSetCount(75)).toBe(3);
    const k = planSetCount(90);
    const sizes = splitEvenly(Array.from({ length: 90 }, (_, i) => i), k).map(
      (c) => c.length,
    );
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(SET_MIN_SIZE);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(SET_MAX_SIZE);
  });

  it("folds tiny cells into densest level and keeps set sizes valid", () => {
    const mk = (
      topicId: string,
      level: ClassifiedWord["level"],
      n: number,
      start: number,
    ): ClassifiedWord[] =>
      Array.from({ length: n }, (_, i) => ({
        ...sk({
          id: `w-${topicId}-${level}-${start + i}-noun`,
          word: `${topicId}${level}${start + i}`,
          partOfSpeech: "noun",
          level,
          frequencyRank: start + i,
        }),
        topicId,
        confidence: 0.9,
        reason: "test",
        classifyMethod: "test",
        promptVersion: "classify.v1",
        inputHash: "x",
      }));

    // Tech: tiny A1/A2/B2, denser B1
    const words = [
      ...mk("Technology", "A1", 2, 0),
      ...mk("Technology", "A2", 5, 10),
      ...mk("Technology", "B1", 20, 20),
      ...mk("Technology", "B2", 4, 50),
    ];
    const { sets, folds } = buildSets(words);
    expect(folds.length).toBeGreaterThan(0);
    expect(sets.every((s) => s.wordIds.length >= SET_MIN_SIZE)).toBe(true);
    expect(sets.every((s) => s.wordIds.length <= SET_MAX_SIZE)).toBe(true);
    // Stable ids
    const again = buildSets(words);
    expect(sets.map((s) => s.id)).toEqual(again.sets.map((s) => s.id));
  });

  it("pickFoldTarget prefers densest other level", () => {
    const pools = new Map();
    pools.set("Technology||A1", [{}]);
    pools.set("Technology||A2", [{}, {}]);
    pools.set("Technology||B1", Array.from({ length: 14 }, () => ({})));
    pools.set("Technology||B2", [{}, {}, {}]);
    expect(pickFoldTarget("Technology", "A1", pools as never)).toBe("B1");
  });

  it("titles are 2–4 words", () => {
    const words = [
      {
        ...sk({
          id: "w-a-noun",
          word: "bread",
          partOfSpeech: "noun",
          level: "A1",
          frequencyRank: 1,
        }),
        topicId: "Food",
        confidence: 1,
        reason: "t",
        classifyMethod: "t",
        promptVersion: "classify.v1",
        inputHash: "h",
      },
      {
        ...sk({
          id: "w-b-noun",
          word: "rice",
          partOfSpeech: "noun",
          level: "A1",
          frequencyRank: 2,
        }),
        topicId: "Food",
        confidence: 1,
        reason: "t",
        classifyMethod: "t",
        promptVersion: "classify.v1",
        inputHash: "h",
      },
    ] as ClassifiedWord[];
    const t = titleForSet("Food", "A1", 1, words);
    const n = t.title.trim().split(/\s+/).length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(4);
    expect(t.titleVi.length).toBeGreaterThan(0);
  });
});

describe("low confidence helper", () => {
  it("sorts by confidence then word", () => {
    const rows = lowConfidenceWords(
      [
        {
          ...sk({ id: "w-b", word: "b", partOfSpeech: "noun", level: "A1" }),
          topicId: "Daily life",
          confidence: 0.5,
          reason: "x",
          classifyMethod: "fallback",
          promptVersion: "classify.v1",
          inputHash: "h",
        },
        {
          ...sk({ id: "w-a", word: "a", partOfSpeech: "noun", level: "A1" }),
          topicId: "Daily life",
          confidence: 0.4,
          reason: "x",
          classifyMethod: "fallback",
          promptVersion: "classify.v1",
          inputHash: "h",
        },
      ],
      0.7,
    );
    expect(rows.map((r) => r.word)).toEqual(["a", "b"]);
  });
});
