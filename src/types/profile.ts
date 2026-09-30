import type { CefrLevel } from "@/types/cefr";

export type InterfaceLanguage = "en" | "vi";

export type AppThemeId = "default" | "blossom";

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type UserProfile = {
  id: string;
  displayName: string;
  initials: string;
  level: CefrLevel;
  levelLabel: string;
  memberSinceLabel: string;
  goalLabel: string;
};

export type UserStats = {
  streakDays: number;
  bestStreakDays: number;
  wordsLearned: number;
  wordsThisWeek: number;
  grammarLessonsDone: number;
  grammarLessonsTotal: number;
  studyHours: number;
  studyHoursThisWeekLabel: string;
};

/** 0 = none, 1–4 = intensity; null = future / out of range */
export type ActivityIntensity = 0 | 1 | 2 | 3 | 4;

export type ActivityDay = {
  date: string; // YYYY-MM-DD
  intensity: ActivityIntensity | null;
  minutes: number;
};

export type ActivityRange = {
  weeks: number;
};

export type ActivitySummary = {
  days: ActivityDay[];
  activeDays: number;
  weeks: number;
  monthLabels: { label: string; weekIndex: number }[];
  longestStreakLabel: string;
};

export type LevelProgress = {
  level: CefrLevel;
  label: string;
  percent: number;
  statusLabel: string;
  current: boolean;
  locked: boolean;
};

export type AchievementIcon =
  | "book"
  | "flame"
  | "cards"
  | "pencil"
  | "sun"
  | "moon"
  | "trophy";

export type AchievementShape = "round" | "square";

export type Achievement = {
  id: string;
  title: string;
  subtitle: string;
  icon: AchievementIcon;
  shape: AchievementShape;
  /** Token-ish paint key when unlocked */
  color: "green" | "orange" | "blue" | "purple" | "gold";
  earned: boolean;
  earnedLabel?: string;
  progressLabel?: string;
};

export type UserSettings = {
  wordsPerDay: 10 | 20 | 30 | 50;
  grammarPerDay: 1 | 2 | 3;
  dailyReminder: boolean;
  reminderTime: string; // HH:MM
  reminderDays: WeekdayKey[];
  streakRescue: boolean;
  interfaceLanguage: InterfaceLanguage;
  showVietnameseHints: boolean;
  autoPlayPronunciation: boolean;
  theme: AppThemeId;
};

export type UpdateSettingsInput = Partial<UserSettings>;

export type UpdateProfileInput = {
  displayName?: string;
  level?: CefrLevel;
  timezone?: string;
  goalText?: string | null;
};
