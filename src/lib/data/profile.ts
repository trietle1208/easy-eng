import "server-only";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";

function revalidateAppPaths(...paths: string[]) {
  if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") return;
  for (const path of paths) revalidatePath(path);
}
import {
  achievementDefinitions,
  user,
  userAchievements,
  userSettings,
} from "@/db/schema";
import { env } from "@/env";
import { requireUser } from "@/lib/auth/session";
import {
  mapAchievement,
  mapUserProfile,
} from "@/lib/data/mappers/profile";
import { recordActivityEvent } from "@/lib/data/progress-write";
import {
  activityHoursInTz,
  countGrammarDone,
  countGrammarLessonsTotal,
  countKindOnDate,
  countWordAddedInRange,
  countWordsLearned,
  loadActivityEventRows,
  loadLevelTotals,
  loadUserSettings,
  streakFromEvents,
  sumStudySeconds,
  sumStudySecondsInRange,
  todayForUser,
  weekBounds,
} from "@/lib/data/user-activity";
import {
  achievementProgressLabel,
  addDays,
  computeLevelProgress,
  formatShortDayMonth,
  grammarDailyGoalDetail,
  grammarDailyGoalLabel,
  isAchievementEarned,
  levelCompletionPercent,
  localDateString,
  longestStreakRange,
  minutesToIntensity,
  monthShort,
  parseAchievementRule,
  secondsToMinutes,
  startOfWeekMonday,
  STUDY_SESSION_STREAK_MIN_SECONDS,
} from "@/lib/progress";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";
import type {
  Achievement,
  ActivityDay,
  ActivityRange,
  ActivitySummary,
  LevelProgress,
  UpdateProfileInput,
  UpdateSettingsInput,
  UserProfile,
  UserSettings,
  UserStats,
} from "@/types/profile";

export async function getProfile(): Promise<{
  profile: UserProfile;
  stats: UserStats;
  levels: LevelProgress[];
  settings: UserSettings;
  timezone: string;
  goalText: string | null;
}> {
  const current = await requireUser("/profile");
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      cefrLevel: user.cefrLevel,
      goalText: user.goalText,
      createdAt: user.createdAt,
      timezone: user.timezone,
    })
    .from(user)
    .where(eq(user.id, current.id))
    .limit(1);

  if (!row) {
    throw new Error("User not found");
  }

  const settings = await loadUserSettings(current.id);
  const { today } = todayForUser(current, env.APP_TIMEZONE);
  const events = await loadActivityEventRows(current.id);
  const streak = streakFromEvents(events, today, settings.streakRescue);
  const { from: weekFrom } = weekBounds(today);

  const [
    wordsLearned,
    wordsThisWeek,
    grammarLessonsDone,
    grammarLessonsTotal,
    studySeconds,
    studySecondsWeek,
    levelTotals,
  ] = await Promise.all([
    countWordsLearned(current.id),
    countWordAddedInRange(current.id, weekFrom, today),
    countGrammarDone(current.id),
    countGrammarLessonsTotal(),
    sumStudySeconds(current.id),
    sumStudySecondsInRange(current.id, weekFrom, today),
    loadLevelTotals(current.id),
  ]);

  const studyHours = Math.round((studySeconds / 3600) * 10) / 10;
  const weekMinutes = secondsToMinutes(studySecondsWeek);
  const weekH = Math.floor(weekMinutes / 60);
  const weekM = weekMinutes % 60;
  const studyHoursThisWeekLabel =
    weekH > 0
      ? `${weekH} h ${weekM} m this week`
      : `${weekM} m this week`;

  const percentByLevel = Object.fromEntries(
    CEFR_LEVELS.map((level) => {
      const g = levelTotals.grammar[level] ?? { total: 0, done: 0 };
      const r = levelTotals.reading[level] ?? { total: 0, done: 0 };
      const l = levelTotals.listening[level] ?? { total: 0, done: 0 };
      return [
        level,
        levelCompletionPercent({
          grammarTotal: g.total,
          grammarDone: g.done,
          readingTotal: r.total,
          readingDone: r.done,
          listeningTotal: l.total,
          listeningDone: l.done,
        }),
      ];
    }),
  ) as Record<CefrLevel, number>;

  const levels = computeLevelProgress(
    row.cefrLevel as CefrLevel,
    percentByLevel,
  );

  return {
    profile: mapUserProfile(row),
    stats: {
      streakDays: streak.current,
      bestStreakDays: streak.best,
      wordsLearned,
      wordsThisWeek,
      grammarLessonsDone,
      grammarLessonsTotal,
      studyHours,
      studyHoursThisWeekLabel,
    },
    levels,
    settings,
    timezone: row.timezone,
    goalText: row.goalText,
  };
}

export async function getActivity(
  range: ActivityRange = { weeks: 26 },
): Promise<ActivitySummary> {
  const current = await requireUser("/profile");
  const { today } = todayForUser(current, env.APP_TIMEZONE);
  const weeks = Math.max(1, Math.min(52, range.weeks));
  const endWeekStart = startOfWeekMonday(today);
  const firstWeekStart = addDays(endWeekStart, -(weeks - 1) * 7);
  const events = await loadActivityEventRows(current.id, firstWeekStart);

  const minutesByDate = new Map<string, number>();
  for (const e of events) {
    const prev = minutesByDate.get(e.localDate) ?? 0;
    minutesByDate.set(
      e.localDate,
      prev + secondsToMinutes(e.durationSeconds),
    );
  }

  const days: ActivityDay[] = [];
  let activeDays = 0;
  for (let w = 0; w < weeks; w++) {
    for (let dow = 0; dow < 7; dow++) {
      const date = addDays(firstWeekStart, w * 7 + dow);
      const isFuture = date > today;
      if (isFuture) {
        days.push({ date, intensity: null, minutes: 0 });
        continue;
      }
      const minutes = minutesByDate.get(date) ?? 0;
      const intensity = minutesToIntensity(minutes);
      if (intensity > 0) activeDays += 1;
      days.push({ date, intensity, minutes });
    }
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = "";
  for (let w = 0; w < weeks; w++) {
    const date = addDays(firstWeekStart, w * 7);
    const label = monthShort(date);
    if (label !== lastMonth) {
      monthLabels.push({ label, weekIndex: w });
      lastMonth = label;
    }
  }

  const settings = await loadUserSettings(current.id);
  const streak = streakFromEvents(events, today, settings.streakRescue);
  const longest = longestStreakRange(streak.dates);
  let longestStreakLabel = "Longest streak: —";
  if (longest && longest.days > 0) {
    longestStreakLabel = `Longest streak: ${longest.days} days (${formatShortDayMonth(longest.from)} – ${formatShortDayMonth(longest.to)})`;
  }

  return {
    days,
    activeDays,
    weeks,
    monthLabels,
    longestStreakLabel,
  };
}

export async function getAchievements(): Promise<{
  items: Achievement[];
  earnedCount: number;
  total: number;
}> {
  const current = await requireUser("/profile");
  const settings = await loadUserSettings(current.id);
  const { today, timezone } = todayForUser(current, env.APP_TIMEZONE);

  const [defs, earnedRows, events, grammarCompleted, wordsSaved, levelTotals] =
    await Promise.all([
      db
        .select()
        .from(achievementDefinitions)
        .orderBy(asc(achievementDefinitions.sortOrder)),
      db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, current.id)),
      loadActivityEventRows(current.id),
      countGrammarDone(current.id),
      countWordsLearned(current.id),
      loadLevelTotals(current.id),
    ]);

  const streak = streakFromEvents(events, today, settings.streakRescue);
  const b1 = levelTotals.grammar.B1 ?? { total: 0, done: 0 };
  const b1r = levelTotals.reading.B1 ?? { total: 0, done: 0 };
  const b1l = levelTotals.listening.B1 ?? { total: 0, done: 0 };
  const b1Percent = levelCompletionPercent({
    grammarTotal: b1.total,
    grammarDone: b1.done,
    readingTotal: b1r.total,
    readingDone: b1r.done,
    listeningTotal: b1l.total,
    listeningDone: b1l.done,
  });

  const stats = {
    grammarCompleted,
    currentStreak: streak.current,
    wordsSaved,
    activityHours: activityHoursInTz(events, timezone),
    cefrLevel: current.cefrLevel as CefrLevel,
    b1Percent,
  };

  const earnedMap = new Map(
    earnedRows.map((r) => [r.achievementId, r] as const),
  );
  const newlyEarned: string[] = [];

  for (const def of defs) {
    if (earnedMap.has(def.id)) continue;
    const rule = parseAchievementRule(def.rule);
    if (!rule) continue;
    if (isAchievementEarned(rule, stats)) {
      newlyEarned.push(def.id);
    }
  }

  if (newlyEarned.length > 0) {
    const now = new Date();
    for (const achievementId of newlyEarned) {
      await db
        .insert(userAchievements)
        .values({
          userId: current.id,
          achievementId,
          earnedAt: now,
          progress: null,
        })
        .onConflictDoNothing();
      earnedMap.set(achievementId, {
        userId: current.id,
        achievementId,
        earnedAt: now,
        progress: null,
      });
    }
  }

  const items: Achievement[] = defs.map((def) => {
    const earned = earnedMap.get(def.id) ?? null;
    const rule = parseAchievementRule(def.rule);
    const base = mapAchievement(
      def,
      earned
        ? {
            earnedAt: earned.earnedAt,
            progress: earned.progress as Record<string, unknown> | null,
          }
        : null,
    );
    if (earned) {
      const earnedDate = localDateString(earned.earnedAt, timezone);
      return {
        ...base,
        earnedLabel: `Earned ${formatShortDayMonth(earnedDate)}`,
        progressLabel: undefined,
      };
    }
    return {
      ...base,
      earnedLabel: undefined,
      progressLabel: rule
        ? achievementProgressLabel(rule, stats)
        : def.subtitleTemplate,
    };
  });

  const earnedCount = items.filter((a) => a.earned).length;
  return { items, earnedCount, total: items.length };
}

export async function updateSettings(
  input: UpdateSettingsInput,
): Promise<UserSettings> {
  const current = await requireUser("/profile");
  await loadUserSettings(current.id);

  const patch: Partial<typeof userSettings.$inferInsert> = {};
  if (input.wordsPerDay != null) patch.wordsPerDay = input.wordsPerDay;
  if (input.grammarPerDay != null) patch.grammarPerDay = input.grammarPerDay;
  if (input.dailyReminder != null) patch.dailyReminder = input.dailyReminder;
  if (input.reminderTime != null) patch.reminderTime = input.reminderTime;
  if (input.reminderDays != null) patch.reminderDays = input.reminderDays;
  if (input.streakRescue != null) patch.streakRescue = input.streakRescue;
  if (input.interfaceLanguage != null) {
    patch.interfaceLanguage = input.interfaceLanguage;
  }
  if (input.showVietnameseHints != null) {
    patch.showVietnameseHints = input.showVietnameseHints;
  }
  if (input.autoPlayPronunciation != null) {
    patch.autoPlayPronunciation = input.autoPlayPronunciation;
  }
  if (input.theme != null) patch.theme = input.theme;

  if (Object.keys(patch).length > 0) {
    await db
      .update(userSettings)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(userSettings.userId, current.id));
  }

  revalidateAppPaths("/profile", "/");
  return loadUserSettings(current.id);
}

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UserProfile> {
  const current = await requireUser("/profile");
  const patch: {
    name?: string;
    cefrLevel?: string;
    timezone?: string;
    goalText?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (input.displayName != null) patch.name = input.displayName.trim();
  if (input.level != null) patch.cefrLevel = input.level;
  if (input.timezone != null) patch.timezone = input.timezone;
  if (input.goalText !== undefined) {
    const trimmed = input.goalText?.trim() || null;
    patch.goalText = trimmed;
  }

  await db.update(user).set(patch).where(eq(user.id, current.id));
  revalidateAppPaths("/profile", "/");

  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      cefrLevel: user.cefrLevel,
      goalText: user.goalText,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, current.id))
    .limit(1);

  return mapUserProfile(row!);
}

/**
 * Record a completed study / Pomodoro session (≥ 60s).
 * Returns whether a new activity row was written.
 */
export async function recordStudySession(opts: {
  durationSeconds: number;
  mode: "study" | "pomodoro";
}): Promise<{ recorded: boolean }> {
  const current = await requireUser("/");
  const duration = Math.floor(opts.durationSeconds);
  if (duration < STUDY_SESSION_STREAK_MIN_SECONDS) {
    return { recorded: false };
  }

  const recorded = await recordActivityEvent({
    userId: current.id,
    timezone: current.timezone,
    kind: "study_session",
    durationSeconds: duration,
    ref: `${opts.mode}:${Date.now()}`,
    payload: { mode: opts.mode },
  });

  revalidateAppPaths("/", "/profile");
  return { recorded };
}

/** Grammar daily-goal labels for quiz results (signed-in users). */
export async function getGrammarDailyGoalLabels(user: {
  id: string;
  timezone: string;
}): Promise<{
  dailyGoalLabel: string;
  dailyGoalDetail: string;
}> {
  const settings = await loadUserSettings(user.id);
  const today = localDateString(new Date(), user.timezone || env.APP_TIMEZONE);
  const grammarToday = await countKindOnDate(
    user.id,
    "grammar_done",
    today,
  );
  return {
    dailyGoalLabel: grammarDailyGoalLabel(
      grammarToday,
      settings.grammarPerDay,
    ),
    dailyGoalDetail: grammarDailyGoalDetail(
      grammarToday,
      settings.grammarPerDay,
    ),
  };
}

export async function getThemeForUser(
  userId: string,
): Promise<UserSettings["theme"]> {
  const settings = await loadUserSettings(userId);
  return settings.theme;
}
