import { relations, sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const userLessonProgress = pgTable(
  "user_lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    contentKind: text("content_kind").notNull(),
    contentId: text("content_id").notNull(),
    status: text("status").notNull(),
    progressPercent: integer("progress_percent").notNull().default(0),
    lastPosition: jsonb("last_position").$type<Record<string, unknown> | null>(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("user_lesson_progress_user_kind_id_uidx").on(
      t.userId,
      t.contentKind,
      t.contentId,
    ),
    index("user_lesson_progress_user_updated_idx").on(t.userId, t.updatedAt),
    check(
      "user_lesson_progress_kind_check",
      sql`${t.contentKind} in ('grammar', 'reading', 'listening', 'vocabulary_set')`,
    ),
    check(
      "user_lesson_progress_status_check",
      sql`${t.status} in ('not_started', 'in_progress', 'completed')`,
    ),
    check(
      "user_lesson_progress_percent_check",
      sql`${t.progressPercent} >= 0 and ${t.progressPercent} <= 100`,
    ),
  ],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    localDate: date("local_date").notNull(),
    kind: text("kind").notNull(),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
  },
  (t) => [
    index("activity_events_user_local_date_idx").on(t.userId, t.localDate),
    index("activity_events_user_occurred_idx").on(t.userId, t.occurredAt),
    check(
      "activity_events_kind_check",
      sql`${t.kind} in ('study_session', 'word_added', 'grammar_done', 'reading_done', 'listening_done', 'quiz_done', 'review_done')`,
    ),
  ],
);

export const userLessonProgressRelations = relations(
  userLessonProgress,
  ({ one }) => ({
    user: one(user, {
      fields: [userLessonProgress.userId],
      references: [user.id],
    }),
  }),
);

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  user: one(user, {
    fields: [activityEvents.userId],
    references: [user.id],
  }),
}));
