import { z } from "zod";

export const recordStudySessionSchema = z.object({
  durationSeconds: z.number().int().min(60).max(60 * 60 * 4),
  mode: z.enum(["study", "pomodoro"]),
});

export type RecordStudySessionInput = z.infer<typeof recordStudySessionSchema>;

export function parseRecordStudySession(
  input: unknown,
): RecordStudySessionInput {
  return recordStudySessionSchema.parse(input);
}
