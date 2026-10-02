import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import * as schema from "@/db/schema";
import { closeTestPool, getTestPool } from "@/db/test-utils";
import { foldSearch } from "@/lib/fold-search";

describe("vocabulary schema phase 1", () => {
  const pool = getTestPool();
  const db = drizzle(pool, { schema });

  beforeAll(async () => {
    const { execSync } = await import("node:child_process");
    const testUrl =
      process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
    execSync("pnpm exec tsx src/db/migrate.ts", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
  }, 120_000);

  afterAll(async () => {
    await closeTestPool();
  });

  it("backfills source, review_status and sort_order on existing words", async () => {
    const { execSync } = await import("node:child_process");
    const testUrl =
      process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
    execSync("pnpm exec tsx scripts/seed.ts --content", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: "test" },
    });

    const rows = await db
      .select({
        source: schema.words.source,
        reviewStatus: schema.words.reviewStatus,
        sortOrder: schema.words.sortOrder,
      })
      .from(schema.words)
      .where(sql`${schema.words.ownerId} is null`);

    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) {
      expect(r.source).toBe("manual");
      expect(r.reviewStatus).toBe("human_reviewed");
      expect(r.sortOrder).toBeGreaterThanOrEqual(0);
    }
  }, 120_000);

  it("enforces unique system headword + part of speech", async () => {
    const [set] = await db
      .select({ id: schema.wordSets.id })
      .from(schema.wordSets)
      .where(sql`${schema.wordSets.ownerId} is null`)
      .limit(1);
    expect(set).toBeTruthy();

    const idA = `phase1-uniq-a-${Date.now()}`;
    const idB = `phase1-uniq-b-${Date.now()}`;
    await db.insert(schema.words).values({
      id: idA,
      wordSetId: set!.id,
      ownerId: null,
      word: "Phase1UniqWord",
      partOfSpeech: "noun",
      level: "A1",
      meaningVi: "từ thử",
      definitionEn: "a test word",
      examples: [{ en: "Use Phase1UniqWord once." }],
      source: "manual",
      reviewStatus: "human_reviewed",
      sortOrder: 99,
    });

    await expect(
      db.insert(schema.words).values({
        id: idB,
        wordSetId: set!.id,
        ownerId: null,
        word: "phase1uniqword",
        partOfSpeech: "noun",
        level: "A1",
        meaningVi: "trùng",
        definitionEn: "duplicate",
        examples: [{ en: "Duplicate Phase1UniqWord." }],
        source: "manual",
        reviewStatus: "human_reviewed",
        sortOrder: 100,
      }),
    ).rejects.toThrow();

    await db.delete(schema.words).where(eq(schema.words.id, idA));
  });

  it("foldSearch supports accent-insensitive word lookup", () => {
    expect(foldSearch("SÂN")).toBe("san");
    expect(foldSearch("đặt phòng").includes(foldSearch("dat"))).toBe(true);
  });
});
