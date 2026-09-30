"use server";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireUser } from "@/lib/auth/session";
import { recordStudySession } from "@/lib/data/profile";
import { recordStudySessionSchema } from "@/lib/schemas/study-session";

export async function recordStudySessionAction(input: {
  durationSeconds: number;
  mode: "study" | "pomodoro";
}): Promise<{ recorded: boolean }> {
  try {
    const user = await requireUser("/");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(recordStudySessionSchema, input);
    return await recordStudySession(parsed);
  } catch (err) {
    throwActionError(err);
  }
}
