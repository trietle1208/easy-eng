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

export const readingPassages = pgTable(
  "reading_passages",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    level: text("level").notNull(),
    minutes: integer("minutes").notNull(),
    wordCount: integer("word_count").notNull().default(0),
    newWordCount: integer("new_word_count").notNull().default(0),
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
    index("reading_passages_topic_level_idx").on(t.topic, t.level),
    check("reading_passages_level_check", cefrCheck(t.level)),
    check(
      "reading_passages_status_check",
      sql`${t.status} in ('draft', 'published')`,
    ),
  ],
);

export const readingParagraphs = pgTable(
  "reading_paragraphs",
  {
    id: text("id").primaryKey(),
    passageId: text("passage_id")
      .notNull()
      .references(() => readingPassages.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    vi: text("vi").notNull(),
    segments: jsonb("segments")
      .notNull()
      .$type<
        (
          | { type: "text"; text: string }
          | { type: "vocab"; vocabId: string }
        )[]
      >(),
  },
  (t) => [unique("reading_paragraphs_passage_sort_uidx").on(t.passageId, t.sortOrder)],
);

export const readingVocabHighlights = pgTable(
  "reading_vocab_highlights",
  {
    id: text("id").primaryKey(),
    passageId: text("passage_id")
      .notNull()
      .references(() => readingPassages.id, { onDelete: "cascade" }),
    word: text("word").notNull(),
    ipa: text("ipa").notNull().default(""),
    partOfSpeech: text("part_of_speech").notNull(),
    meaningVi: text("meaning_vi").notNull(),
    level: text("level").notNull(),
  },
  (t) => [
    index("reading_vocab_highlights_passage_id_idx").on(t.passageId),
    check("reading_vocab_highlights_level_check", cefrCheck(t.level)),
  ],
);

export const readingQuestions = pgTable(
  "reading_questions",
  {
    id: text("id").primaryKey(),
    passageId: text("passage_id")
      .notNull()
      .references(() => readingPassages.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    prompt: text("prompt").notNull(),
    choices: jsonb("choices").notNull().$type<string[]>(),
    correctIndex: integer("correct_index").notNull(),
  },
  (t) => [unique("reading_questions_passage_sort_uidx").on(t.passageId, t.sortOrder)],
);

export const readingPassagesRelations = relations(
  readingPassages,
  ({ many }) => ({
    paragraphs: many(readingParagraphs),
    vocabulary: many(readingVocabHighlights),
    questions: many(readingQuestions),
  }),
);

export const readingParagraphsRelations = relations(
  readingParagraphs,
  ({ one }) => ({
    passage: one(readingPassages, {
      fields: [readingParagraphs.passageId],
      references: [readingPassages.id],
    }),
  }),
);

export const readingVocabHighlightsRelations = relations(
  readingVocabHighlights,
  ({ one }) => ({
    passage: one(readingPassages, {
      fields: [readingVocabHighlights.passageId],
      references: [readingPassages.id],
    }),
  }),
);

export const readingQuestionsRelations = relations(
  readingQuestions,
  ({ one }) => ({
    passage: one(readingPassages, {
      fields: [readingQuestions.passageId],
      references: [readingPassages.id],
    }),
  }),
);
