/**
 * Programmatic migrator for Docker entrypoint and `pnpm db:migrate`.
 * Does not import `server-only` modules so it can run in plain Node.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  const migrationsFolder = path.join(process.cwd(), "drizzle");
  console.log(`[migrate] Applying migrations from ${migrationsFolder}`);
  await migrate(db, { migrationsFolder });
  console.log("[migrate] Done");

  await pool.end();
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
