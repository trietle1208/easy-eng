import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { cefrCheck } from "./common";

export const grammarFamilies = pgTable("grammar_families", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const grammarGroups = pgTable(
  "grammar_groups",
  {
    id: text("id").primaryKey(),
    familyId: text("family_id")
      .notNull()
      .references(() => grammarFamilies.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("grammar_groups_family_id_idx").on(t.familyId)],
);

export const grammarLessons = pgTable(
  "grammar_lessons",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    level: text("level").notNull(),
    familyId: text("family_id")
      .notNull()
      .references(() => grammarFamilies.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => grammarGroups.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    readMinutes: integer("read_minutes").notNull().default(4),
    introEn: text("intro_en").notNull(),
    introVi: text("intro_vi").notNull(),
    useWhenEn: text("use_when_en").notNull(),
    useWhenVi: text("use_when_vi").notNull(),
    structure: jsonb("structure").notNull().$type<
      { formula: string; explanation: string }[]
    >(),
    examples: jsonb("examples").notNull().$type<
      { sentence: string; explanation: string }[]
    >(),
    mistakes: jsonb("mistakes").notNull().$type<
      {
        before: string;
        wrong: string;
        after: string;
        correct: string;
        noteEn: string;
        noteVi: string;
        missing?: boolean;
      }[]
    >(),
    /** Soft reference to quizzes.slug — not a hard FK (stubs may point ahead). */
    practiceQuizSlug: text("practice_quiz_slug"),
    practiceQuestionCount: integer("practice_question_count").notNull().default(10),
    practiceMinutes: integer("practice_minutes").notNull().default(5),
    /** draft | published — learners only see published */
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
    index("grammar_lessons_group_sort_idx").on(t.groupId, t.sortOrder),
    index("grammar_lessons_level_idx").on(t.level),
    check("grammar_lessons_level_check", cefrCheck(t.level)),
    check(
      "grammar_lessons_status_check",
      sql`${t.status} in ('draft', 'published')`,
    ),
  ],
);

export const grammarFamiliesRelations = relations(
  grammarFamilies,
  ({ many }) => ({
    groups: many(grammarGroups),
    lessons: many(grammarLessons),
  }),
);

export const grammarGroupsRelations = relations(grammarGroups, ({ one, many }) => ({
  family: one(grammarFamilies, {
    fields: [grammarGroups.familyId],
    references: [grammarFamilies.id],
  }),
  lessons: many(grammarLessons),
}));

export const grammarLessonsRelations = relations(grammarLessons, ({ one }) => ({
  family: one(grammarFamilies, {
    fields: [grammarLessons.familyId],
    references: [grammarFamilies.id],
  }),
  group: one(grammarGroups, {
    fields: [grammarLessons.groupId],
    references: [grammarGroups.id],
  }),
}));
