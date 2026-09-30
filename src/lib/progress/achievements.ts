import { CEFR_LEVELS, type CefrLevel } from "@/types/cefr";

export type AchievementRule =
  | { type: "grammar_completed"; min: number }
  | { type: "streak_days"; min: number }
  | { type: "words_saved"; min: number }
  | { type: "activity_before_hour"; hour: number }
  | { type: "activity_after_hour"; hour: number }
  | { type: "cefr_at_least"; level: CefrLevel };

export type AchievementStats = {
  grammarCompleted: number;
  currentStreak: number;
  wordsSaved: number;
  /** Local hours (0–23) of any activity events */
  activityHours: number[];
  cefrLevel: CefrLevel;
  /** B1 band completion % — used for b2-unlocked when level still B1 */
  b1Percent: number;
};

export function parseAchievementRule(
  raw: Record<string, unknown>,
): AchievementRule | null {
  const type = raw.type;
  if (type === "grammar_completed" || type === "streak_days" || type === "words_saved") {
    const min = Number(raw.min);
    if (!Number.isFinite(min)) return null;
    return { type, min };
  }
  if (type === "activity_before_hour" || type === "activity_after_hour") {
    const hour = Number(raw.hour);
    if (!Number.isFinite(hour)) return null;
    return { type, hour };
  }
  if (type === "cefr_at_least") {
    const level = String(raw.level) as CefrLevel;
    if (!CEFR_LEVELS.includes(level)) return null;
    return { type, level };
  }
  return null;
}

export function isAchievementEarned(
  rule: AchievementRule,
  stats: AchievementStats,
): boolean {
  switch (rule.type) {
    case "grammar_completed":
      return stats.grammarCompleted >= rule.min;
    case "streak_days":
      return stats.currentStreak >= rule.min;
    case "words_saved":
      return stats.wordsSaved >= rule.min;
    case "activity_before_hour":
      return stats.activityHours.some((h) => h < rule.hour);
    case "activity_after_hour":
      return stats.activityHours.some((h) => h >= rule.hour);
    case "cefr_at_least": {
      const need = CEFR_LEVELS.indexOf(rule.level);
      const have = CEFR_LEVELS.indexOf(stats.cefrLevel);
      if (have >= need) return true;
      // Phase 0: also when B1 progress is complete
      if (rule.level === "B2" && stats.b1Percent >= 100) return true;
      return false;
    }
    default:
      return false;
  }
}

export function achievementProgressLabel(
  rule: AchievementRule,
  stats: AchievementStats,
): string {
  switch (rule.type) {
    case "grammar_completed":
      return `${Math.min(stats.grammarCompleted, rule.min)} of ${rule.min} lessons`;
    case "streak_days":
      return `${Math.min(stats.currentStreak, rule.min)} of ${rule.min} days`;
    case "words_saved":
      return `${Math.min(stats.wordsSaved, rule.min).toLocaleString("en-US")} of ${rule.min.toLocaleString("en-US")} words`;
    case "activity_before_hour":
      return `Study before ${rule.hour}:00`;
    case "activity_after_hour":
      return `Study after ${rule.hour}:00`;
    case "cefr_at_least":
      return `Reach ${rule.level}`;
    default:
      return "";
  }
}
