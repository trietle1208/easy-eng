"use server";

import { revalidatePath } from "next/cache";

import {
  ActionError,
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireUser } from "@/lib/auth/session";
import { createWord, VocabularyError } from "@/lib/data/vocabulary";
import { newWordSchema } from "@/lib/schemas/new-word";
import type { NewWordInput, Word } from "@/types/vocabulary";

export async function createWordAction(input: NewWordInput): Promise<Word> {
  try {
    const user = await requireUser("/vocabulary/new");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(newWordSchema, {
      word: input.word,
      ipa: input.ipa ?? "",
      partOfSpeech: input.partOfSpeech,
      level: input.level,
      meaningVi: input.meaningVi,
      definitionEn: input.definitionEn ?? "",
      examples: input.examples ?? [],
      wordSetId: input.wordSetId ?? "",
      newWordSetTitle: input.newWordSetTitle ?? "",
      notes: input.notes ?? "",
      imageUrl: input.imageUrl ?? "",
    });

    const word = await createWord({
      word: parsed.word,
      ipa: parsed.ipa || undefined,
      partOfSpeech: parsed.partOfSpeech,
      level: parsed.level,
      meaningVi: parsed.meaningVi,
      definitionEn: parsed.definitionEn || undefined,
      examples: parsed.examples,
      wordSetId: parsed.wordSetId || undefined,
      newWordSetTitle: parsed.newWordSetTitle || undefined,
      notes: parsed.notes || undefined,
      imageUrl: parsed.imageUrl || undefined,
    });
    revalidatePath("/vocabulary", "layout");
    revalidatePath("/");
    return word;
  } catch (err) {
    if (err instanceof VocabularyError) {
      throwActionError(
        new ActionError(err.message, {
          code:
            err.code === "DUPLICATE" || err.code === "VALIDATION"
              ? "VALIDATION"
              : err.code === "FORBIDDEN"
                ? "FORBIDDEN"
                : err.code === "NOT_FOUND"
                  ? "NOT_FOUND"
                  : "GENERAL",
        }),
      );
    }
    throwActionError(err);
  }
}
