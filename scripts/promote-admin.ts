/**
 * Promote (or demote) a user to admin.
 *
 *   pnpm db:promote-admin -- you@example.com
 *   pnpm db:promote-admin -- you@example.com --revoke
 *
 * Equivalent SQL:
 *   UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../src/db/schema";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const revoke = args.includes("--revoke");
  const email = (
    args.find((a) => !a.startsWith("--")) ?? process.env.SEED_ADMIN_EMAIL ?? ""
  )
    .trim()
    .toLowerCase();
  if (!email) throw new Error("Usage: pnpm db:promote-admin -- <email> [--revoke]");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });
  try {
    const role = revoke ? "user" : "admin";
    const rows = await db
      .update(schema.user)
      .set({ role, updatedAt: new Date() })
      .where(eq(schema.user.email, email))
      .returning({ id: schema.user.id });
    if (rows.length === 0) {
      throw new Error(`No user with email ${email} — sign up first`);
    }
    console.log(`[promote-admin] ${email} → role=${role}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[promote-admin] Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
