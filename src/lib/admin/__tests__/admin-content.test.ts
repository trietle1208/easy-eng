import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  adminAuditLog,
  grammarLessons,
  quizzes,
  readingPassages,
  user,
} from "@/db/schema";
import { closeTestPool, getTestPool } from "@/db/test-utils";
import { listAuditLog, writeAuditLog } from "@/lib/admin/audit";
import { setContentStatus } from "@/lib/admin/service";
import { getLesson } from "@/lib/data/grammar";
import { getQuiz } from "@/lib/data/quiz";
import { getPassage } from "@/lib/data/reading";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(async () => null),
  requireUser: vi.fn(async () => {
    throw new Error("requireUser should not be called in these tests");
  }),
  requireAdmin: vi.fn(async () => {
    throw new Error("requireAdmin should not be called in these tests");
  }),
}));

async function seedContent() {
  const { execSync } = await import("node:child_process");
  const testUrl =
    process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
  execSync("pnpm exec tsx scripts/seed.ts --content", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}

describe("admin content status + audit", () => {
  beforeAll(async () => {
    const { execSync } = await import("node:child_process");
    const testUrl =
      process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
    execSync("pnpm exec tsx src/db/migrate.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
    await seedContent();
    void getTestPool();
  }, 120_000);

  afterAll(async () => {
    // Restore published so later suites that only seed-once stay green.
    await db
      .update(grammarLessons)
      .set({ status: "published" })
      .where(eq(grammarLessons.status, "draft"));
    await db
      .update(readingPassages)
      .set({ status: "published" })
      .where(eq(readingPassages.status, "draft"));
    await db
      .update(quizzes)
      .set({ status: "published" })
      .where(eq(quizzes.status, "draft"));
    await closeTestPool();
  });

  it("draft grammar/reading/quiz are hidden from learner reads", async () => {
    const grammarSlug = "use-subject-verb-clauses";
    const readingSlug = "the-night-bus-to-da-lat";
    const quizSlug = "present-perfect-vs-past-simple";

    expect(await getLesson(grammarSlug)).not.toBeNull();
    expect(await getPassage(readingSlug)).not.toBeNull();
    expect(await getQuiz(quizSlug)).not.toBeNull();

    await db
      .update(grammarLessons)
      .set({ status: "draft" })
      .where(eq(grammarLessons.id, grammarSlug));
    await db
      .update(readingPassages)
      .set({ status: "draft" })
      .where(eq(readingPassages.id, readingSlug));
    await db
      .update(quizzes)
      .set({ status: "draft" })
      .where(eq(quizzes.id, quizSlug));

    expect(await getLesson(grammarSlug)).toBeNull();
    expect(await getPassage(readingSlug)).toBeNull();
    expect(await getQuiz(quizSlug)).toBeNull();

    await db
      .update(grammarLessons)
      .set({ status: "published" })
      .where(eq(grammarLessons.id, grammarSlug));
    await db
      .update(readingPassages)
      .set({ status: "published" })
      .where(eq(readingPassages.id, readingSlug));
    await db
      .update(quizzes)
      .set({ status: "published" })
      .where(eq(quizzes.id, quizSlug));
  });

  it("setContentStatus publish/unpublish writes audit and toggles learner visibility", async () => {
    const actorId = "admin-actor-1";
    await db.insert(user).values({
      id: actorId,
      name: "Admin Actor",
      email: "admin-actor@example.com",
      emailVerified: true,
      role: "admin",
    });

    const id = "use-subject-verb-clauses";
    await setContentStatus({
      actor: { id: actorId },
      kind: "grammar",
      id,
      status: "draft",
    });
    expect(await getLesson(id)).toBeNull();

    const [unpub] = await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.actorUserId, actorId));
    expect(unpub?.action).toBe("unpublish");
    expect(unpub?.entityType).toBe("grammar_lesson");

    await setContentStatus({
      actor: { id: actorId },
      kind: "grammar",
      id,
      status: "published",
    });
    expect(await getLesson(id)).not.toBeNull();

    const logs = await listAuditLog(10);
    expect(logs.some((l) => l.action === "publish" && l.entityId === id)).toBe(
      true,
    );
  });

  it("writeAuditLog persists actor + payload without throwing", async () => {
    const actorId = "admin-actor-2";
    await db.insert(user).values({
      id: actorId,
      name: "Auditor",
      email: "auditor@example.com",
      emailVerified: true,
      role: "admin",
    });
    await writeAuditLog(db, {
      actorUserId: actorId,
      action: "import",
      entityType: "content_file",
      entityId: "grammar.json",
      summary: "Imported grammar",
      payload: { count: 1 },
    });
    const rows = await listAuditLog(5);
    expect(rows[0]?.actorEmail).toBe("auditor@example.com");
    expect(rows[0]?.action).toBe("import");
  });
});
