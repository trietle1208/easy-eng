import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { activityEvents, user, userSettings } from "@/db/schema";
import { closeTestPool, getTestPool, resetTestDatabase } from "@/db/test-utils";
import type { CurrentUser } from "@/lib/auth/session";
import {
  getContinueItems,
  getDailyGoal,
  getHomeCatalogStats,
  getWordOfTheDay,
} from "@/lib/data/home";
import {
  getAchievements,
  getActivity,
  getProfile,
  recordStudySession,
  updateProfile,
  updateSettings,
} from "@/lib/data/profile";
import { newEntityId } from "@/lib/data/progress-write";

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

function makeUser(
  partial: Partial<CurrentUser> & { id: string; email: string },
): CurrentUser {
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
    goalText: u.goalText,
    role: u.role,
  });
  await db.insert(userSettings).values({
    userId: u.id,
    wordsPerDay: 20,
    grammarPerDay: 2,
    dailyReminder: true,
    reminderTime: "20:30",
    reminderDays: ["mon", "tue", "wed", "thu", "fri", "sun"],
    streakRescue: true,
    interfaceLanguage: "en",
    showVietnameseHints: true,
    autoPlayPronunciation: false,
    theme: "default",
  });
}

describe("phase 7 home / profile", () => {
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
    const { execSync } = await import("node:child_process");
    const testUrl =
      process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
    execSync("pnpm exec tsx scripts/seed.ts --content", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
    mockUser.current = null;
  }, 120_000);

  afterAll(async () => {
    await closeTestPool();
  });

  it("anonymous home is empty-but-correct", async () => {
    const goal = await getDailyGoal();
    expect(goal.streakDays).toBe(0);
    expect(goal.newWords.current).toBe(0);
    expect(goal.grammar.current).toBe(0);
    expect(await getContinueItems()).toEqual([]);

    const stats = await getHomeCatalogStats();
    expect(stats.grammarLessons).toBeGreaterThan(0);
    expect(stats.wordSets).toBeGreaterThan(0);

    const wotd = await getWordOfTheDay();
    expect(wotd.word.length).toBeGreaterThan(0);
    expect(wotd.example.length).toBeGreaterThan(0);
  });

  it("new user profile has zero streak and empty heatmap activity", async () => {
    const u = makeUser({ id: "u-new", email: "new@example.com" });
    await insertUser(u);
    mockUser.current = u;

    const { stats, levels } = await getProfile();
    expect(stats.streakDays).toBe(0);
    expect(stats.bestStreakDays).toBe(0);
    expect(stats.wordsLearned).toBe(0);
    expect(levels.some((l) => l.current && l.level === "A1")).toBe(true);

    const activity = await getActivity({ weeks: 4 });
    expect(activity.activeDays).toBe(0);
    expect(activity.days.every((d) => (d.intensity ?? 0) === 0 || d.intensity === null)).toBe(
      true,
    );
  });

  it("study session ≥60s updates streak and heatmap", async () => {
    const u = makeUser({ id: "u-study", email: "study@example.com" });
    await insertUser(u);
    mockUser.current = u;

    const before = await getDailyGoal();
    expect(before.streakDays).toBe(0);

    const result = await recordStudySession({
      durationSeconds: 120,
      mode: "study",
    });
    expect(result.recorded).toBe(true);

    const after = await getDailyGoal();
    expect(after.streakDays).toBe(1);

    const activity = await getActivity({ weeks: 4 });
    expect(activity.activeDays).toBeGreaterThanOrEqual(1);
  });

  it("updateSettings persists theme; updateProfile updates name/level", async () => {
    const u = makeUser({ id: "u-set", email: "set@example.com" });
    await insertUser(u);
    mockUser.current = u;

    const settings = await updateSettings({ theme: "blossom", wordsPerDay: 30 });
    expect(settings.theme).toBe("blossom");
    expect(settings.wordsPerDay).toBe(30);

    const [row] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, u.id));
    expect(row?.theme).toBe("blossom");

    const profile = await updateProfile({
      displayName: "Lan Nguyễn",
      level: "B1",
      timezone: "Asia/Bangkok",
      goalText: "TOEIC 700",
    });
    expect(profile.displayName).toBe("Lan Nguyễn");
    expect(profile.level).toBe("B1");
    expect(profile.goalLabel).toContain("TOEIC 700");
  });

  it("achievements evaluate and persist newly earned", async () => {
    const u = makeUser({ id: "u-ach", email: "ach@example.com" });
    await insertUser(u);
    mockUser.current = u;

    // Seed a grammar_done + early activity so first-page / early-bird can unlock.
    await db.insert(activityEvents).values({
      id: newEntityId(),
      userId: u.id,
      occurredAt: new Date("2026-09-30T00:30:00.000Z"), // 07:30 ICT → not early
      localDate: "2026-09-30",
      kind: "grammar_done",
      durationSeconds: 240,
      payload: { ref: "lesson-1" },
    });

    // Force early-bird: activity before 07:00 ICT (= before 00:00 UTC)
    await db.insert(activityEvents).values({
      id: newEntityId(),
      userId: u.id,
      occurredAt: new Date("2026-09-29T22:00:00.000Z"), // 05:00 ICT
      localDate: "2026-09-30",
      kind: "study_session",
      durationSeconds: 90,
      payload: { ref: "early" },
    });

    // Mark grammar completed in progress table for grammar_completed rule
    const { upsertLessonProgress } = await import("@/lib/data/progress-write");
    await upsertLessonProgress({
      userId: u.id,
      contentKind: "grammar",
      contentId: "present-perfect-vs-past-simple",
      status: "completed",
      progressPercent: 100,
    });

    const { items, earnedCount } = await getAchievements();
    expect(earnedCount).toBeGreaterThan(0);
    expect(items.find((a) => a.id === "first-page")?.earned).toBe(true);
    expect(items.find((a) => a.id === "early-bird")?.earned).toBe(true);

    // Second call is idempotent
    const again = await getAchievements();
    expect(again.earnedCount).toBe(earnedCount);
  });

  it("word of the day is stable for the same day/level", async () => {
    const u = makeUser({
      id: "u-wotd",
      email: "wotd@example.com",
      cefrLevel: "A2",
    });
    await insertUser(u);
    mockUser.current = u;
    const a = await getWordOfTheDay();
    const b = await getWordOfTheDay();
    expect(a.word).toBe(b.word);
    expect(a.level).toBe("A2");
  });
});
