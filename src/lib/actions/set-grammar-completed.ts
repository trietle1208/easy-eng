"use server";

import { revalidatePath } from "next/cache";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { setGrammarCompleted } from "@/lib/data/grammar";
import { setGrammarCompletedSchema } from "@/lib/schemas/learning-actions";

/** Mark a grammar lesson completed / not completed for the signed-in user. */
export async function setGrammarCompletedAction(
  slug: string,
  completed: boolean,
): Promise<void> {
  try {
    const user = await getCurrentUser();
    await enforceRateLimit("mutations", user?.id);
    const input = parseActionInput(setGrammarCompletedSchema, {
      slug,
      completed,
    });
    await setGrammarCompleted(input.slug, input.completed);
    revalidatePath("/grammar", "layout");
    revalidatePath("/");
  } catch (err) {
    throwActionError(err);
  }
}
