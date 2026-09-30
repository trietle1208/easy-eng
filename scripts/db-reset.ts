/**
 * Dev-only: drop and recreate the database, then run migrations.
 * Requires DATABASE_URL pointing at a non-production database.
 */
import { execSync } from "node:child_process";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("db:reset refuses to run with NODE_ENV=production");
  }

  const parsed = new URL(url);
  const dbName = parsed.pathname.replace(/^\//, "");
  if (!dbName || dbName === "postgres") {
    throw new Error("Refusing to reset the postgres maintenance database");
  }

  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";

  const pool = new Pool({ connectionString: adminUrl.toString() });
  const client = await pool.connect();
  try {
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName],
    );
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`[db:reset] Recreated database ${dbName}`);
  } finally {
    client.release();
    await pool.end();
  }

  execSync("pnpm db:migrate", { stdio: "inherit", env: process.env });
}

main().catch((err) => {
  console.error("[db:reset] Failed:", err);
  process.exit(1);
});
