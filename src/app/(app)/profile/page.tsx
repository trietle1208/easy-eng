import { ProfileView } from "@/components/profile/profile-view";
import { requireUser } from "@/lib/auth/session";
import {
  getAchievements,
  getActivity,
  getProfile,
} from "@/lib/data/profile";

export default async function ProfilePage() {
  await requireUser("/profile");

  const [
    { profile, stats, levels, settings, timezone, goalText },
    activity,
    achievements,
  ] = await Promise.all([
    getProfile(),
    getActivity({ weeks: 26 }),
    getAchievements(),
  ]);

  return (
    <ProfileView
      profile={profile}
      stats={stats}
      levels={levels}
      activity={activity}
      achievements={achievements.items}
      earnedCount={achievements.earnedCount}
      totalAchievements={achievements.total}
      settings={settings}
      timezone={timezone}
      goalText={goalText}
    />
  );
}
