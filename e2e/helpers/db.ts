import { createHash, randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";

function pool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required for e2e helpers");
  return new Pool({ connectionString: url });
}

/** Mark a just-signed-up user as verified (dev/console-mailer substitute). */
export async function verifyEmailInDb(email: string) {
  const p = pool();
  try {
    const res = await p.query(
      `UPDATE "user" SET email_verified = true, updated_at = NOW() WHERE email = $1 RETURNING id`,
      [email],
    );
    if (res.rowCount === 0) {
      throw new Error(`No user found for ${email}`);
    }
  } finally {
    await p.end();
  }
}

/**
 * Create a verified email/password user ready to sign in.
 * Used when UI sign-up is rate-limited or flaky under Playwright.
 */
export async function createVerifiedUser(input: {
  email: string;
  password: string;
  name: string;
  role?: "user" | "admin";
}) {
  const p = pool();
  const userId = randomUUID();
  const accountId = randomUUID();
  const hashed = await hashPassword(input.password);
  const role = input.role ?? "user";
  try {
    await p.query("BEGIN");
    await p.query(
      `INSERT INTO "user" (id, name, email, email_verified, cefr_level, timezone, role, created_at, updated_at)
       VALUES ($1, $2, $3, true, 'A1', 'Asia/Ho_Chi_Minh', $4, NOW(), NOW())`,
      [userId, input.name, input.email, role],
    );
    await p.query(
      `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
      [accountId, userId, userId, hashed],
    );
    await p.query(
      `INSERT INTO user_settings (
         user_id, words_per_day, grammar_per_day, daily_reminder, reminder_time,
         reminder_days, streak_rescue, interface_language, show_vietnamese_hints,
         auto_play_pronunciation, theme, updated_at
       ) VALUES (
         $1, 20, 2, true, '20:30',
         ARRAY['mon','tue','wed','thu','fri','sun']::text[], true, 'en', true,
         false, 'default', NOW()
       )`,
      [userId],
    );
    await p.query("COMMIT");
    return { id: userId, email: input.email, password: input.password };
  } catch (err) {
    await p.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await p.end();
  }
}

/** Stable hash helper (unused externally — kept for future fixtures). */
export function shortId(seed: string) {
  return createHash("sha1").update(seed).digest("hex").slice(0, 8);
}
