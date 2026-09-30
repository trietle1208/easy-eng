"use server";

import {
  enforceRateLimit,
  parseActionInput,
  throwActionError,
} from "@/lib/actions/_helpers";
import { requireUser } from "@/lib/auth/session";
import { updateSettings } from "@/lib/data/profile";
import { updateSettingsSchema } from "@/lib/schemas/update-settings";
import type { UpdateSettingsInput, UserSettings } from "@/types/profile";

export async function updateSettingsAction(
  input: UpdateSettingsInput,
): Promise<UserSettings> {
  try {
    const user = await requireUser("/profile");
    await enforceRateLimit("mutations", user.id);
    const parsed = parseActionInput(updateSettingsSchema, input);
    return await updateSettings(parsed);
  } catch (err) {
    throwActionError(err);
  }
}
