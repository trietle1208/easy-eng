import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { closeTestPool, getTestPool } from "@/db/test-utils";
import {
  getAdjacentLessons,
  getFirstGrammarLessonSlug,
  getGrammarTree,
  getLesson,
} from "@/lib/data/grammar";
import {
  getFirstListeningSlug,
  getListeningLesson,
  getListeningLessons,
} from "@/lib/data/listening";
import { getFirstQuizSlug, getQuiz } from "@/lib/data/quiz";
import {
  getFirstReadingSlug,
  getPassage,
  getPassages,
} from "@/lib/data/reading";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(async () => null),
  requireUser: vi.fn(async () => {
    throw new Error("requireUser should not be called in these tests");
  }),
}));

describe("content read functions", () => {
  beforeAll(async () => {
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
    // Warm pool so drizzle client used by data layer can connect
    void getTestPool();
  }, 120_000);

  afterAll(async () => {
    await closeTestPool();
  });

  describe("grammar", () => {
    it("getLesson found / not found", async () => {
      const slug = await getFirstGrammarLessonSlug();
      const lesson = await getLesson(slug);
      expect(lesson).not.toBeNull();
      expect(lesson!.slug).toBe(slug);
      expect(lesson!.structure.length).toBeGreaterThan(0);

      expect(await getLesson("does-not-exist")).toBeNull();
    });

    it("getAdjacentLessons returns neighbours", async () => {
      const slug = await getFirstGrammarLessonSlug();
      const adj = await getAdjacentLessons(slug);
      expect(adj.previous).toBeNull();
      expect(adj.next).not.toBeNull();
    });

    it("getGrammarTree filters by level", async () => {
      const all = await getGrammarTree();
      expect(all.levelCounts.all).toBeGreaterThan(0);
      expect(all.families.length).toBeGreaterThan(0);
      expect(all.progress.done).toBe(0); // anonymous

      const a1 = await getGrammarTree({ level: "A1" });
      expect(a1.levelCounts.all).toBe(a1.levelCounts.A1);
      for (const family of a1.families) {
        for (const group of family.groups) {
          for (const lesson of group.lessons) {
            expect(lesson.level).toBe("A1");
          }
        }
      }
    });
  });

  describe("reading", () => {
    it("getPassage found / not found and strips answer keys", async () => {
      const slug = await getFirstReadingSlug();
      const passage = await getPassage(slug);
      expect(passage).not.toBeNull();
      expect(passage!.questions.length).toBeGreaterThan(0);
      expect("correctIndex" in (passage!.questions[0] as object)).toBe(false);
      expect(passage!.completed).toBe(false);

      expect(await getPassage("missing-passage")).toBeNull();
    });

    it("getPassages filters by topic", async () => {
      const travel = await getPassages({ topic: "Travel" });
      expect(travel.length).toBeGreaterThan(0);
      expect(travel.every((p) => p.topic === "Travel")).toBe(true);
    });
  });

  describe("listening", () => {
    it("getListeningLesson found / not found and strips answers", async () => {
      const slug = await getFirstListeningSlug();
      const lesson = await getListeningLesson(slug);
      expect(lesson).not.toBeNull();
      expect(lesson!.audioSrc.startsWith("/files/")).toBe(true);
      expect(lesson!.blanks.length).toBeGreaterThan(0);
      expect("answer" in (lesson!.blanks[0] as object)).toBe(false);
      expect("accept" in (lesson!.blanks[0] as object)).toBe(false);

      expect(await getListeningLesson("missing-lesson")).toBeNull();
    });

    it("getListeningLessons filters by level", async () => {
      const a2 = await getListeningLessons({ level: "A2" });
      expect(a2.every((l) => l.level === "A2")).toBe(true);
    });
  });

  describe("quiz", () => {
    it("getQuiz found / not found and strips answer keys", async () => {
      const slug = await getFirstQuizSlug();
      const quiz = await getQuiz(slug);
      expect(quiz).not.toBeNull();
      expect(quiz!.questions.length).toBeGreaterThan(0);
      const q = quiz!.questions[0]!;
      expect("correctIndex" in (q as object)).toBe(false);
      expect("correctAnswers" in (q as object)).toBe(false);
      expect("displayAnswer" in (q as object)).toBe(false);

      expect(await getQuiz("missing-quiz")).toBeNull();
    });
  });
});
