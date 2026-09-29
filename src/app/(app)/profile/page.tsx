import { ProfileView } from "@/components/profile/profile-view";
import {
  getAchievements,
  getActivity,
  getProfile,
} from "@/lib/data/profile";

export default async function ProfilePage() {
  const [{ profile, stats, levels, settings }, activity, achievements] =
    await Promise.all([
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
    />
  );
}
