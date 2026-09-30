import { z } from "zod";

import type { UpdateProfileInput } from "@/types/profile";

const cefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1"]);

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80),
    level: cefrLevel,
    timezone: z
      .string()
      .min(1)
      .refine(isValidTimeZone, "Invalid timezone"),
    goalText: z.string().trim().max(120).nullable().optional(),
  })
  .partial();

export function parseUpdateProfile(input: unknown): UpdateProfileInput {
  const parsed = updateProfileSchema.parse(input);
  return parsed as UpdateProfileInput;
}
