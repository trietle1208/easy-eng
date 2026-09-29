import {
  buildActivitySummary,
  mockAchievements,
  mockLevelProgress,
  mockProfile,
  mockUserStats,
  seedSettings,
} from "@/lib/mock/profile";
import type {
  Achievement,
  ActivityRange,
  ActivitySummary,
  LevelProgress,
  UpdateSettingsInput,
  UserProfile,
  UserSettings,
  UserStats,
} from "@/types/profile";

let settingsState: UserSettings = { ...seedSettings };

export async function getProfile(): Promise<{
  profile: UserProfile;
  stats: UserStats;
  levels: LevelProgress[];
  settings: UserSettings;
}> {
  return {
    profile: mockProfile,
    stats: mockUserStats,
    levels: mockLevelProgress,
    settings: { ...settingsState },
  };
}

export async function getActivity(
  range: ActivityRange = { weeks: 26 },
): Promise<ActivitySummary> {
  return buildActivitySummary(range.weeks);
}

export async function getAchievements(): Promise<{
  items: Achievement[];
  earnedCount: number;
  total: number;
}> {
  const items = mockAchievements;
  const earnedCount = items.filter((a) => a.earned).length;
  return { items, earnedCount, total: items.length };
}

export async function updateSettings(
  input: UpdateSettingsInput,
): Promise<UserSettings> {
  settingsState = { ...settingsState, ...input };
  return { ...settingsState };
}

/** Test helper — reset in-memory settings to seed. */
export function __resetProfileSettingsForTests() {
  settingsState = { ...seedSettings };
}
