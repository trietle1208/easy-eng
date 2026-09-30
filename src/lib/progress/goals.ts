import {
  addDays,
  formatDateLabel,
  weekdayLetter,
} from "@/lib/progress/dates";
import type { GoalProgress, WeekdayCheck, WeekdayMark } from "@/types/home";

export type DailyGoalCounts = {
  wordsToday: number;
  grammarToday: number;
  wordsTarget: number;
  grammarTarget: number;
};

export function buildGoalProgress(counts: DailyGoalCounts): {
  newWords: GoalProgress;
  grammar: GoalProgress;
  wordsLeftForGoal: number;
} {
  const wordsTarget = Math.max(1, counts.wordsTarget);
  const grammarTarget = Math.max(1, counts.grammarTarget);
  return {
    newWords: {
      label: "New words",
      current: counts.wordsToday,
      target: wordsTarget,
    },
    grammar: {
      label: "Grammar lessons",
      current: counts.grammarToday,
      target: grammarTarget,
    },
    wordsLeftForGoal: Math.max(0, wordsTarget - counts.wordsToday),
  };
}

/**
 * Last 7 local days ending on `today` (oldest → newest).
 * Marks: done | today | empty.
 */
export function buildWeekdayChecks(
  today: string,
  activeDates: ReadonlySet<string>,
): WeekdayCheck[] {
  const checks: WeekdayCheck[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i);
    let status: WeekdayMark = "empty";
    if (date === today) status = "today";
    else if (activeDates.has(date)) status = "done";
    // Today with activity still shows as "today" (dashed ring), matching mockup.
    checks.push({ label: weekdayLetter(date), status });
  }
  return checks;
}

export function streakNote(streakDays: number): string {
  if (streakDays <= 0) return "Start a streak today!";
  if (streakDays === 1) return "Day 1 — nice start!";
  return `Chuỗi ${streakDays} ngày — keep it going!`;
}

export function dailyGoalDateLabel(today: string): string {
  return formatDateLabel(today);
}

/** Quiz results footer: `current / target` for grammar goal. */
export function grammarDailyGoalLabel(
  grammarToday: number,
  grammarTarget: number,
): string {
  return `${grammarToday} / ${Math.max(1, grammarTarget)}`;
}

export function grammarDailyGoalDetail(
  grammarToday: number,
  grammarTarget: number,
): string {
  if (grammarToday >= grammarTarget) return "grammar goal done today";
  const left = grammarTarget - grammarToday;
  return left === 1
    ? "1 grammar lesson left today"
    : `${left} grammar lessons left today`;
}
