import { readFileSync } from "node:fs";
import path from "node:path";

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  grammarContentSchema,
  listeningContentSchema,
  quizContentSchema,
  readingContentSchema,
  vocabularyContentSchema,
} from "../../../content/schema";
import * as schema from "@/db/schema";
import { closeTestPool, getTestPool } from "@/db/test-utils";
import { mapGrammarLesson } from "@/lib/data/mappers/grammar";
import { mapListeningLesson, mapDictationBlanksSecure } from "@/lib/data/mappers/listening";
import { mapQuiz } from "@/lib/data/mappers/quiz";
import { mapReadingPassage, mapReadingQuestionsSecure } from "@/lib/data/mappers/reading";
import { mapWord } from "@/lib/data/mappers/vocabulary";

const CONTENT = path.join(process.cwd(), "content");

function load<T>(file: string, zod: { parse: (d: unknown) => T }): T {
  return zod.parse(JSON.parse(readFileSync(path.join(CONTENT, file), "utf8")));
}

describe("seed parity (content vs DB)", () => {
  const pool = getTestPool();
  const db = drizzle(pool, { schema });

  beforeAll(async () => {
    // Ensure migrations applied on test DB (migrate uses DATABASE_URL; point at test).
    const { execSync } = await import("node:child_process");
    const testUrl =
      process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
    execSync("pnpm exec tsx src/db/migrate.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
    execSync("pnpm exec tsx scripts/seed.ts --content", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
  }, 120_000);

  afterAll(async () => {
    await closeTestPool();
  });

  it("matches content JSON counts", async () => {
    const grammar = load("grammar.json", grammarContentSchema);
    const reading = load("reading.json", readingContentSchema);
    const listening = load("listening.json", listeningContentSchema);
    const quiz = load("quiz.json", quizContentSchema);
    const vocabulary = load("vocabulary.json", vocabularyContentSchema);

    const [families] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.grammarFamilies);
    const [groups] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.grammarGroups);
    const [lessons] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.grammarLessons);
    const [passages] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.readingPassages);
    const [listeningCount] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.listeningLessons);
    const [quizzes] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.quizzes);
    const [sets] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.wordSets);
    const [words] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.words);

    expect(families!.n).toBe(grammar.families.length);
    expect(groups!.n).toBe(grammar.groups.length);
    expect(lessons!.n).toBe(grammar.lessons.length);
    expect(passages!.n).toBe(reading.passages.length);
    expect(listeningCount!.n).toBe(listening.lessons.length);
    expect(quizzes!.n).toBe(quiz.quizzes.length);
    expect(sets!.n).toBe(vocabulary.sets.length);
    expect(words!.n).toBe(vocabulary.words.length);
  });

  it("maps a sample grammar lesson 1:1 with content", async () => {
    const grammar = load("grammar.json", grammarContentSchema);
    const featured = grammar.lessons.find(
      (l) => l.slug === "use-subject-verb-clauses",
    )!;
    const row = await db.query.grammarLessons.findFirst({
      where: eq(schema.grammarLessons.slug, featured.slug),
    });
    expect(row).toBeTruthy();
    const family = await db.query.grammarFamilies.findFirst({
      where: eq(schema.grammarFamilies.id, featured.familyId),
    });
    const group = await db.query.grammarGroups.findFirst({
      where: eq(schema.grammarGroups.id, featured.groupId),
    });
    const groupLessons = await db.query.grammarLessons.findMany({
      where: eq(schema.grammarLessons.groupId, featured.groupId),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });

    const mapped = mapGrammarLesson(
      row!,
      family!,
      group!,
      groupLessons,
    );
    expect(mapped.title).toBe(featured.title);
    expect(mapped.introEn).toBe(featured.introEn);
    expect(mapped.structure).toEqual(featured.structure);
    expect(mapped.examples).toEqual(featured.examples);
  });

  it("maps reading night-bus passage against content", async () => {
    const reading = load("reading.json", readingContentSchema);
    const src = reading.passages.find(
      (p) => p.slug === "the-night-bus-to-da-lat",
    )!;
    const row = await db.query.readingPassages.findFirst({
      where: eq(schema.readingPassages.slug, src.slug),
      with: {
        paragraphs: true,
        vocabulary: true,
        questions: true,
      },
    });
    expect(row).toBeTruthy();
    const topicPassages = reading.passages
      .filter((p) => p.topic === src.topic)
      .map((p) => ({ slug: p.slug }));
    const mapped = mapReadingPassage(
      row!,
      row!.paragraphs,
      row!.vocabulary,
      row!.questions,
      topicPassages,
    );
    expect(mapped.paragraphs).toHaveLength(src.paragraphs.length);
    expect(mapped.vocabulary).toHaveLength(src.vocabulary.length);
    expect("correctIndex" in (mapped.questions[0] as object)).toBe(false);
    const secure = mapReadingQuestionsSecure(row!.questions, src.slug);
    expect(secure[0]!.correctIndex).toBe(src.questions[0]!.correctIndex);
    expect(mapped.wordCount).toBe(src.wordCount);
  });

  it("maps listening airport lesson against content", async () => {
    const listening = load("listening.json", listeningContentSchema);
    const src = listening.lessons.find(
      (l) => l.slug === "checking-in-at-the-airport",
    )!;
    const row = await db.query.listeningLessons.findFirst({
      where: eq(schema.listeningLessons.slug, src.slug),
      with: { transcript: true, blanks: true },
    });
    expect(row).toBeTruthy();
    const mapped = mapListeningLesson(
      row!,
      row!.transcript,
      row!.blanks,
      `/files/${row!.audioPath}`,
    );
    expect(mapped.blanks).toHaveLength(src.blanks.length);
    expect("answer" in (mapped.blanks[0] as object)).toBe(false);
    const secure = mapDictationBlanksSecure(row!.blanks, src.slug);
    expect(secure[0]!.answer).toBe(src.blanks[0]!.answer);
    expect(mapped.transcript[0]!.start).toBe(src.transcript[0]!.startMs / 1000);
  });

  it("maps present-perfect quiz against content", async () => {
    const quiz = load("quiz.json", quizContentSchema);
    const src = quiz.quizzes.find(
      (q) => q.slug === "present-perfect-vs-past-simple",
    )!;
    const row = await db.query.quizzes.findFirst({
      where: eq(schema.quizzes.slug, src.slug),
      with: { questions: true },
    });
    expect(row).toBeTruthy();
    const mapped = mapQuiz(row!, row!.questions);
    expect(mapped.questions).toHaveLength(src.questions.length);
    expect(mapped.passScore).toBe(src.passScore);
    const first = mapped.questions[0]!;
    expect(first.type).toBe(src.questions[0]!.type);
  });

  it("maps seed vocabulary word", async () => {
    const vocabulary = load("vocabulary.json", vocabularyContentSchema);
    const src = vocabulary.words.find((w) => w.id === "w-itinerary")!;
    const row = await db.query.words.findFirst({
      where: eq(schema.words.id, src.id),
    });
    expect(row).toBeTruthy();
    const mapped = mapWord(row!);
    expect(mapped.word).toBe(src.word);
    expect(mapped.examples).toEqual(src.examples);
  });

  it("second seed run does not change counts", async () => {
    const { execSync } = await import("node:child_process");
    const testUrl =
      process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
    const before = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.grammarLessons);
    execSync("pnpm exec tsx scripts/seed.ts --content", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
    const after = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.grammarLessons);
    expect(after[0]!.n).toBe(before[0]!.n);
  }, 60_000);
});
