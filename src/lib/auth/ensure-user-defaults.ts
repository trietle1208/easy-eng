import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userSettings } from "@/db/schema";

const DEFAULT_REMINDER_DAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sun",
] as const;

/** Create `user_settings` with defaults if missing (idempotent). */
export async function ensureUserDefaults(userId: string): Promise<void> {
  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  if (existing) return;

  await db.insert(userSettings).values({
    userId,
    wordsPerDay: 20,
    grammarPerDay: 2,
    dailyReminder: true,
    reminderTime: "20:30",
    reminderDays: [...DEFAULT_REMINDER_DAYS],
    streakRescue: true,
    interfaceLanguage: "en",
    showVietnameseHints: true,
    autoPlayPronunciation: false,
    theme: "default",
  });
}
