"use server";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireUser } from "@/lib/auth/session";
import { updateProfile } from "@/lib/data/profile";
import { updateProfileSchema } from "@/lib/schemas/update-profile";
import type { UpdateProfileInput, UserProfile } from "@/types/profile";

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<UserProfile> {
  try {
    const user = await requireUser("/profile");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(updateProfileSchema, input);
    return await updateProfile(parsed as UpdateProfileInput);
  } catch (err) {
    throwActionError(err);
  }
}
