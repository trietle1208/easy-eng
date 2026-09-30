import { z } from "zod";

import type { UpdateSettingsInput } from "@/types/profile";

const weekdayKey = z.enum([
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

export const updateSettingsSchema = z
  .object({
    wordsPerDay: z.union([
      z.literal(10),
      z.literal(20),
      z.literal(30),
      z.literal(50),
    ]),
    grammarPerDay: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    dailyReminder: z.boolean(),
    reminderTime: z.string().regex(/^\d{2}:\d{2}$/),
    reminderDays: z.array(weekdayKey),
    streakRescue: z.boolean(),
    interfaceLanguage: z.enum(["en", "vi"]),
    showVietnameseHints: z.boolean(),
    autoPlayPronunciation: z.boolean(),
    theme: z.enum(["default", "blossom"]),
  })
  .partial();

export type UpdateSettingsSchemaInput = z.infer<typeof updateSettingsSchema>;

export function parseUpdateSettings(
  input: unknown,
): UpdateSettingsInput {
  return updateSettingsSchema.parse(input);
}
