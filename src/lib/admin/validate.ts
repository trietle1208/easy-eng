/**
 * Admin validation = the same Zod schemas as `content/` (seed + import/export)
 * plus a few cross-field checks that would otherwise produce broken learner UI.
 * Client-safe (no server-only imports) so forms can reuse the types.
 */
import { z } from "zod";

import {
  grammarContentSchema,
  listeningContentSchema,
  quizContentSchema,
  readingContentSchema,
  vocabularyContentSchema,
} from "../../../content/schema";

export const CONTENT_KINDS = [
  "grammar",
  "reading",
  "listening",
  "quiz",
  "vocabulary",
] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export function isContentKind(v: string): v is ContentKind {
  return (CONTENT_KINDS as readonly string[]).includes(v);
}

export const KIND_LABELS: Record<ContentKind, string> = {
  grammar: "Grammar lessons",
  reading: "Reading passages",
  listening: "Listening lessons",
  quiz: "Quizzes",
  vocabulary: "Word sets",
};

export const grammarFamilySchema = grammarContentSchema.shape.families.element;
export const grammarGroupSchema = grammarContentSchema.shape.groups.element;

const grammarLessonBase = grammarContentSchema.shape.lessons.element;
const readingPassageBase = readingContentSchema.shape.passages.element;
const listeningLessonBase = listeningContentSchema.shape.lessons.element;
const quizBase = quizContentSchema.shape.quizzes.element;
const wordSetBase = vocabularyContentSchema.shape.sets.element;
const wordBase = vocabularyContentSchema.shape.words.element;

export type GrammarLessonEntity = z.infer<typeof grammarLessonBase>;
export type ReadingPassageEntity = z.infer<typeof readingPassageBase>;
export type ListeningLessonEntity = z.infer<typeof listeningLessonBase>;
export type QuizEntity = z.infer<typeof quizBase>;
export type WordSetEntity = z.infer<typeof wordSetBase>;
export type WordEntity = z.infer<typeof wordBase>;
export type WordSetBundle = { set: WordSetEntity; words: WordEntity[] };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const slugField = z
  .string()
  .regex(SLUG_RE, "Use lowercase letters, digits and dashes only");

function uniqueIds(
  ctx: z.RefinementCtx,
  path: (string | number)[],
  ids: string[],
) {
  const seen = new Set<string>();
  ids.forEach((id, i) => {
    if (seen.has(id)) {
      ctx.addIssue({
        code: "custom",
        path: [...path, i, "id"],
        message: `Duplicate id "${id}"`,
      });
    }
    seen.add(id);
  });
}

function uniqueSorts(
  ctx: z.RefinementCtx,
  path: (string | number)[],
  sorts: number[],
) {
  const seen = new Set<number>();
  sorts.forEach((s, i) => {
    if (seen.has(s)) {
      ctx.addIssue({
        code: "custom",
        path: [...path, i, "sortOrder"],
        message: `Duplicate sortOrder ${s}`,
      });
    }
    seen.add(s);
  });
}

export const grammarLessonSchema = grammarLessonBase.extend({
  slug: slugField,
});

export const readingPassageSchema = readingPassageBase
  .extend({ slug: slugField })
  .superRefine((p, ctx) => {
    uniqueIds(ctx, ["paragraphs"], p.paragraphs.map((x) => x.id));
    uniqueIds(ctx, ["vocabulary"], p.vocabulary.map((x) => x.id));
    uniqueIds(ctx, ["questions"], p.questions.map((x) => x.id));
    uniqueSorts(ctx, ["paragraphs"], p.paragraphs.map((x) => x.sortOrder));
    uniqueSorts(ctx, ["questions"], p.questions.map((x) => x.sortOrder));
    const vocabIds = new Set(p.vocabulary.map((v) => v.id));
    p.paragraphs.forEach((para, pi) => {
      para.segments.forEach((seg, si) => {
        if (seg.type === "vocab" && !vocabIds.has(seg.vocabId)) {
          ctx.addIssue({
            code: "custom",
            path: ["paragraphs", pi, "segments", si, "vocabId"],
            message: `Unknown vocab id "${seg.vocabId}"`,
          });
        }
      });
    });
    p.questions.forEach((q, i) => {
      if (q.correctIndex >= q.choices.length) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", i, "correctIndex"],
          message: "correctIndex is out of range of choices",
        });
      }
    });
  });

export const listeningLessonSchema = listeningLessonBase
  .extend({ slug: slugField })
  .superRefine((l, ctx) => {
    uniqueIds(ctx, ["transcript"], l.transcript.map((x) => x.id));
    uniqueIds(ctx, ["blanks"], l.blanks.map((x) => x.id));
    uniqueSorts(ctx, ["transcript"], l.transcript.map((x) => x.sortOrder));
    uniqueSorts(ctx, ["blanks"], l.blanks.map((x) => x.sortOrder));
    l.transcript.forEach((s, i) => {
      if (s.endMs < s.startMs) {
        ctx.addIssue({
          code: "custom",
          path: ["transcript", i, "endMs"],
          message: "endMs must be ≥ startMs",
        });
      }
    });
  });

const mcPayload = z.looseObject({
  stemBefore: z.string(),
  stemAfter: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().nonnegative(),
});
const fillPayload = z.looseObject({
  stemBefore: z.string(),
  stemAfter: z.string(),
  verbHint: z.string().optional(),
  wordBank: z.array(z.string()).optional(),
  correctAnswers: z.array(z.string()).min(1),
  displayAnswer: z.string(),
});
const sentencePayload = z.looseObject({
  promptEn: z.string(),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().nonnegative(),
});

export const quizSchema = quizBase
  .extend({ slug: slugField })
  .superRefine((q, ctx) => {
    uniqueIds(ctx, ["questions"], q.questions.map((x) => x.id));
    uniqueSorts(ctx, ["questions"], q.questions.map((x) => x.sortOrder));
    q.questions.forEach((question, i) => {
      const schema =
        question.type === "multiple_choice"
          ? mcPayload
          : question.type === "fill_blank"
            ? fillPayload
            : sentencePayload;
      const res = schema.safeParse(question.payload);
      if (!res.success) {
        for (const issue of res.error.issues) {
          ctx.addIssue({
            code: "custom",
            path: ["questions", i, "payload", ...issue.path],
            message: issue.message,
          });
        }
        return;
      }
      const p = question.payload as { options?: string[]; correctIndex?: number };
      if (
        question.type !== "fill_blank" &&
        p.options &&
        typeof p.correctIndex === "number" &&
        p.correctIndex >= p.options.length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", i, "payload", "correctIndex"],
          message: "correctIndex is out of range of options",
        });
      }
    });
  });

export const wordSetSchema = wordSetBase.extend({ id: slugField });

export const wordSetBundleSchema = z
  .object({
    set: wordSetSchema,
    words: z.array(wordBase),
  })
  .superRefine((b, ctx) => {
    uniqueIds(ctx, ["words"], b.words.map((w) => w.id));
    b.words.forEach((w, i) => {
      if (w.wordSetId !== b.set.id) {
        ctx.addIssue({
          code: "custom",
          path: ["words", i, "wordSetId"],
          message: "wordSetId must match the set id",
        });
      }
    });
  });

/* ── Whole-file (import/export) schemas — identical to `content/` ── */

export const CONTENT_FILE_SCHEMAS = {
  grammar: grammarContentSchema,
  reading: readingContentSchema,
  listening: listeningContentSchema,
  quiz: quizContentSchema,
  vocabulary: vocabularyContentSchema,
} as const;

/** Cross-field checks applied to each entity inside an imported file. */
export function validateImportedEntities(
  kind: ContentKind,
  data: unknown,
): z.ZodError | null {
  const issues: z.core.$ZodIssue[] = [];
  const push = (err: z.ZodError, prefix: (string | number)[]) => {
    for (const i of err.issues) {
      issues.push({ ...i, path: [...prefix, ...i.path] } as z.core.$ZodIssue);
    }
  };

  if (kind === "grammar") {
    const d = data as z.infer<typeof grammarContentSchema>;
    d.lessons.forEach((l, i) => {
      const r = grammarLessonSchema.safeParse(l);
      if (!r.success) push(r.error, ["lessons", i]);
    });
  } else if (kind === "reading") {
    const d = data as z.infer<typeof readingContentSchema>;
    d.passages.forEach((p, i) => {
      const r = readingPassageSchema.safeParse(p);
      if (!r.success) push(r.error, ["passages", i]);
    });
  } else if (kind === "listening") {
    const d = data as z.infer<typeof listeningContentSchema>;
    d.lessons.forEach((l, i) => {
      const r = listeningLessonSchema.safeParse(l);
      if (!r.success) push(r.error, ["lessons", i]);
    });
  } else if (kind === "quiz") {
    const d = data as z.infer<typeof quizContentSchema>;
    d.quizzes.forEach((q, i) => {
      const r = quizSchema.safeParse(q);
      if (!r.success) push(r.error, ["quizzes", i]);
    });
  } else {
    const d = data as z.infer<typeof vocabularyContentSchema>;
    const setIds = new Set(d.sets.map((s) => s.id));
    d.sets.forEach((s, i) => {
      const r = wordSetSchema.safeParse(s);
      if (!r.success) push(r.error, ["sets", i]);
    });
    d.words.forEach((w, i) => {
      if (!setIds.has(w.wordSetId)) {
        issues.push({
          code: "custom",
          path: ["words", i, "wordSetId"],
          message: `Unknown word set "${w.wordSetId}"`,
          input: w.wordSetId,
        } as z.core.$ZodIssue);
      }
    });
  }

  return issues.length ? new z.ZodError(issues) : null;
}

/**
 * Extra completeness rules before content becomes learner-visible
 * (empty lists would render broken lesson pages).
 */
export function publishBlockers(kind: ContentKind, entity: unknown): string[] {
  const out: string[] = [];
  if (kind === "grammar") {
    const e = entity as GrammarLessonEntity;
    if (e.structure.length === 0) out.push("add at least one structure item");
    if (e.examples.length === 0) out.push("add at least one example");
  } else if (kind === "reading") {
    const e = entity as ReadingPassageEntity;
    if (e.paragraphs.length === 0) out.push("add at least one paragraph");
    if (e.questions.length === 0) out.push("add at least one question");
  } else if (kind === "listening") {
    const e = entity as ListeningLessonEntity;
    if (e.transcript.length === 0) out.push("add at least one transcript line");
    if (e.blanks.length === 0) out.push("add at least one dictation blank");
    if (!e.audioPath) out.push("set an audio file");
  } else if (kind === "quiz") {
    const e = entity as QuizEntity;
    if (e.questions.length === 0) out.push("add at least one question");
    if (e.passScore > e.questions.length) {
      out.push("passScore is higher than the number of questions");
    }
  } else {
    const b = entity as WordSetBundle;
    if (b.words.length === 0) out.push("add at least one word");
  }
  return out;
}
