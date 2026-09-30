import type { CefrLevel } from "@/types/cefr";
import { CEFR_LABELS } from "@/types/cefr";
import type {
  Achievement,
  AchievementIcon,
  AchievementShape,
  UserProfile,
  UserSettings,
  WeekdayKey,
} from "@/types/profile";

export type UserRow = {
  id: string;
  name: string;
  cefrLevel: string;
  goalText: string | null;
  createdAt: Date;
};

export type UserSettingsRow = {
  wordsPerDay: number;
  grammarPerDay: number;
  dailyReminder: boolean;
  reminderTime: string;
  reminderDays: string[];
  streakRescue: boolean;
  interfaceLanguage: string;
  showVietnameseHints: boolean;
  autoPlayPronunciation: boolean;
  theme: string;
};

export type AchievementDefRow = {
  id: string;
  title: string;
  subtitleTemplate: string;
  icon: string;
  shape: string;
  color: string;
};

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function memberSinceLabel(createdAt: Date): string {
  const month = createdAt.toLocaleString("en-US", { month: "long" });
  const year = createdAt.getFullYear();
  return `Member since ${month} ${year}`;
}

export function mapUserProfile(row: UserRow): UserProfile {
  const level = row.cefrLevel as CefrLevel;
  return {
    id: row.id,
    displayName: row.name,
    initials: initialsFromName(row.name),
    level,
    levelLabel: CEFR_LABELS[level] ?? level,
    memberSinceLabel: memberSinceLabel(row.createdAt),
    goalLabel: row.goalText ? `Goal: ${row.goalText}` : "Goal: —",
  };
}

export function mapUserSettings(row: UserSettingsRow): UserSettings {
  return {
    wordsPerDay: row.wordsPerDay as UserSettings["wordsPerDay"],
    grammarPerDay: row.grammarPerDay as UserSettings["grammarPerDay"],
    dailyReminder: row.dailyReminder,
    reminderTime: row.reminderTime,
    reminderDays: row.reminderDays as WeekdayKey[],
    streakRescue: row.streakRescue,
    interfaceLanguage: row.interfaceLanguage as UserSettings["interfaceLanguage"],
    showVietnameseHints: row.showVietnameseHints,
    autoPlayPronunciation: row.autoPlayPronunciation,
    theme: row.theme as UserSettings["theme"],
  };
}

export function mapAchievement(
  def: AchievementDefRow,
  earned: { earnedAt: Date; progress: Record<string, unknown> | null } | null,
): Achievement {
  return {
    id: def.id,
    title: def.title,
    subtitle: def.subtitleTemplate,
    icon: def.icon as AchievementIcon,
    shape: def.shape as AchievementShape,
    color: def.color as Achievement["color"],
    earned: Boolean(earned),
    earnedLabel: earned ? def.subtitleTemplate : undefined,
    progressLabel: earned ? undefined : def.subtitleTemplate,
  };
}
