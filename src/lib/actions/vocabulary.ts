"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ActionError,
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireUser } from "@/lib/auth/session";
import {
  deleteWord,
  deleteWordSet,
  gradeReview,
  startWordSet,
  updateWord,
  updateWordSet,
  uploadWordImage,
  VocabularyError,
} from "@/lib/data/vocabulary";
import {
  deleteByIdSchema,
  gradeReviewSchema,
  startWordSetSchema,
  updateWordSchema,
  updateWordSetSchema,
} from "@/lib/schemas/vocabulary-actions";
import type {
  ReviewDue,
  UpdateWordInput,
  UpdateWordSetInput,
  Word,
  WordSet,
} from "@/types/vocabulary";

function revalidateVocab() {
  revalidatePath("/vocabulary", "layout");
  revalidatePath("/");
}

function mapVocabError(err: unknown): never {
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

export async function updateWordAction(
  input: UpdateWordInput,
): Promise<Word> {
  try {
    const user = await requireUser("/vocabulary");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(updateWordSchema, input);
    const word = await updateWord(parsed);
    revalidateVocab();
    return word;
  } catch (err) {
    mapVocabError(err);
  }
}

export async function deleteWordAction(id: string): Promise<void> {
  try {
    const user = await requireUser("/vocabulary");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(deleteByIdSchema, { id });
    await deleteWord(parsed.id);
    revalidateVocab();
  } catch (err) {
    mapVocabError(err);
  }
}

export async function updateWordSetAction(
  input: UpdateWordSetInput,
): Promise<WordSet> {
  try {
    const user = await requireUser("/vocabulary");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(updateWordSetSchema, input);
    const set = await updateWordSet(parsed);
    revalidateVocab();
    return set;
  } catch (err) {
    mapVocabError(err);
  }
}

export async function deleteWordSetAction(id: string): Promise<void> {
  try {
    const user = await requireUser("/vocabulary");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(deleteByIdSchema, { id });
    await deleteWordSet(parsed.id);
    revalidateVocab();
  } catch (err) {
    mapVocabError(err);
  }
}

export async function startWordSetAction(setId: string): Promise<number> {
  try {
    const user = await requireUser("/vocabulary");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(startWordSetSchema, { setId });
    const n = await startWordSet(parsed.setId);
    revalidateVocab();
    return n;
  } catch (err) {
    mapVocabError(err);
  }
}

export async function gradeReviewAction(
  cardId: string,
  grade: "still_learning" | "know_it",
): Promise<ReviewDue | null> {
  try {
    const user = await requireUser("/vocabulary");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(gradeReviewSchema, { cardId, grade });
    const next = await gradeReview(parsed.cardId, parsed.grade);
    revalidateVocab();
    return next;
  } catch (err) {
    mapVocabError(err);
  }
}

const uploadMetaSchema = z.object({
  contentType: z
    .string()
    .regex(/^image\/(jpeg|png|webp)$/, "Image must be JPEG, PNG, or WebP"),
  fileName: z.string().min(1).max(200),
  size: z.number().int().positive().max(2 * 1024 * 1024),
});

export async function uploadWordImageAction(
  formData: FormData,
): Promise<{ key: string; url: string }> {
  try {
    const user = await requireUser("/vocabulary/new");
    await enforceRateLimit("uploads", user.id);
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ActionError("Missing image file", { code: "VALIDATION" });
    }
    parseActionInput(uploadMetaSchema, {
      contentType: file.type || "application/octet-stream",
      fileName: file.name || "image",
      size: file.size,
    });
    const bytes = Buffer.from(await file.arrayBuffer());
    return await uploadWordImage({
      bytes,
      contentType: file.type || "application/octet-stream",
      fileName: file.name,
    });
  } catch (err) {
    mapVocabError(err);
  }
}
