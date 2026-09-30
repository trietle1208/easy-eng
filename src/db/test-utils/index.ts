import { Pool, type PoolClient } from "pg";

function testDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
  if (!url) {
    throw new Error(
      "DATABASE_URL_TEST (or DATABASE_URL) is required for tests",
    );
  }
  return url;
}

let pool: Pool | null = null;
let ensured = false;

async function ensureTestDatabaseExists(): Promise<void> {
  if (ensured) return;
  const url = testDatabaseUrl();
  const parsed = new URL(url);
  const dbName = parsed.pathname.replace(/^\//, "");
  if (!dbName) {
    throw new Error("DATABASE_URL_TEST must include a database name");
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new Pool({ connectionString: adminUrl.toString() });
  try {
    const exists = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await admin.end();
  }
  ensured = true;
}

export function getTestPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: testDatabaseUrl() });
  }
  return pool;
}

const APP_TABLES = [
  "admin_audit_log",
  "user_achievements",
  "achievement_definitions",
  "activity_events",
  "user_lesson_progress",
  "review_logs",
  "user_word_cards",
  "words",
  "word_sets",
  "quiz_attempts",
  "quiz_questions",
  "quizzes",
  "listening_dictation_blanks",
  "listening_transcript_sentences",
  "listening_lessons",
  "reading_questions",
  "reading_vocab_highlights",
  "reading_paragraphs",
  "reading_passages",
  "grammar_lessons",
  "grammar_groups",
  "grammar_families",
  "user_settings",
  "session",
  "account",
  "verification",
  "user",
] as const;

const TRUNCATE_SQL = `TRUNCATE TABLE ${APP_TABLES.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE`;

/**
 * Truncate all app tables between tests that need a clean slate.
 * Uses the app Drizzle pool (same connections as `db`) and retries on
 * deadlock — a second pg Pool racing TRUNCATE against idle `db` clients
 * previously caused flaky 40P01 failures in admin suites.
 */
export async function resetTestDatabase(): Promise<void> {
  await ensureTestDatabaseExists();
  const { pool: appPool } = await import("@/db");

  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    const client = await appPool.connect();
    try {
      // Clear stuck transactions that otherwise deadlock TRUNCATE.
      // Do not kill `active` backends — that races with the seed subprocess.
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid <> pg_backend_pid()
          AND backend_type = 'client backend'
          AND state = 'idle in transaction'
      `);
      await client.query(TRUNCATE_SQL);
      return;
    } catch (err) {
      lastErr = err;
      const msg = (err as Error).message ?? "";
      const code = (err as { code?: string }).code;
      // Tables may not exist yet (pre-migration); ignore.
      if (msg.includes("does not exist")) return;
      if (
        code === "40P01" ||
        code === "57P01" ||
        msg.includes("deadlock") ||
        msg.includes("terminat")
      ) {
        await new Promise((r) => setTimeout(r, 40 * (attempt + 1)));
        continue;
      }
      throw err;
    } finally {
      client.release();
    }
  }
  throw lastErr;
}

/** Run content seed and retry if a concurrent truncate emptied the tables. */
export async function seedTestContent(): Promise<void> {
  const { execSync } = await import("node:child_process");
  const testUrl =
    process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? "";
  const { pool: appPool } = await import("@/db");

  for (let attempt = 0; attempt < 3; attempt++) {
    execSync("pnpm exec tsx scripts/seed.ts --content", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
    const client = await appPool.connect();
    try {
      const res = await client.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM grammar_lessons`,
      );
      if (Number(res.rows[0]?.n ?? 0) > 0) return;
    } finally {
      client.release();
    }
  }
  throw new Error("seedTestContent: grammar_lessons still empty after retries");
}

export async function withTestClient<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  await ensureTestDatabaseExists();
  const client = await getTestPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export async function closeTestPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
