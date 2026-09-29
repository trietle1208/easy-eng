import type {
  Achievement,
  ActivityDay,
  ActivityIntensity,
  ActivitySummary,
  LevelProgress,
  UserProfile,
  UserSettings,
  UserStats,
} from "@/types/profile";

export const mockProfile: UserProfile = {
  id: "user-linh",
  displayName: "Linh Trần",
  initials: "LT",
  level: "B1",
  levelLabel: "Intermediate",
  memberSinceLabel: "Member since March 2026",
  goalLabel: "Goal: IELTS 6.5",
};

export const mockUserStats: UserStats = {
  streakDays: 23,
  bestStreakDays: 41,
  wordsLearned: 1284,
  wordsThisWeek: 86,
  grammarLessonsDone: 68,
  grammarLessonsTotal: 474,
  studyHours: 94.5,
  studyHoursThisWeekLabel: "3 h 20 m this week",
};

export const mockLevelProgress: LevelProgress[] = [
  {
    level: "A1",
    label: "Beginner",
    percent: 100,
    statusLabel: "Done",
    current: false,
    locked: false,
  },
  {
    level: "A2",
    label: "Elementary",
    percent: 86,
    statusLabel: "86%",
    current: false,
    locked: false,
  },
  {
    level: "B1",
    label: "Intermediate",
    percent: 42,
    statusLabel: "42%",
    current: true,
    locked: false,
  },
  {
    level: "B2",
    label: "Upper-intermediate",
    percent: 8,
    statusLabel: "8%",
    current: false,
    locked: false,
  },
  {
    level: "C1",
    label: "Advanced",
    percent: 0,
    statusLabel: "Locked",
    current: false,
    locked: true,
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: "first-page",
    title: "First page",
    subtitle: "Finished lesson 1",
    icon: "book",
    shape: "round",
    color: "green",
    earned: true,
    earnedLabel: "Finished lesson 1",
  },
  {
    id: "streak-7",
    title: "7-day streak",
    subtitle: "Earned 4 Sep",
    icon: "flame",
    shape: "square",
    color: "orange",
    earned: true,
    earnedLabel: "Earned 4 Sep",
  },
  {
    id: "word-collector",
    title: "Word collector",
    subtitle: "1,000 words",
    icon: "cards",
    shape: "round",
    color: "blue",
    earned: true,
    earnedLabel: "1,000 words",
  },
  {
    id: "grammar-geek",
    title: "Grammar geek",
    subtitle: "50 lessons",
    icon: "pencil",
    shape: "square",
    color: "purple",
    earned: true,
    earnedLabel: "50 lessons",
  },
  {
    id: "early-bird",
    title: "Early bird",
    subtitle: "Studied before 7 am",
    icon: "sun",
    shape: "round",
    color: "gold",
    earned: true,
    earnedLabel: "Studied before 7 am",
  },
  {
    id: "streak-30",
    title: "30-day streak",
    subtitle: "23 of 30 days",
    icon: "flame",
    shape: "square",
    color: "orange",
    earned: false,
    progressLabel: "23 of 30 days",
  },
  {
    id: "night-owl",
    title: "Night owl",
    subtitle: "Study after 11 pm",
    icon: "moon",
    shape: "round",
    color: "blue",
    earned: false,
    progressLabel: "Study after 11 pm",
  },
  {
    id: "b2-unlocked",
    title: "B2 unlocked",
    subtitle: "Finish B1",
    icon: "trophy",
    shape: "square",
    color: "gold",
    earned: false,
    progressLabel: "Finish B1",
  },
];

export const seedSettings: UserSettings = {
  wordsPerDay: 20,
  grammarPerDay: 2,
  dailyReminder: true,
  reminderTime: "20:30",
  reminderDays: ["mon", "tue", "wed", "thu", "fri", "sun"],
  streakRescue: true,
  interfaceLanguage: "en",
  showVietnameseHints: true,
  autoPlayPronunciation: false,
  theme: "default",
};

/** Deterministic intensity from date string */
function hashDay(iso: string): number {
  let h = 0;
  for (let i = 0; i < iso.length; i++) {
    h = (h * 31 + iso.charCodeAt(i)) >>> 0;
  }
  return h;
}

function intensityFromHash(h: number): ActivityIntensity {
  const bucket = h % 11;
  if (bucket === 0) return 0;
  if (bucket <= 3) return 1;
  if (bucket <= 6) return 2;
  if (bucket <= 8) return 3;
  return 4;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeekMonday(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Build last N weeks ending this week (Mon–Sun columns). */
export function buildActivitySummary(
  weeks = 26,
  anchor: Date = new Date("2026-09-28T12:00:00"),
): ActivitySummary {
  const endWeekStart = startOfWeekMonday(anchor);
  const firstWeekStart = new Date(endWeekStart);
  firstWeekStart.setDate(firstWeekStart.getDate() - (weeks - 1) * 7);

  const days: ActivityDay[] = [];
  let activeDays = 0;

  for (let w = 0; w < weeks; w++) {
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(firstWeekStart);
      d.setDate(firstWeekStart.getDate() + w * 7 + dow);
      const iso = toIso(d);
      const isFuture = d > anchor;

      if (isFuture) {
        days.push({ date: iso, intensity: null, minutes: 0 });
        continue;
      }

      const h = hashDay(iso);
      const intensity = intensityFromHash(h);
      const minutes =
        intensity === 0 ? 0 : 8 + (h % 47) + intensity * 12;
      if (intensity > 0) activeDays += 1;
      days.push({ date: iso, intensity, minutes });
    }
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const d = new Date(firstWeekStart);
    d.setDate(firstWeekStart.getDate() + w * 7);
    const m = d.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTH_SHORT[m]!, weekIndex: w });
      lastMonth = m;
    }
  }

  return {
    days,
    activeDays,
    weeks,
    monthLabels,
    longestStreakLabel: "Longest streak: 41 days (2 May – 11 Jun)",
  };
}
