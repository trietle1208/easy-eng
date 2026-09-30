"use server";

import { revalidatePath } from "next/cache";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { checkReadingAnswers } from "@/lib/data/reading";
import { checkReadingAnswersSchema } from "@/lib/schemas/learning-actions";
import type { CheckReadingAnswersResult } from "@/types/reading";

export async function checkReadingAnswersAction(
  slug: string,
  answers: Record<string, number | null>,
): Promise<CheckReadingAnswersResult | null> {
  try {
    const user = await getCurrentUser();
    await enforceRateLimit("learning", user?.id);
    const input = parseActionInput(checkReadingAnswersSchema, { slug, answers });
    const result = await checkReadingAnswers(input.slug, input.answers);
    if (result?.progressSaved) {
      revalidatePath("/reading", "layout");
      revalidatePath(`/reading/${input.slug}`);
    }
    return result;
  } catch (err) {
    throwActionError(err);
  }
}
