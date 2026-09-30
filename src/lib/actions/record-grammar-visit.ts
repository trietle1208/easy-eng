"use server";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { recordGrammarVisit } from "@/lib/data/grammar";
import { recordGrammarVisitSchema } from "@/lib/schemas/learning-actions";

/** Best-effort: mark a grammar lesson in progress for the signed-in user. */
export async function recordGrammarVisitAction(slug: string): Promise<void> {
  try {
    const user = await getCurrentUser();
    await enforceRateLimit("mutations", user?.id);
    const input = parseActionInput(recordGrammarVisitSchema, { slug });
    await recordGrammarVisit(input.slug);
  } catch (err) {
    throwActionError(err);
  }
}
