import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { and, desc, eq, gt, sql } from "drizzle-orm";

import { db } from "@/db";
import { activityEvents, userLessonProgress } from "@/db/schema";
import type { ProgressKind } from "@/lib/data/progress-flags";
import { localDateString } from "@/lib/progress/dates";

export type ActivityKind =
  | "study_session"
  | "word_added"
  | "grammar_done"
  | "reading_done"
  | "listening_done"
  | "quiz_done"
  | "review_done";

export type ProgressStatus = "not_started" | "in_progress" | "completed";

const IDEMPOTENCY_WINDOW_MS = 5_000;

export function newEntityId(...parts: string[]): string {
  if (parts.length === 0) return randomUUID();
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
}

export { localDateString };

/**
 * Upsert lesson progress. Never downgrades `completed` → `in_progress`.
 */
export async function upsertLessonProgress(opts: {
  userId: string;
  contentKind: ProgressKind;
  contentId: string;
  status: Exclude<ProgressStatus, "not_started">;
  progressPercent: number;
  lastPosition?: Record<string, unknown> | null;
}): Promise<void> {
  const percent = Math.max(0, Math.min(100, Math.round(opts.progressPercent)));
  const id = newEntityId(
    "progress",
    opts.userId,
    opts.contentKind,
    opts.contentId,
  );

  const [existing] = await db
    .select({
      status: userLessonProgress.status,
      progressPercent: userLessonProgress.progressPercent,
    })
    .from(userLessonProgress)
    .where(
      and(
        eq(userLessonProgress.userId, opts.userId),
        eq(userLessonProgress.contentKind, opts.contentKind),
        eq(userLessonProgress.contentId, opts.contentId),
      ),
    )
    .limit(1);

  if (existing?.status === "completed" && opts.status === "in_progress") {
    await db
      .update(userLessonProgress)
      .set({
        lastPosition: opts.lastPosition ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userLessonProgress.userId, opts.userId),
          eq(userLessonProgress.contentKind, opts.contentKind),
          eq(userLessonProgress.contentId, opts.contentId),
        ),
      );
    return;
  }

  const nextPercent =
    existing?.status === "completed"
      ? Math.max(existing.progressPercent, percent)
      : percent;

  await db
    .insert(userLessonProgress)
    .values({
      id,
      userId: opts.userId,
      contentKind: opts.contentKind,
      contentId: opts.contentId,
      status: opts.status,
      progressPercent: nextPercent,
      lastPosition: opts.lastPosition ?? null,
    })
    .onConflictDoUpdate({
      target: [
        userLessonProgress.userId,
        userLessonProgress.contentKind,
        userLessonProgress.contentId,
      ],
      set: {
        status: opts.status,
        progressPercent: nextPercent,
        lastPosition: opts.lastPosition ?? null,
        updatedAt: new Date(),
      },
    });
}

/**
 * Insert an activity event. Skips insert when the same user/kind/ref
 * was written inside the idempotency window (double-submit guard).
 * Returns whether a new row was written.
 */
export async function recordActivityEvent(opts: {
  userId: string;
  timezone: string;
  kind: ActivityKind;
  durationSeconds?: number;
  /** Stable reference for dedupe, e.g. content slug */
  ref?: string;
  payload?: Record<string, unknown> | null;
}): Promise<boolean> {
  const now = new Date();
  const ref = opts.ref ?? null;
  const windowStart = new Date(now.getTime() - IDEMPOTENCY_WINDOW_MS);

  if (ref) {
    const [recent] = await db
      .select({ id: activityEvents.id })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.userId, opts.userId),
          eq(activityEvents.kind, opts.kind),
          gt(activityEvents.occurredAt, windowStart),
          sql`${activityEvents.payload}->>'ref' = ${ref}`,
        ),
      )
      .orderBy(desc(activityEvents.occurredAt))
      .limit(1);
    if (recent) return false;
  }

  await db.insert(activityEvents).values({
    id: newEntityId(),
    userId: opts.userId,
    occurredAt: now,
    localDate: localDateString(now, opts.timezone),
    kind: opts.kind,
    durationSeconds: Math.max(0, opts.durationSeconds ?? 0),
    payload: {
      ...(opts.payload ?? {}),
      ...(ref ? { ref } : {}),
    },
  });
  return true;
}

export { IDEMPOTENCY_WINDOW_MS };
