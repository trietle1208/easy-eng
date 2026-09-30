"use server";

import { revalidatePath } from "next/cache";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { submitQuiz } from "@/lib/data/quiz";
import { submitQuizSchema } from "@/lib/schemas/learning-actions";
import type { QuizAnswersMap, QuizResult } from "@/types/quiz";

export async function submitQuizAction(
  slug: string,
  answers: QuizAnswersMap,
  timeUsedSeconds: number,
  options?: { questionIds?: string[]; clientAttemptId?: string },
): Promise<QuizResult | null> {
  try {
    const user = await getCurrentUser();
    await enforceRateLimit("learning", user?.id);
    const input = parseActionInput(submitQuizSchema, {
      slug,
      answers,
      timeUsedSeconds,
      options,
    });
    const result = await submitQuiz(
      input.slug,
      input.answers as QuizAnswersMap,
      input.timeUsedSeconds,
      input.options,
    );
    if (result?.progressSaved) {
      revalidatePath(`/quiz/${input.slug}`);
      revalidatePath("/grammar", "layout");
      revalidatePath("/");
    }
    return result;
  } catch (err) {
    throwActionError(err);
  }
}
