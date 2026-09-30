import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { cefrCheck } from "./common";

export const wordSets = pgTable(
  "word_sets",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    titleVi: text("title_vi").notNull(),
    topic: text("topic").notNull(),
    level: text("level").notNull(),
    ownerId: text("owner_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    /** System sets (owner null): draft | published for catalog visibility */
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("word_sets_owner_id_idx").on(t.ownerId),
    index("word_sets_topic_level_idx").on(t.topic, t.level),
    check("word_sets_level_check", cefrCheck(t.level)),
    check("word_sets_status_check", sql`${t.status} in ('draft', 'published')`),
  ],
);

export const words = pgTable(
  "words",
  {
    id: text("id").primaryKey(),
    wordSetId: text("word_set_id")
      .notNull()
      .references(() => wordSets.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    word: text("word").notNull(),
    ipa: text("ipa").notNull().default(""),
    partOfSpeech: text("part_of_speech").notNull(),
    level: text("level").notNull(),
    meaningVi: text("meaning_vi").notNull(),
    definitionEn: text("definition_en").notNull().default(""),
    examples: jsonb("examples")
      .notNull()
      .$type<{ en: string; vi?: string }[]>(),
    collocations: jsonb("collocations").$type<string[] | null>(),
    notes: text("notes"),
    imagePath: text("image_path"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("words_word_set_id_idx").on(t.wordSetId),
    index("words_owner_created_idx").on(t.ownerId, t.createdAt),
    check("words_level_check", cefrCheck(t.level)),
  ],
);

export const userWordCards = pgTable(
  "user_word_cards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    wordId: text("word_id")
      .notNull()
      .references(() => words.id, { onDelete: "cascade" }),
    due: timestamp("due", { withTimezone: true }).notNull(),
    stability: real("stability").notNull().default(0),
    difficulty: real("difficulty").notNull().default(0),
    elapsedDays: integer("elapsed_days").notNull().default(0),
    scheduledDays: integer("scheduled_days").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    learningSteps: integer("learning_steps").notNull().default(0),
    state: smallint("state").notNull().default(0),
    lastReview: timestamp("last_review", { withTimezone: true }),
  },
  (t) => [
    unique("user_word_cards_user_word_uidx").on(t.userId, t.wordId),
    index("user_word_cards_user_due_idx").on(t.userId, t.due),
  ],
);

export const reviewLogs = pgTable(
  "review_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cardId: text("card_id")
      .notNull()
      .references(() => userWordCards.id, { onDelete: "cascade" }),
    rating: smallint("rating").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    elapsedDays: integer("elapsed_days").notNull(),
    review: timestamp("review", { withTimezone: true }).notNull(),
    state: smallint("state").notNull(),
  },
  (t) => [index("review_logs_user_review_idx").on(t.userId, t.review)],
);

export const wordSetsRelations = relations(wordSets, ({ one, many }) => ({
  owner: one(user, { fields: [wordSets.ownerId], references: [user.id] }),
  words: many(words),
}));

export const wordsRelations = relations(words, ({ one, many }) => ({
  wordSet: one(wordSets, {
    fields: [words.wordSetId],
    references: [wordSets.id],
  }),
  owner: one(user, { fields: [words.ownerId], references: [user.id] }),
  cards: many(userWordCards),
}));

export const userWordCardsRelations = relations(
  userWordCards,
  ({ one, many }) => ({
    user: one(user, {
      fields: [userWordCards.userId],
      references: [user.id],
    }),
    word: one(words, {
      fields: [userWordCards.wordId],
      references: [words.id],
    }),
    logs: many(reviewLogs),
  }),
);

export const reviewLogsRelations = relations(reviewLogs, ({ one }) => ({
  user: one(user, { fields: [reviewLogs.userId], references: [user.id] }),
  card: one(userWordCards, {
    fields: [reviewLogs.cardId],
    references: [userWordCards.id],
  }),
}));
