import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const userSettings = pgTable(
  "user_settings",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    wordsPerDay: smallint("words_per_day").notNull().default(20),
    grammarPerDay: smallint("grammar_per_day").notNull().default(2),
    dailyReminder: boolean("daily_reminder").notNull().default(true),
    reminderTime: text("reminder_time").notNull().default("20:30"),
    reminderDays: text("reminder_days").array().notNull(),
    streakRescue: boolean("streak_rescue").notNull().default(true),
    interfaceLanguage: text("interface_language").notNull().default("en"),
    showVietnameseHints: boolean("show_vietnamese_hints")
      .notNull()
      .default(true),
    autoPlayPronunciation: boolean("auto_play_pronunciation")
      .notNull()
      .default(false),
    theme: text("theme").notNull().default("default"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "user_settings_words_per_day_check",
      sql`${t.wordsPerDay} in (10, 20, 30, 50)`,
    ),
    check(
      "user_settings_grammar_per_day_check",
      sql`${t.grammarPerDay} in (1, 2, 3)`,
    ),
    check(
      "user_settings_interface_language_check",
      sql`${t.interfaceLanguage} in ('en', 'vi')`,
    ),
    check(
      "user_settings_theme_check",
      sql`${t.theme} in ('default', 'blossom')`,
    ),
  ],
);
