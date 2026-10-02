import { z } from "zod";

import { PARTS_OF_SPEECH } from "@/types/vocabulary";

export const newWordSchema = z
  .object({
    word: z
      .string()
      .trim()
      .min(1, "Please add the word · Hãy nhập từ hoặc cụm từ"),
    ipa: z.string(),
    partOfSpeech: z.enum(PARTS_OF_SPEECH),
    level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
    meaningVi: z
      .string()
      .trim()
      .min(1, "Please add the meaning · Hãy nhập nghĩa tiếng Việt"),
    definitionEn: z.string(),
    examples: z.array(z.string()),
    wordSetId: z.string(),
    newWordSetTitle: z.string(),
    notes: z.string(),
    imageUrl: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.wordSetId && !data.newWordSetTitle.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["wordSetId"],
        message: "Pick a word set · Chọn bộ từ",
      });
    }
  });

export type NewWordFormValues = z.infer<typeof newWordSchema>;
