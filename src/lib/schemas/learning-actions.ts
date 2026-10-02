import { z } from "zod";

export const checkDictationSchema = z.object({
  slug: z.string().min(1),
  answers: z.record(z.string(), z.string()),
});

export const checkReadingAnswersSchema = z.object({
  slug: z.string().min(1),
  answers: z.record(z.string(), z.number().nullable()),
});

export const submitQuizSchema = z.object({
  slug: z.string().min(1),
  answers: z.record(
    z.string(),
    z.union([z.number(), z.string(), z.null()]),
  ),
  timeUsedSeconds: z.number().nonnegative(),
  options: z
    .object({
      questionIds: z.array(z.string()).optional(),
      /** Client-generated UUID for idempotent double-submit. */
      clientAttemptId: z.string().uuid().optional(),
    })
    .optional(),
});

export const recordGrammarVisitSchema = z.object({
  slug: z.string().min(1),
});

export const setGrammarCompletedSchema = z.object({
  slug: z.string().min(1),
  completed: z.boolean(),
});
