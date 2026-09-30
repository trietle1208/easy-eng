import "server-only";

import { and, count, eq, gte, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  activityEvents,
  grammarLessons,
  listeningLessons,
  readingPassages,
  userLessonProgress,
  userSettings,
  userWordCards,
  words,
} from "@/db/schema";
import { ensureUserDefaults } from "@/lib/auth/ensure-user-defaults";
import type { CurrentUser } from "@/lib/auth/session";
import { mapUserSettings } from "@/lib/data/mappers/profile";
import {
  computeBestStreak,
  computeCurrentStreak,
  localDateString,
  localHour,
  qualifyingDates,
  startOfWeekMonday,
  type ActivityEventLike,
} from "@/lib/progress";
import type { UserSettings } from "@/types/profile";

export const DEFAULT_SETTINGS: UserSettings = {
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

export async function loadUserSettings(userId: string): Promise<UserSettings> {
  await ensureUserDefaults(userId);
  const row = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  if (!row) return { ...DEFAULT_SETTINGS };
  return mapUserSettings(row);
}

export async function loadActivityEvents(
  userId: string,
  fromLocalDate?: string,
): Promise<ActivityEventLike[]> {
  const rows = fromLocalDate
    ? await db
        .select({
          localDate: activityEvents.localDate,
          kind: activityEvents.kind,
          durationSeconds: activityEvents.durationSeconds,
          occurredAt: activityEvents.occurredAt,
        })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.userId, userId),
            gte(activityEvents.localDate, fromLocalDate),
          ),
        )
    : await db
        .select({
          localDate: activityEvents.localDate,
          kind: activityEvents.kind,
          durationSeconds: activityEvents.durationSeconds,
          occurredAt: activityEvents.occurredAt,
        })
        .from(activityEvents)
        .where(eq(activityEvents.userId, userId));

  return rows.map((r) => ({
    localDate: String(r.localDate),
    kind: r.kind,
    durationSeconds: r.durationSeconds,
    occurredAt: r.occurredAt,
  }));
}

export type ActivityEventRow = ActivityEventLike & { occurredAt: Date };

export async function loadActivityEventRows(
  userId: string,
  fromLocalDate?: string,
): Promise<ActivityEventRow[]> {
  const rows = fromLocalDate
    ? await db
        .select({
          localDate: activityEvents.localDate,
          kind: activityEvents.kind,
          durationSeconds: activityEvents.durationSeconds,
          occurredAt: activityEvents.occurredAt,
        })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.userId, userId),
            gte(activityEvents.localDate, fromLocalDate),
          ),
        )
    : await db
        .select({
          localDate: activityEvents.localDate,
          kind: activityEvents.kind,
          durationSeconds: activityEvents.durationSeconds,
          occurredAt: activityEvents.occurredAt,
        })
        .from(activityEvents)
        .where(eq(activityEvents.userId, userId));

  return rows.map((r) => ({
    localDate: String(r.localDate),
    kind: r.kind,
    durationSeconds: r.durationSeconds,
    occurredAt: r.occurredAt,
  }));
}

export function streakFromEvents(
  events: ActivityEventLike[],
  today: string,
  streakRescue: boolean,
): { current: number; best: number; dates: string[] } {
  const dates = qualifyingDates(events);
  return {
    current: computeCurrentStreak(dates, today, streakRescue),
    best: computeBestStreak(dates),
    dates,
  };
}

export async function countKindOnDate(
  userId: string,
  kind: string,
  localDate: string,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        eq(activityEvents.kind, kind),
        eq(activityEvents.localDate, localDate),
      ),
    );
  return Number(row?.n ?? 0);
}

export async function countGrammarDone(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(userLessonProgress)
    .where(
      and(
        eq(userLessonProgress.userId, userId),
        eq(userLessonProgress.contentKind, "grammar"),
        eq(userLessonProgress.status, "completed"),
      ),
    );
  return Number(row?.n ?? 0);
}

export async function countWordsSaved(userId: string): Promise<number> {
  const [owned] = await db
    .select({ n: count() })
    .from(words)
    .where(eq(words.ownerId, userId));
  const [cards] = await db
    .select({ n: count() })
    .from(userWordCards)
    .where(eq(userWordCards.userId, userId));
  // Prefer study queue size; fall back to owned words if no cards yet.
  const cardCount = Number(cards?.n ?? 0);
  const ownedCount = Number(owned?.n ?? 0);
  return Math.max(cardCount, ownedCount);
}

export async function countWordsLearned(userId: string): Promise<number> {
  return countWordsSaved(userId);
}

export async function countWordAddedInRange(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        eq(activityEvents.kind, "word_added"),
        gte(activityEvents.localDate, fromDate),
        sql`${activityEvents.localDate} <= ${toDate}`,
      ),
    );
  return Number(row?.n ?? 0);
}

export async function sumStudySeconds(userId: string): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${activityEvents.durationSeconds}), 0)::int`,
    })
    .from(activityEvents)
    .where(eq(activityEvents.userId, userId));
  return Number(row?.total ?? 0);
}

export async function sumStudySecondsInRange(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${activityEvents.durationSeconds}), 0)::int`,
    })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        gte(activityEvents.localDate, fromDate),
        sql`${activityEvents.localDate} <= ${toDate}`,
      ),
    );
  return Number(row?.total ?? 0);
}

export async function countGrammarLessonsTotal(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(grammarLessons)
    .where(eq(grammarLessons.status, "published"));
  return Number(row?.n ?? 0);
}

export type LevelTotals = {
  grammar: Record<string, { total: number; done: number }>;
  reading: Record<string, { total: number; done: number }>;
  listening: Record<string, { total: number; done: number }>;
};

export async function loadLevelTotals(userId: string): Promise<LevelTotals> {
  const [gTotals, rTotals, lTotals, done] = await Promise.all([
    db
      .select({
        level: grammarLessons.level,
        n: count(),
      })
      .from(grammarLessons)
      .where(eq(grammarLessons.status, "published"))
      .groupBy(grammarLessons.level),
    db
      .select({
        level: readingPassages.level,
        n: count(),
      })
      .from(readingPassages)
      .where(eq(readingPassages.status, "published"))
      .groupBy(readingPassages.level),
    db
      .select({
        level: listeningLessons.level,
        n: count(),
      })
      .from(listeningLessons)
      .where(eq(listeningLessons.status, "published"))
      .groupBy(listeningLessons.level),
    db
      .select({
        contentKind: userLessonProgress.contentKind,
        contentId: userLessonProgress.contentId,
      })
      .from(userLessonProgress)
      .where(
        and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.status, "completed"),
          inArray(userLessonProgress.contentKind, [
            "grammar",
            "reading",
            "listening",
          ]),
        ),
      ),
  ]);

  const empty = (): Record<string, { total: number; done: number }> => ({});
  const grammar = empty();
  const reading = empty();
  const listening = empty();

  for (const row of gTotals) {
    grammar[row.level] = { total: Number(row.n), done: 0 };
  }
  for (const row of rTotals) {
    reading[row.level] = { total: Number(row.n), done: 0 };
  }
  for (const row of lTotals) {
    listening[row.level] = { total: Number(row.n), done: 0 };
  }

  const grammarIds = done
    .filter((d) => d.contentKind === "grammar")
    .map((d) => d.contentId);
  const readingIds = done
    .filter((d) => d.contentKind === "reading")
    .map((d) => d.contentId);
  const listeningIds = done
    .filter((d) => d.contentKind === "listening")
    .map((d) => d.contentId);

  if (grammarIds.length > 0) {
    const rows = await db
      .select({ level: grammarLessons.level, n: count() })
      .from(grammarLessons)
      .where(
        and(
          inArray(grammarLessons.id, grammarIds),
          eq(grammarLessons.status, "published"),
        ),
      )
      .groupBy(grammarLessons.level);
    for (const row of rows) {
      grammar[row.level] = grammar[row.level] ?? { total: 0, done: 0 };
      grammar[row.level]!.done = Number(row.n);
    }
  }
  if (readingIds.length > 0) {
    const rows = await db
      .select({ level: readingPassages.level, n: count() })
      .from(readingPassages)
      .where(
        and(
          inArray(readingPassages.id, readingIds),
          eq(readingPassages.status, "published"),
        ),
      )
      .groupBy(readingPassages.level);
    for (const row of rows) {
      reading[row.level] = reading[row.level] ?? { total: 0, done: 0 };
      reading[row.level]!.done = Number(row.n);
    }
  }
  if (listeningIds.length > 0) {
    const rows = await db
      .select({ level: listeningLessons.level, n: count() })
      .from(listeningLessons)
      .where(
        and(
          inArray(listeningLessons.id, listeningIds),
          eq(listeningLessons.status, "published"),
        ),
      )
      .groupBy(listeningLessons.level);
    for (const row of rows) {
      listening[row.level] = listening[row.level] ?? { total: 0, done: 0 };
      listening[row.level]!.done = Number(row.n);
    }
  }

  return { grammar, reading, listening };
}

export function activityHoursInTz(
  events: ActivityEventRow[],
  timeZone: string,
): number[] {
  return events.map((e) => localHour(e.occurredAt, timeZone));
}

export function weekBounds(today: string): { from: string; to: string } {
  return { from: startOfWeekMonday(today), to: today };
}

export function todayForUser(user: CurrentUser | null, fallbackTz: string): {
  today: string;
  timezone: string;
} {
  const timezone = user?.timezone || fallbackTz;
  return { today: localDateString(new Date(), timezone), timezone };
}

/** System word count helper for catalog (owner null). */
export async function countSystemWords(): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(words)
    .where(isNull(words.ownerId));
  return Number(row?.n ?? 0);
}
