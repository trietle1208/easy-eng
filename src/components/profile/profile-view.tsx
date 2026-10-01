"use client";

import dynamic from "next/dynamic";

import { AchievementsShelf } from "@/components/profile/achievements-shelf";
import { LevelProgressPanel } from "@/components/profile/level-progress";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { ProfileStats } from "@/components/profile/profile-stats";
import type {
  Achievement,
  ActivitySummary,
  LevelProgress,
  UserProfile,
  UserSettings,
  UserStats,
} from "@/types/profile";

const ActivityHeatmap = dynamic(
  () =>
    import("@/components/profile/activity-heatmap").then(
      (m) => m.ActivityHeatmap,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[220px] animate-pulse rounded-[8px_16px_10px_14px] bg-paper/80 shadow-[var(--paper-shadow)]"
        aria-busy
        aria-label="Loading activity heatmap"
      />
    ),
  },
);

type ProfileViewProps = {
  profile: UserProfile;
  stats: UserStats;
  levels: LevelProgress[];
  activity: ActivitySummary;
  achievements: Achievement[];
  earnedCount: number;
  totalAchievements: number;
  settings: UserSettings;
  timezone: string;
  goalText: string | null;
};

export function ProfileView({
  profile,
  stats,
  levels,
  activity,
  achievements,
  earnedCount,
  totalAchievements,
  settings,
  timezone,
  goalText,
}: ProfileViewProps) {
  return (
    <div className="flex flex-col gap-8 text-on-glass md:gap-9">
      <ProfileHeader
        profile={profile}
        timezone={timezone}
        goalText={goalText}
      />

      <ProfileStats stats={stats} />

      <AchievementsShelf
        items={achievements}
        earnedCount={earnedCount}
        total={totalAchievements}
      />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <ActivityHeatmap activity={activity} />
        <LevelProgressPanel levels={levels} />
      </div>

      <ProfileSettings initial={settings} />
    </div>
  );
}
