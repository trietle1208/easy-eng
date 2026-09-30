import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  adminAuditLog,
  grammarLessons,
  user,
  wordSets,
} from "@/db/schema";
import {
  closeTestPool,
  getTestPool,
  resetTestDatabase,
  seedTestContent,
} from "@/db/test-utils";
import {
  deleteContent,
  exportContentFile,
  importContentFile,
  uploadListeningAudio,
} from "@/lib/admin/service";
import { CONTENT_KINDS, type ContentKind } from "@/lib/admin/validate";

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

const ACTOR = "admin-io-1";

describe("admin import / export", () => {
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
    await db.insert(user).values({
      id: ACTOR,
      name: "Admin IO",
      email: "admin-io@example.com",
      emailVerified: true,
      role: "admin",
    });
  }, 120_000);

  afterAll(async () => {
    await closeTestPool();
  });

  it("exported files re-import cleanly for every kind", async () => {
    for (const kind of CONTENT_KINDS as readonly ContentKind[]) {
      const exported = await exportContentFile(kind);
      const result = await importContentFile({
        actor: { id: ACTOR },
        kind,
        json: JSON.stringify(exported),
        status: "keep",
      });
      expect(result.kind).toBe(kind);
      expect(Object.values(result.counts).some((n) => n > 0)).toBe(true);
    }
    const audits = await db.select().from(adminAuditLog);
    expect(
      audits.filter(
        (a) => a.action === "import" && a.actorUserId === ACTOR,
      ),
    ).toHaveLength(CONTENT_KINDS.length);
  });

  it("import status: explicit draft applies to existing, keep leaves it alone", async () => {
    const grammar = (await exportContentFile("grammar")) as {
      lessons: { id: string }[];
    };
    const id = grammar.lessons[0]!.id;

    await importContentFile({
      actor: { id: ACTOR },
      kind: "grammar",
      json: JSON.stringify(grammar),
      status: "draft",
    });
    const [draft] = await db
      .select({ status: grammarLessons.status })
      .from(grammarLessons)
      .where(eq(grammarLessons.id, id));
    expect(draft?.status).toBe("draft");

    await importContentFile({
      actor: { id: ACTOR },
      kind: "grammar",
      json: JSON.stringify(grammar),
      status: "keep",
    });
    const [kept] = await db
      .select({ status: grammarLessons.status })
      .from(grammarLessons)
      .where(eq(grammarLessons.id, id));
    expect(kept?.status).toBe("draft");

    await importContentFile({
      actor: { id: ACTOR },
      kind: "grammar",
      json: JSON.stringify(grammar),
      status: "published",
    });
    const [pub] = await db
      .select({ status: grammarLessons.status })
      .from(grammarLessons)
      .where(eq(grammarLessons.id, id));
    expect(pub?.status).toBe("published");
  });

  it("invalid imports throw and write nothing", async () => {
    const before = await db.select().from(adminAuditLog);
    await expect(
      importContentFile({
        actor: { id: ACTOR },
        kind: "grammar",
        json: "{ not json",
        status: "keep",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      importContentFile({
        actor: { id: ACTOR },
        kind: "vocabulary",
        json: JSON.stringify({ sets: [{ id: "Bad Slug" }] }),
        status: "keep",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    const after = await db.select().from(adminAuditLog);
    expect(after).toHaveLength(before.length);
  });

  it("published content cannot be deleted; drafts can", async () => {
    const [set] = await db.select().from(wordSets).limit(1);
    const id = set!.id;
    await db
      .update(grammarLessons)
      .set({ status: "draft" })
      .where(eq(grammarLessons.id, "use-subject-verb-clauses"));

    await expect(
      deleteContent({ actor: { id: ACTOR }, kind: "vocabulary", id }),
    ).rejects.toBeTruthy();

    await deleteContent({
      actor: { id: ACTOR },
      kind: "grammar",
      id: "use-subject-verb-clauses",
    });
    const rows = await db
      .select()
      .from(grammarLessons)
      .where(eq(grammarLessons.id, "use-subject-verb-clauses"));
    expect(rows).toHaveLength(0);
  });

  it("audio upload rejects unsupported types and empty files", async () => {
    await expect(
      uploadListeningAudio({
        actor: { id: ACTOR },
        filename: "notes.txt",
        bytes: Buffer.from("x"),
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      uploadListeningAudio({
        actor: { id: ACTOR },
        filename: "empty.wav",
        bytes: Buffer.alloc(0),
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
