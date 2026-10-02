import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  activityEvents,
  reviewLogs,
  user,
  userWordCards,
  wordSets,
  words,
} from "@/db/schema";
import { closeTestPool, getTestPool, resetTestDatabase } from "@/db/test-utils";
import type { CurrentUser } from "@/lib/auth/session";
import { foldSearch } from "@/lib/fold-search";
import { emptyCardRow, gradeCard } from "@/lib/fsrs";
import {
  createWord,
  deleteWord,
  deleteWordSet,
  getReviewDue,
  getReviewDueCount,
  gradeReview,
  startWordSet,
  updateWord,
  uploadWordImage,
  VocabularyError,
} from "@/lib/data/vocabulary";

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
    role: u.role,
  });
}

describe("vocabulary CRUD + FSRS", () => {
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

  it("foldSearch strips Vietnamese diacritics", () => {
    expect(foldSearch("Ẩm thực")).toBe("am thuc");
    expect(foldSearch("SÂN BAY")).toBe("san bay");
  });

  it("FSRS know_it schedules later than still_learning", () => {
    const base = emptyCardRow(new Date("2026-09-30T00:00:00.000Z"));
    const again = gradeCard(base, "still_learning", new Date("2026-09-30T01:00:00.000Z"));
    const good = gradeCard(base, "know_it", new Date("2026-09-30T01:00:00.000Z"));
    expect(good.card.due.getTime()).toBeGreaterThan(again.card.due.getTime());
    expect(again.rating).toBe(1);
    expect(good.rating).toBe(3);
  });

  it("createWord persists card + activity; blocks duplicates", async () => {
    const alice = makeUser({ id: "u-alice", email: "alice-v@example.com" });
    await insertUser(alice);
    mockUser.current = alice;

    const created = await createWord({
      word: "runway",
      partOfSpeech: "noun",
      level: "A2",
      meaningVi: "đường băng",
      examples: ["The plane left the runway."],
      wordSetId: "at-the-airport",
    });
    expect(created.owned).toBe(true);

    const cards = await db
      .select()
      .from(userWordCards)
      .where(
        and(
          eq(userWordCards.userId, alice.id),
          eq(userWordCards.wordId, created.id),
        ),
      );
    expect(cards).toHaveLength(1);

    const events = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.userId, alice.id));
    expect(events.some((e) => e.kind === "word_added")).toBe(true);

    await expect(
      createWord({
        word: "Runway",
        partOfSpeech: "noun",
        level: "A2",
        meaningVi: "đường băng",
        examples: [],
        wordSetId: "at-the-airport",
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE" } satisfies Partial<VocabularyError>);
  });

  it("cannot edit/delete another user's or system words", async () => {
    const alice = makeUser({ id: "u-a", email: "a-v@example.com" });
    const bob = makeUser({ id: "u-b", email: "b-v@example.com" });
    await insertUser(alice);
    await insertUser(bob);

    mockUser.current = alice;
    const mine = await createWord({
      word: "gatehouse",
      partOfSpeech: "noun",
      level: "B1",
      meaningVi: "nhà cổng",
      examples: [],
      newWordSetTitle: "Alice set",
    });

    mockUser.current = bob;
    await expect(
      updateWord({ id: mine.id, meaningVi: "hacked" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(deleteWord(mine.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    // system word
    const [systemWord] = await db
      .select()
      .from(words)
      .where(eq(words.id, "w-itinerary"))
      .limit(1);
    expect(systemWord).toBeTruthy();
    await expect(
      updateWord({ id: systemWord!.id, meaningVi: "nope" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(deleteWord(systemWord!.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(deleteWordSet("at-the-airport")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("startWordSet + gradeReview reduces due count and writes log", async () => {
    const alice = makeUser({ id: "u-rev", email: "rev@example.com" });
    await insertUser(alice);
    mockUser.current = alice;

    const createdCards = await startWordSet("at-the-airport");
    expect(createdCards).toBeGreaterThan(0);

    const before = await getReviewDueCount();
    expect(before).toBeGreaterThan(0);

    const due = await getReviewDue();
    expect(due?.cardId).toBeTruthy();

    const next = await gradeReview(due!.cardId, "know_it");
    const after = await getReviewDueCount();
    expect(after).toBe(before - 1);
    expect(next?.count ?? 0).toBe(after);

    const logs = await db
      .select()
      .from(reviewLogs)
      .where(eq(reviewLogs.userId, alice.id));
    expect(logs.length).toBeGreaterThanOrEqual(1);

    const events = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.userId, alice.id));
    expect(events.some((e) => e.kind === "review_done")).toBe(true);
  });

  it("uploadWordImage validates type and size", async () => {
    const alice = makeUser({ id: "u-img", email: "img@example.com" });
    await insertUser(alice);
    mockUser.current = alice;

    await expect(
      uploadWordImage({
        bytes: Buffer.from("not-an-image"),
        contentType: "text/plain",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const huge = Buffer.alloc(2 * 1024 * 1024 + 1, 1);
    await expect(
      uploadWordImage({
        bytes: huge,
        contentType: "image/png",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });

    const ok = await uploadWordImage({
      bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      contentType: "image/png",
    });
    expect(ok.url.startsWith("/files/vocabulary/")).toBe(true);
  });

  it("owner can delete their personal set", async () => {
    const alice = makeUser({ id: "u-set", email: "set@example.com" });
    await insertUser(alice);
    mockUser.current = alice;

    const w = await createWord({
      word: "notebook",
      partOfSpeech: "noun",
      level: "A1",
      meaningVi: "sổ tay",
      examples: [],
      newWordSetTitle: "My notes",
    });

    await deleteWordSet(w.wordSetId);
    const [gone] = await db
      .select()
      .from(wordSets)
      .where(eq(wordSets.id, w.wordSetId))
      .limit(1);
    expect(gone).toBeUndefined();
  });
});
