import { addDays, diffDays } from "@/lib/progress/dates";

export type QualifyingActivityKind =
  | "word_added"
  | "grammar_done"
  | "reading_done"
  | "listening_done"
  | "quiz_done"
  | "review_done"
  | "study_session";

/** Events that count toward a streak day (Phase 0 §1.5). */
export const STREAK_QUALIFYING_KINDS: ReadonlySet<string> = new Set<QualifyingActivityKind>([
  "word_added",
  "grammar_done",
  "reading_done",
  "listening_done",
  "quiz_done",
  "review_done",
  "study_session",
]);

/** Minimum study_session duration (seconds) to qualify a day. */
export const STUDY_SESSION_STREAK_MIN_SECONDS = 60;

export type ActivityEventLike = {
  localDate: string;
  kind: string;
  durationSeconds: number;
};

/**
 * Whether a single event qualifies for streak purposes.
 * Any `quiz_done` counts (full run or practice).
 */
export function eventQualifiesForStreak(event: ActivityEventLike): boolean {
  if (!STREAK_QUALIFYING_KINDS.has(event.kind)) return false;
  if (event.kind === "study_session") {
    return event.durationSeconds >= STUDY_SESSION_STREAK_MIN_SECONDS;
  }
  return true;
}

/** Unique local dates (sorted ascending) that have ≥1 qualifying event. */
export function qualifyingDates(events: ActivityEventLike[]): string[] {
  const set = new Set<string>();
  for (const e of events) {
    if (eventQualifiesForStreak(e)) set.add(e.localDate);
  }
  return [...set].sort();
}

/**
 * Current streak ending on `today`.
 * - Counts consecutive qualifying local dates ending today.
 * - If today is empty and `streakRescue` is on, may end on yesterday
 *   (one gap only — the rescue day itself does not extend further).
 */
export function computeCurrentStreak(
  dates: readonly string[],
  today: string,
  streakRescue: boolean,
): number {
  const set = new Set(dates);
  if (set.has(today)) {
    return countBack(set, today);
  }
  const yesterday = addDays(today, -1);
  if (streakRescue && set.has(yesterday)) {
    return countBack(set, yesterday);
  }
  return 0;
}

function countBack(set: Set<string>, end: string): number {
  let n = 0;
  let cursor = end;
  while (set.has(cursor)) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

/** Longest consecutive run in the date set (any historical window). */
export function computeBestStreak(dates: readonly string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (diffDays(sorted[i - 1]!, sorted[i]!) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/** Inclusive date range label for the longest streak, or null. */
export function longestStreakRange(
  dates: readonly string[],
): { days: number; from: string; to: string } | null {
  if (dates.length === 0) return null;
  const sorted = [...new Set(dates)].sort();
  let bestFrom = sorted[0]!;
  let bestTo = sorted[0]!;
  let bestLen = 1;
  let runFrom = sorted[0]!;
  let runLen = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (diffDays(sorted[i - 1]!, sorted[i]!) === 1) {
      runLen += 1;
      if (runLen > bestLen) {
        bestLen = runLen;
        bestFrom = runFrom;
        bestTo = sorted[i]!;
      }
    } else {
      runFrom = sorted[i]!;
      runLen = 1;
    }
  }
  return { days: bestLen, from: bestFrom, to: bestTo };
}
