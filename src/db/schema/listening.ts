import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { cefrCheck } from "./common";

export const listeningLessons = pgTable(
  "listening_lessons",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    level: text("level").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    audioPath: text("audio_path").notNull(),
    speakers: integer("speakers").notNull().default(2),
    accent: text("accent").notNull().default(""),
    familyLabel: text("family_label").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("listening_lessons_topic_level_idx").on(t.topic, t.level),
    check("listening_lessons_level_check", cefrCheck(t.level)),
    check(
      "listening_lessons_status_check",
      sql`${t.status} in ('draft', 'published')`,
    ),
  ],
);

export const listeningTranscriptSentences = pgTable(
  "listening_transcript_sentences",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => listeningLessons.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    speaker: text("speaker").notNull(),
    text: text("text").notNull(),
    startMs: integer("start_ms").notNull().default(0),
    endMs: integer("end_ms").notNull().default(0),
  },
  (t) => [
    unique("listening_transcript_lesson_sort_uidx").on(t.lessonId, t.sortOrder),
  ],
);

export const listeningDictationBlanks = pgTable(
  "listening_dictation_blanks",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => listeningLessons.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    promptBefore: text("prompt_before").notNull(),
    promptAfter: text("prompt_after").notNull(),
    answer: text("answer").notNull(),
    accept: jsonb("accept").$type<string[] | null>(),
  },
  (t) => [
    unique("listening_dictation_lesson_sort_uidx").on(t.lessonId, t.sortOrder),
  ],
);

export const listeningLessonsRelations = relations(
  listeningLessons,
  ({ many }) => ({
    transcript: many(listeningTranscriptSentences),
    blanks: many(listeningDictationBlanks),
  }),
);

export const listeningTranscriptSentencesRelations = relations(
  listeningTranscriptSentences,
  ({ one }) => ({
    lesson: one(listeningLessons, {
      fields: [listeningTranscriptSentences.lessonId],
      references: [listeningLessons.id],
    }),
  }),
);

export const listeningDictationBlanksRelations = relations(
  listeningDictationBlanks,
  ({ one }) => ({
    lesson: one(listeningLessons, {
      fields: [listeningDictationBlanks.lessonId],
      references: [listeningLessons.id],
    }),
  }),
);
