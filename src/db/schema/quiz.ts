import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { cefrCheck } from "./common";

export type QuizQuestionPayload = Record<string, unknown>;

export const quizzes = pgTable(
  "quizzes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    kickEn: text("kick_en").notNull(),
    kickVi: text("kick_vi").notNull(),
    breadcrumb: text("breadcrumb").notNull(),
    level: text("level").notNull(),
    descriptionEn: text("description_en").notNull(),
    descriptionVi: text("description_vi").notNull(),
    timeLimitSeconds: integer("time_limit_seconds").notNull(),
    passScore: integer("pass_score").notNull(),
    questionTypes: jsonb("question_types")
      .notNull()
      .$type<{ id: string; label: string }[]>(),
    lessonHref: text("lesson_href").notNull(),
    nextHref: text("next_href").notNull(),
    nextLabel: text("next_label").notNull(),
    encouragementEn: text("encouragement_en").notNull(),
    encouragementVi: text("encouragement_vi").notNull(),
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
    check("quizzes_level_check", cefrCheck(t.level)),
    check("quizzes_status_check", sql`${t.status} in ('draft', 'published')`),
  ],
);

export const quizQuestions = pgTable(
  "quiz_questions",
  {
    id: text("id").primaryKey(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull(),
    type: text("type").notNull(),
    instructionVi: text("instruction_vi").notNull(),
    promptVi: text("prompt_vi"),
    hintEn: text("hint_en"),
    explanationEn: text("explanation_en").notNull(),
    explanationVi: text("explanation_vi").notNull(),
    reviewBefore: text("review_before").notNull().default(""),
    reviewAfter: text("review_after").notNull().default(""),
    payload: jsonb("payload").notNull().$type<QuizQuestionPayload>(),
  },
  (t) => [
    unique("quiz_questions_quiz_sort_uidx").on(t.quizId, t.sortOrder),
    index("quiz_questions_type_idx").on(t.type),
    check(
      "quiz_questions_type_check",
      sql`${t.type} in ('multiple_choice', 'fill_blank', 'correct_sentence')`,
    ),
  ],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    passed: boolean("passed").notNull(),
    timeUsedSeconds: integer("time_used_seconds").notNull(),
    accuracy: real("accuracy").notNull(),
    answers: jsonb("answers").notNull().$type<Record<string, string>>(),
    rawAnswers: jsonb("raw_answers")
      .notNull()
      .$type<Record<string, number | string | null>>(),
    isFullRun: boolean("is_full_run").notNull().default(true),
    /** Client-generated id for idempotent double-submit; unique per user when set. */
    clientAttemptId: text("client_attempt_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("quiz_attempts_user_quiz_completed_idx").on(
      t.userId,
      t.quizId,
      t.completedAt,
    ),
    unique("quiz_attempts_user_client_attempt_uidx").on(
      t.userId,
      t.clientAttemptId,
    ),
  ],
);

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(user, { fields: [quizAttempts.userId], references: [user.id] }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));
