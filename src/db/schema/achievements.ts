import { relations } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const achievementDefinitions = pgTable("achievement_definitions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  subtitleTemplate: text("subtitle_template").notNull(),
  icon: text("icon").notNull(),
  shape: text("shape").notNull(),
  color: text("color").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  rule: jsonb("rule").notNull().$type<Record<string, unknown>>(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    achievementId: text("achievement_id")
      .notNull()
      .references(() => achievementDefinitions.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true }).notNull(),
    progress: jsonb("progress").$type<Record<string, unknown> | null>(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);

export const achievementDefinitionsRelations = relations(
  achievementDefinitions,
  ({ many }) => ({
    unlocked: many(userAchievements),
  }),
);

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(user, {
      fields: [userAchievements.userId],
      references: [user.id],
    }),
    definition: one(achievementDefinitions, {
      fields: [userAchievements.achievementId],
      references: [achievementDefinitions.id],
    }),
  }),
);
