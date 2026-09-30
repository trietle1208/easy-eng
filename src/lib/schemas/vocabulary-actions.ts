import { z } from "zod";

import { newWordSchema } from "@/lib/schemas/new-word";

export const updateWordSchema = z.object({
  id: z.string().min(1),
  word: z.string().trim().min(1).optional(),
  ipa: z.string().optional(),
  partOfSpeech: z
    .enum(["noun", "verb", "adjective", "adverb", "phrase"])
    .optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
  meaningVi: z.string().trim().min(1).optional(),
  definitionEn: z.string().optional(),
  examples: z.array(z.string()).optional(),
  notes: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});

export const updateWordSetSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).optional(),
  titleVi: z.string().trim().min(1).optional(),
  topic: z
    .enum([
      "Daily life",
      "Work",
      "Travel",
      "Food",
      "Health",
      "School",
      "Technology",
      "Feelings",
    ])
    .optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
});

export const deleteByIdSchema = z.object({
  id: z.string().min(1),
});

export const startWordSetSchema = z.object({
  setId: z.string().min(1),
});

export const gradeReviewSchema = z.object({
  cardId: z.string().min(1),
  grade: z.enum(["still_learning", "know_it"]),
});

export { newWordSchema };
