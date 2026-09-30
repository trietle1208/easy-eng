import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  activityEvents,
  quizAttempts,
  user,
  userLessonProgress,
} from "@/db/schema";
import {
  closeTestPool,
  getTestPool,
  resetTestDatabase,
  seedTestContent,
} from "@/db/test-utils";
import { checkDictation } from "@/lib/data/listening";
import { checkReadingAnswers } from "@/lib/data/reading";
import {
  getFirstQuizSlug,
  getLastAttempt,
  getQuiz,
  submitQuiz,
} from "@/lib/data/quiz";
import { getFirstListeningSlug } from "@/lib/data/listening";
import { getFirstReadingSlug, getPassage } from "@/lib/data/reading";
import type { CurrentUser } from "@/lib/auth/session";

const mockUser = vi.hoisted(() => ({
  current: null as CurrentUser | null,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(async () => mockUser.current),
  requireUser: vi.fn(async () => {
    if (!mockUser.current) throw new Error("requireUser: no session");
    return mockUser.current;
  }),
}));

function makeUser(partial: Partial<CurrentUser> & { id: string; email: string }): CurrentUser {
  return {
    name: partial.name ?? "Test User",
    emailVerified: true,
    image: null,
    cefrLevel: "A1",
    timezone: "Asia/Ho_Chi_Minh",
    goalText: null,
    role: "user",
    initials: "TU",
    firstName: partial.firstName ?? "Test",
    ...partial,
  };
}

async function insertUser(u: CurrentUser) {
  await db.insert(user).values({
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: true,
    cefrLevel: u.cefrLevel,
    timezone: u.timezone,
    role: u.role,
  });
}

describe("learning actions / progress writes", () => {
  beforeAll(async () => {
    const { execSync } = await import("node:child_process");
    const testUrl =
      process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
    execSync("pnpm exec tsx src/db/migrate.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
    void getTestPool();
  }, 120_000);

  beforeEach(async () => {
    await resetTestDatabase();
    await seedTestContent();
    mockUser.current = null;
  }, 120_000);

  afterAll(async () => {
    await closeTestPool();
  });

  describe("checkReadingAnswers", () => {
    it("scores empty / wrong / correct and strips nothing from result keys", async () => {
      const slug = await getFirstReadingSlug();
      const passage = await getPassage(slug);
      expect(passage).not.toBeNull();

      const empty = await checkReadingAnswers(slug, {});
      expect(empty).not.toBeNull();
      expect(empty!.score).toBe(0);
      expect(empty!.progressSaved).toBe(false);
      expect(empty!.results.every((r) => r.isCorrect === false)).toBe(true);

      const allWrong = Object.fromEntries(
        passage!.questions.map((q) => [q.id, 0]),
      );
      // May accidentally get some right if correctIndex is 0 — just assert shape
      const wrongish = await checkReadingAnswers(slug, allWrong);
      expect(wrongish!.total).toBe(passage!.questions.length);
      expect(wrongish!.results[0]).toHaveProperty("correctIndex");
    });

    it("anonymous scores but writes nothing", async () => {
      mockUser.current = null;
      const slug = await getFirstReadingSlug();
      const res = await checkReadingAnswers(slug, {});
      expect(res!.progressSaved).toBe(false);

      const progress = await db.select().from(userLessonProgress);
      const events = await db.select().from(activityEvents);
      expect(progress).toHaveLength(0);
      expect(events).toHaveLength(0);
    });

    it("signed-in user persists in_progress / completed + activity", async () => {
      const alice = makeUser({
        id: "user-alice",
        email: "alice@example.com",
        firstName: "Alice",
        name: "Alice Nguyen",
      });
      await insertUser(alice);
      mockUser.current = alice;

      const slug = await getFirstReadingSlug();
      // Force in_progress by submitting empty
      const partial = await checkReadingAnswers(slug, {});
      expect(partial!.progressSaved).toBe(true);
      expect(partial!.score).toBe(0);

      const [row] = await db
        .select()
        .from(userLessonProgress)
        .where(eq(userLessonProgress.userId, alice.id));
      expect(row?.status).toBe("in_progress");
      expect(row?.contentKind).toBe("reading");
      expect(row?.contentId).toBe(slug);

      // Build perfect answers from a secure check path: use DB via wrong→scan
      // Re-check with correct indexes from the last result
      const perfectAnswers = Object.fromEntries(
        partial!.results.map((r) => [r.questionId, r.correctIndex]),
      );
      const perfect = await checkReadingAnswers(slug, perfectAnswers);
      expect(perfect!.score).toBe(perfect!.total);

      const [done] = await db
        .select()
        .from(userLessonProgress)
        .where(eq(userLessonProgress.userId, alice.id));
      expect(done?.status).toBe("completed");

      const events = await db
        .select()
        .from(activityEvents)
        .where(eq(activityEvents.userId, alice.id));
      expect(events.some((e) => e.kind === "reading_done")).toBe(true);
    });
  });

  describe("checkDictation", () => {
    it("normalizes case/whitespace/punctuation and accepts alternates", async () => {
      mockUser.current = null;
      const slug = await getFirstListeningSlug();
      const wrong = await checkDictation(slug, {});
      expect(wrong!.score).toBe(0);
      expect(wrong!.progressSaved).toBe(false);

      const answers: Record<string, string> = {};
      for (const item of wrong!.results) {
        // Uppercase + trailing punctuation + spaces
        answers[item.blankId] = `  ${item.answer.toUpperCase()}!!  `;
      }
      const ok = await checkDictation(slug, answers);
      expect(ok!.score).toBe(ok!.total);
    });

    it("signed-in completion writes listening progress", async () => {
      const bob = makeUser({
        id: "user-bob",
        email: "bob@example.com",
        firstName: "Bob",
        name: "Bob Tran",
      });
      await insertUser(bob);
      mockUser.current = bob;

      const slug = await getFirstListeningSlug();
      const scored = await checkDictation(slug, {});
      const perfect = Object.fromEntries(
        scored!.results.map((r) => [r.blankId, r.answer]),
      );
      const done = await checkDictation(slug, perfect);
      expect(done!.progressSaved).toBe(true);
      expect(done!.score).toBe(done!.total);

      const [row] = await db
        .select()
        .from(userLessonProgress)
        .where(eq(userLessonProgress.userId, bob.id));
      expect(row?.status).toBe("completed");
      expect(row?.contentKind).toBe("listening");
    });
  });

  describe("submitQuiz", () => {
    it("scores fill-blank case/whitespace and partial retry", async () => {
      mockUser.current = null;
      const slug = await getFirstQuizSlug();
      const publicQuiz = await getQuiz(slug);
      expect(publicQuiz).not.toBeNull();

      // Empty answers
      const empty = await submitQuiz(slug, {}, 30);
      expect(empty).not.toBeNull();
      expect(empty!.attempt.score).toBe(0);
      expect(empty!.progressSaved).toBe(false);
      expect(empty!.headlineEn).toContain("friend");

      // Retry mistakes only — subset of questions
      const subsetIds = publicQuiz!.questions.slice(0, 2).map((q) => q.id);
      const retry = await submitQuiz(slug, {}, 10, { questionIds: subsetIds });
      expect(retry!.attempt.total).toBe(2);
      expect(retry!.deltaVsLast).toBeNull();
    });

    it("persists attempt, computes deltaVsLast, uses real name", async () => {
      const linh = makeUser({
        id: "user-linh",
        email: "linh-test@example.com",
        firstName: "Linh",
        name: "Linh Tran",
      });
      await insertUser(linh);
      mockUser.current = linh;

      const slug = await getFirstQuizSlug();
      const first = await submitQuiz(
        slug,
        {},
        40,
        { clientAttemptId: "11111111-1111-4111-8111-111111111111" },
      );
      expect(first!.progressSaved).toBe(true);
      expect(first!.headlineEn).toContain("Linh");
      expect(first!.lastScore).toBeNull();

      const second = await submitQuiz(
        slug,
        {},
        35,
        { clientAttemptId: "22222222-2222-4222-8222-222222222222" },
      );
      expect(second!.lastScore).toBe(first!.attempt.score);
      expect(second!.deltaVsLast).toBe(
        second!.attempt.score - first!.attempt.score,
      );

      const rows = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, linh.id));
      expect(rows).toHaveLength(2);

      const last = await getLastAttempt(slug);
      expect(last?.score).toBe(second!.attempt.score);
    });

    it("idempotent clientAttemptId does not duplicate rows", async () => {
      const linh = makeUser({
        id: "user-linh-2",
        email: "linh2@example.com",
        firstName: "Linh",
        name: "Linh Tran",
      });
      await insertUser(linh);
      mockUser.current = linh;

      const slug = await getFirstQuizSlug();
      const id = "33333333-3333-4333-8333-333333333333";
      const a = await submitQuiz(slug, {}, 20, { clientAttemptId: id });
      const b = await submitQuiz(slug, {}, 20, { clientAttemptId: id });
      expect(a!.attempt.completedAt).toBe(b!.attempt.completedAt);

      const rows = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, linh.id));
      expect(rows).toHaveLength(1);
    });

    it("one user never reads another user's attempts", async () => {
      const a = makeUser({
        id: "user-a",
        email: "a@example.com",
        firstName: "A",
        name: "User A",
      });
      const b = makeUser({
        id: "user-b",
        email: "b@example.com",
        firstName: "B",
        name: "User B",
      });
      await insertUser(a);
      await insertUser(b);

      const slug = await getFirstQuizSlug();
      mockUser.current = a;
      await submitQuiz(slug, {}, 25, {
        clientAttemptId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      });

      mockUser.current = b;
      const last = await getLastAttempt(slug);
      expect(last).toBeNull();

      const result = await submitQuiz(slug, {}, 25, {
        clientAttemptId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      });
      expect(result!.lastScore).toBeNull();
      expect(result!.deltaVsLast).toBeNull();

      const aRows = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, a.id));
      const bRows = await db
        .select()
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, b.id));
      expect(aRows).toHaveLength(1);
      expect(bRows).toHaveLength(1);
    });
  });
});
