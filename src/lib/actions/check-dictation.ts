"use server";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { checkDictation } from "@/lib/data/listening";
import { checkDictationSchema } from "@/lib/schemas/learning-actions";
import type { CheckDictationResult } from "@/types/listening";

export async function checkDictationAction(
  slug: string,
  answers: Record<string, string>,
): Promise<CheckDictationResult | null> {
  try {
    const user = await getCurrentUser();
    await enforceRateLimit("learning", user?.id);
    const input = parseActionInput(checkDictationSchema, { slug, answers });
    return await checkDictation(input.slug, input.answers);
  } catch (err) {
    throwActionError(err);
  }
}
