import { describe, expect, it } from "vitest";

import {
  achievementProgressLabel,
  isAchievementEarned,
  parseAchievementRule,
  type AchievementStats,
} from "@/lib/progress/achievements";
import {
  addDays,
  localDateString,
  localHour,
  startOfWeekMonday,
  weekdayIndexMonday,
} from "@/lib/progress/dates";
import {
  buildGoalProgress,
  buildWeekdayChecks,
  grammarDailyGoalLabel,
  streakNote,
} from "@/lib/progress/goals";
import { pickIndex } from "@/lib/progress/hash";
import { minutesToIntensity } from "@/lib/progress/intensity";
import {
  computeLevelProgress,
  levelCompletionPercent,
  LEVEL_UNLOCK_THRESHOLD,
} from "@/lib/progress/level";
import {
  computeBestStreak,
  computeCurrentStreak,
  eventQualifiesForStreak,
  longestStreakRange,
  qualifyingDates,
} from "@/lib/progress/streak";

describe("dates", () => {
  it("formats local dates in Asia/Ho_Chi_Minh across UTC midnight", () => {
    // 2026-09-29 17:30 UTC = 2026-09-30 00:30 ICT
    const justAfterMidnightIct = new Date("2026-09-29T17:30:00.000Z");
    expect(localDateString(justAfterMidnightIct, "Asia/Ho_Chi_Minh")).toBe(
      "2026-09-30",
    );
    // 2026-09-29 16:30 UTC = 2026-09-29 23:30 ICT
    const justBefore = new Date("2026-09-29T16:30:00.000Z");
    expect(localDateString(justBefore, "Asia/Ho_Chi_Minh")).toBe("2026-09-29");
  });

  it("handles UTC timezone without DST surprises", () => {
    const d = new Date("2026-03-29T00:30:00.000Z");
    expect(localDateString(d, "UTC")).toBe("2026-03-29");
    expect(localHour(d, "UTC")).toBe(0);
  });

  it("addDays and week helpers are calendar-stable", () => {
    expect(addDays("2026-09-30", -1)).toBe("2026-09-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(startOfWeekMonday("2026-09-30")).toBe("2026-09-28"); // Wed → Mon
    expect(weekdayIndexMonday("2026-09-28")).toBe(0); // Monday
    expect(weekdayIndexMonday("2026-09-27")).toBe(6); // Sunday
  });
});

describe("streak", () => {
  it("study_session under 60s does not qualify", () => {
    expect(
      eventQualifiesForStreak({
        localDate: "2026-09-30",
        kind: "study_session",
        durationSeconds: 59,
      }),
    ).toBe(false);
    expect(
      eventQualifiesForStreak({
        localDate: "2026-09-30",
        kind: "study_session",
        durationSeconds: 60,
      }),
    ).toBe(true);
  });

  it("counts consecutive days ending today", () => {
    const dates = ["2026-09-28", "2026-09-29", "2026-09-30"];
    expect(computeCurrentStreak(dates, "2026-09-30", false)).toBe(3);
  });

  it("breaks on a gap without rescue", () => {
    const dates = ["2026-09-28", "2026-09-30"];
    expect(computeCurrentStreak(dates, "2026-09-30", false)).toBe(1);
  });

  it("streak rescue allows ending on yesterday when today is empty", () => {
    const dates = ["2026-09-28", "2026-09-29"];
    expect(computeCurrentStreak(dates, "2026-09-30", true)).toBe(2);
    expect(computeCurrentStreak(dates, "2026-09-30", false)).toBe(0);
  });

  it("rescue does not skip a two-day gap", () => {
    const dates = ["2026-09-27", "2026-09-28"];
    expect(computeCurrentStreak(dates, "2026-09-30", true)).toBe(0);
  });

  it("computes best streak and longest range across gaps", () => {
    const dates = ["2026-05-02", "2026-05-03", "2026-05-04", "2026-06-01"];
    expect(computeBestStreak(dates)).toBe(3);
    expect(longestStreakRange(dates)).toEqual({
      days: 3,
      from: "2026-05-02",
      to: "2026-05-04",
    });
  });

  it("qualifyingDates dedupes per day", () => {
    const events = [
      { localDate: "2026-09-30", kind: "word_added", durationSeconds: 0 },
      { localDate: "2026-09-30", kind: "grammar_done", durationSeconds: 0 },
      { localDate: "2026-09-29", kind: "quiz_done", durationSeconds: 120 },
    ];
    expect(qualifyingDates(events)).toEqual(["2026-09-29", "2026-09-30"]);
  });
});

describe("goals", () => {
  it("builds progress and weekday checks", () => {
    const { newWords, wordsLeftForGoal } = buildGoalProgress({
      wordsToday: 12,
      grammarToday: 1,
      wordsTarget: 20,
      grammarTarget: 2,
    });
    expect(newWords.current).toBe(12);
    expect(wordsLeftForGoal).toBe(8);
    expect(grammarDailyGoalLabel(1, 2)).toBe("1 / 2");
    expect(streakNote(7)).toContain("7");

    const checks = buildWeekdayChecks(
      "2026-09-30",
      new Set(["2026-09-29", "2026-09-28"]),
    );
    expect(checks).toHaveLength(7);
    expect(checks[6]).toEqual({ label: "W", status: "today" });
    expect(checks[5]).toEqual({ label: "T", status: "done" });
  });
});

describe("intensity", () => {
  it("maps minute bands to 0–4", () => {
    expect(minutesToIntensity(0)).toBe(0);
    expect(minutesToIntensity(1)).toBe(1);
    expect(minutesToIntensity(14)).toBe(1);
    expect(minutesToIntensity(15)).toBe(2);
    expect(minutesToIntensity(29)).toBe(2);
    expect(minutesToIntensity(30)).toBe(3);
    expect(minutesToIntensity(44)).toBe(3);
    expect(minutesToIntensity(45)).toBe(4);
  });
});

describe("level progress", () => {
  it("averages equal-weight completion", () => {
    expect(
      levelCompletionPercent({
        grammarTotal: 10,
        grammarDone: 5,
        readingTotal: 4,
        readingDone: 4,
        listeningTotal: 2,
        listeningDone: 0,
      }),
    ).toBe(50); // (0.5 + 1 + 0) / 3
  });

  it("locks higher bands until previous ≥ threshold", () => {
    const levels = computeLevelProgress("B1", {
      A1: 100,
      A2: LEVEL_UNLOCK_THRESHOLD - 1,
      B1: 42,
      B2: 8,
      C1: 0,
    });
    expect(levels.find((l) => l.level === "B1")?.current).toBe(true);
    // A2 below threshold but user is already B1 → A2/B1 unlocked; B2 locked via A2? 
    // Rule: idx > userIdx && prev < threshold → B2 locked because B1 percent 42 < 80
    expect(levels.find((l) => l.level === "B2")?.locked).toBe(true);
    expect(levels.find((l) => l.level === "C1")?.locked).toBe(true);
    expect(levels.find((l) => l.level === "A1")?.locked).toBe(false);
  });

  it("unlocks next band at threshold", () => {
    const levels = computeLevelProgress("B1", {
      A1: 100,
      A2: 100,
      B1: 80,
      B2: 10,
      C1: 0,
    });
    expect(levels.find((l) => l.level === "B2")?.locked).toBe(false);
    expect(levels.find((l) => l.level === "C1")?.locked).toBe(true);
  });
});

describe("hash / WOTD pick", () => {
  it("is stable for the same key", () => {
    expect(pickIndex("2026-09-30", 100)).toBe(pickIndex("2026-09-30", 100));
    expect(pickIndex("2026-09-30", 10)).toBeLessThan(10);
  });
});

describe("achievements", () => {
  const base: AchievementStats = {
    grammarCompleted: 0,
    currentStreak: 0,
    wordsSaved: 0,
    activityHours: [],
    cefrLevel: "A1",
    b1Percent: 0,
  };

  it("parses and evaluates rules", () => {
    const streak = parseAchievementRule({ type: "streak_days", min: 7 });
    expect(streak).toEqual({ type: "streak_days", min: 7 });
    expect(isAchievementEarned(streak!, { ...base, currentStreak: 7 })).toBe(
      true,
    );
    expect(achievementProgressLabel(streak!, { ...base, currentStreak: 3 })).toBe(
      "3 of 7 days",
    );
  });

  it("early-bird / night-owl use local hours", () => {
    const early = parseAchievementRule({
      type: "activity_before_hour",
      hour: 7,
    })!;
    const owl = parseAchievementRule({
      type: "activity_after_hour",
      hour: 23,
    })!;
    expect(
      isAchievementEarned(early, { ...base, activityHours: [6, 12] }),
    ).toBe(true);
    expect(isAchievementEarned(owl, { ...base, activityHours: [22] })).toBe(
      false,
    );
    expect(isAchievementEarned(owl, { ...base, activityHours: [23] })).toBe(
      true,
    );
  });

  it("b2-unlocked via level or B1 completion", () => {
    const rule = parseAchievementRule({
      type: "cefr_at_least",
      level: "B2",
    })!;
    expect(isAchievementEarned(rule, { ...base, cefrLevel: "B2" })).toBe(true);
    expect(
      isAchievementEarned(rule, { ...base, cefrLevel: "B1", b1Percent: 100 }),
    ).toBe(true);
    expect(
      isAchievementEarned(rule, { ...base, cefrLevel: "B1", b1Percent: 99 }),
    ).toBe(false);
  });
});
