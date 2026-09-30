import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { userLessonProgress } from "@/db/schema";

export type ProgressKind = "grammar" | "reading" | "listening" | "vocabulary_set";

export type ProgressFlags = {
  completed: boolean;
  inProgress: boolean;
};

/** Load progress flags for a user + content kind, keyed by contentId (slug). */
export async function loadProgressFlags(
  userId: string,
  kind: ProgressKind,
  contentIds: string[],
): Promise<Map<string, ProgressFlags>> {
  const map = new Map<string, ProgressFlags>();
  if (contentIds.length === 0) return map;

  const rows = await db
    .select({
      contentId: userLessonProgress.contentId,
      status: userLessonProgress.status,
    })
    .from(userLessonProgress)
    .where(
      and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.contentKind, kind),
        inArray(userLessonProgress.contentId, contentIds),
      ),
    );

  for (const row of rows) {
    map.set(row.contentId, {
      completed: row.status === "completed",
      inProgress: row.status === "in_progress",
    });
  }
  return map;
}

export function flagsFor(
  map: Map<string, ProgressFlags>,
  contentId: string,
): ProgressFlags {
  return map.get(contentId) ?? { completed: false, inProgress: false };
}
