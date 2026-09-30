import "server-only";

import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  grammarLessons,
  userLessonProgress,
  userWordCards,
  wordSets,
  words,
} from "@/db/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/data/cache-tags";
import { cacheContentQuery } from "@/lib/data/content-cache";
import {
  countKindOnDate,
  DEFAULT_SETTINGS,
  loadActivityEventRows,
  loadUserSettings,
  streakFromEvents,
  todayForUser,
} from "@/lib/data/user-activity";
import {
  addDays,
  buildGoalProgress,
  buildWeekdayChecks,
  dailyGoalDateLabel,
  localHour,
  pickIndex,
  streakNote,
} from "@/lib/progress";
import type { CefrLevel } from "@/types/cefr";
import type {
  ContinueItem,
  DailyGoal,
  Greeting,
  HomeCatalogStats,
  SectionEntry,
  WordOfTheDay,
} from "@/types/home";

export type { Greeting };

const POMODORO_SECONDS = 25 * 60;

export async function getDailyGoal(): Promise<DailyGoal> {
  const user = await getCurrentUser();
  const { today } = todayForUser(user, env.APP_TIMEZONE);

  if (!user) {
    const progress = buildGoalProgress({
      wordsToday: 0,
      grammarToday: 0,
      wordsTarget: DEFAULT_SETTINGS.wordsPerDay,
      grammarTarget: DEFAULT_SETTINGS.grammarPerDay,
    });
    return {
      dateLabel: dailyGoalDateLabel(today),
      streakDays: 0,
      streakNote: streakNote(0),
      weekdays: buildWeekdayChecks(today, new Set()),
      ...progress,
      studySeconds: 0,
      pomodoroSeconds: POMODORO_SECONDS,
    };
  }

  const settings = await loadUserSettings(user.id);
  const lookbackStart = addDays(today, -400);
  const events = await loadActivityEventRows(user.id, lookbackStart);
  const streak = streakFromEvents(events, today, settings.streakRescue);
  const activeSet = new Set(streak.dates);

  const [wordsToday, grammarToday] = await Promise.all([
    countKindOnDate(user.id, "word_added", today),
    countKindOnDate(user.id, "grammar_done", today),
  ]);

  const progress = buildGoalProgress({
    wordsToday,
    grammarToday,
    wordsTarget: settings.wordsPerDay,
    grammarTarget: settings.grammarPerDay,
  });

  return {
    dateLabel: dailyGoalDateLabel(today),
    streakDays: streak.current,
    streakNote: streakNote(streak.current),
    weekdays: buildWeekdayChecks(today, activeSet),
    ...progress,
    studySeconds: 0,
    pomodoroSeconds: POMODORO_SECONDS,
  };
}

type WotdRow = {
  word: string;
  ipa: string;
  partOfSpeech: string;
  level: string;
  meaningVi: string;
  examples: { en: string; vi?: string }[];
};

const loadSystemWordsForWotd = cacheContentQuery(
  async (): Promise<WotdRow[]> => {
    return db
      .select({
        word: words.word,
        ipa: words.ipa,
        partOfSpeech: words.partOfSpeech,
        level: words.level,
        meaningVi: words.meaningVi,
        examples: words.examples,
      })
      .from(words)
      .innerJoin(wordSets, eq(words.wordSetId, wordSets.id))
      .where(
        and(
          isNull(words.ownerId),
          eq(wordSets.status, "published"),
          sql`jsonb_array_length(${words.examples}) >= 1`,
        ),
      )
      .orderBy(words.word);
  },
  ["wotd-system-words"],
  [CONTENT_CACHE_TAGS.vocabulary],
);

const FALLBACK_WOTD: WordOfTheDay = {
  word: "serendipity",
  ipa: "/ˌser.ənˈdɪp.ə.ti/",
  partOfSpeech: "noun",
  level: "C1",
  meaningVi: "sự tình cờ may mắn",
  example: "Finding this quiet café was pure serendipity.",
  exampleHighlight: "serendipity",
};

function toWotd(row: WotdRow): WordOfTheDay {
  const example = row.examples[0]?.en ?? "";
  return {
    word: row.word,
    ipa: row.ipa,
    partOfSpeech: row.partOfSpeech,
    level: row.level as CefrLevel,
    meaningVi: row.meaningVi,
    example,
    exampleHighlight: row.word,
  };
}

export async function getWordOfTheDay(): Promise<WordOfTheDay> {
  const user = await getCurrentUser();
  const { today } = todayForUser(user, env.APP_TIMEZONE);
  const all = await loadSystemWordsForWotd();
  if (all.length === 0) return FALLBACK_WOTD;

  const level = user?.cefrLevel as CefrLevel | undefined;
  const preferred =
    level != null ? all.filter((w) => w.level === level) : [];
  const pool = preferred.length > 0 ? preferred : all;
  // Same calendar day (+ level pool) → same word for everyone in that pool.
  const key = `${today}|${level ?? "all"}`;
  const row = pool[pickIndex(key, pool.length)]!;
  return toWotd(row);
}

function grammarSubtitle(
  progressPercent: number,
  lastPosition: Record<string, unknown> | null,
): string {
  const section =
    typeof lastPosition?.section === "string" ? lastPosition.section : null;
  const sectionLabels: Record<string, string> = {
    structure: "Structure",
    examples: "Examples",
    mistakes: "Common mistakes",
    practice: "Practice",
  };
  const label = section ? (sectionLabels[section] ?? section) : "In progress";
  const step = Math.max(1, Math.min(5, Math.round(progressPercent / 20) || 1));
  return `Section ${step} of 5 · ${label}`;
}

export async function getContinueItems(
  level: CefrLevel | "all" = "all",
): Promise<ContinueItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db
    .select({
      contentKind: userLessonProgress.contentKind,
      contentId: userLessonProgress.contentId,
      progressPercent: userLessonProgress.progressPercent,
      lastPosition: userLessonProgress.lastPosition,
      updatedAt: userLessonProgress.updatedAt,
    })
    .from(userLessonProgress)
    .where(
      and(
        eq(userLessonProgress.userId, user.id),
        eq(userLessonProgress.status, "in_progress"),
        inArray(userLessonProgress.contentKind, ["grammar", "vocabulary_set"]),
      ),
    )
    .orderBy(desc(userLessonProgress.updatedAt))
    .limit(12);

  const grammarIds = rows
    .filter((r) => r.contentKind === "grammar")
    .map((r) => r.contentId);
  const setIds = rows
    .filter((r) => r.contentKind === "vocabulary_set")
    .map((r) => r.contentId);

  const [lessonRows, setRows, wordCounts, learnedCounts] = await Promise.all([
    grammarIds.length
      ? db
          .select({
            id: grammarLessons.id,
            slug: grammarLessons.slug,
            title: grammarLessons.title,
            level: grammarLessons.level,
          })
          .from(grammarLessons)
          .where(
            and(
              inArray(grammarLessons.id, grammarIds),
              eq(grammarLessons.status, "published"),
            ),
          )
      : Promise.resolve([]),
    setIds.length
      ? db
          .select({
            id: wordSets.id,
            title: wordSets.title,
            titleVi: wordSets.titleVi,
            level: wordSets.level,
          })
          .from(wordSets)
          .where(
            and(
              inArray(wordSets.id, setIds),
              or(
                isNotNull(wordSets.ownerId),
                eq(wordSets.status, "published"),
              ),
            ),
          )
      : Promise.resolve([]),
    setIds.length
      ? db
          .select({
            wordSetId: words.wordSetId,
            n: count(),
          })
          .from(words)
          .where(inArray(words.wordSetId, setIds))
          .groupBy(words.wordSetId)
      : Promise.resolve([]),
    setIds.length
      ? db
          .select({
            wordSetId: words.wordSetId,
            n: count(),
          })
          .from(userWordCards)
          .innerJoin(words, eq(words.id, userWordCards.wordId))
          .where(
            and(
              eq(userWordCards.userId, user.id),
              inArray(words.wordSetId, setIds),
            ),
          )
          .groupBy(words.wordSetId)
      : Promise.resolve([]),
  ]);

  const lessonMap = new Map(lessonRows.map((l) => [l.id, l]));
  const setMap = new Map(setRows.map((s) => [s.id, s]));
  const wordCountMap = new Map(
    wordCounts.map((w) => [w.wordSetId, Number(w.n)]),
  );
  const learnedMap = new Map(
    learnedCounts.map((w) => [w.wordSetId, Number(w.n)]),
  );

  const items: ContinueItem[] = [];
  for (const row of rows) {
    if (row.contentKind === "grammar") {
      const lesson = lessonMap.get(row.contentId);
      if (!lesson) continue;
      const itemLevel = lesson.level as CefrLevel;
      if (level !== "all" && itemLevel !== level) continue;
      items.push({
        id: `grammar:${lesson.id}`,
        kind: "grammar",
        title: lesson.title,
        subtitle: grammarSubtitle(
          row.progressPercent,
          row.lastPosition as Record<string, unknown> | null,
        ),
        level: itemLevel,
        progress: row.progressPercent,
        href: `/grammar/${lesson.slug}`,
      });
    } else if (row.contentKind === "vocabulary_set") {
      const set = setMap.get(row.contentId);
      if (!set) continue;
      const itemLevel = set.level as CefrLevel;
      if (level !== "all" && itemLevel !== level) continue;
      const total = wordCountMap.get(set.id) ?? 0;
      const learned = learnedMap.get(set.id) ?? 0;
      items.push({
        id: `vocab:${set.id}`,
        kind: "vocabulary",
        title: set.title,
        subtitle: `${learned} of ${total} words · ${set.titleVi}`,
        level: itemLevel,
        progress: row.progressPercent,
        href: "/vocabulary",
      });
    }
    if (items.length >= 3) break;
  }

  return items;
}

const loadCatalogStats = cacheContentQuery(
  async (): Promise<HomeCatalogStats> => {
    const [lessons, families, sets, wordCount] = await Promise.all([
      db
        .select({ n: count() })
        .from(grammarLessons)
        .where(eq(grammarLessons.status, "published")),
      db
        .select({ n: countDistinct(grammarLessons.familyId) })
        .from(grammarLessons)
        .where(eq(grammarLessons.status, "published")),
      db
        .select({ n: count() })
        .from(wordSets)
        .where(
          and(isNull(wordSets.ownerId), eq(wordSets.status, "published")),
        ),
      db
        .select({ n: count() })
        .from(words)
        .innerJoin(wordSets, eq(words.wordSetId, wordSets.id))
        .where(
          and(isNull(words.ownerId), eq(wordSets.status, "published")),
        ),
    ]);
    return {
      grammarLessons: Number(lessons[0]?.n ?? 0),
      grammarFamilies: Number(families[0]?.n ?? 0),
      wordSets: Number(sets[0]?.n ?? 0),
      words: Number(wordCount[0]?.n ?? 0),
    };
  },
  ["home-catalog-stats"],
  [CONTENT_CACHE_TAGS.catalog],
);

export async function getHomeCatalogStats(): Promise<HomeCatalogStats> {
  return loadCatalogStats();
}

export async function getSectionEntries(): Promise<SectionEntry[]> {
  const stats = await getHomeCatalogStats();
  return [
    {
      id: "grammar",
      title: "Grammar",
      subtitle: `${stats.grammarLessons} lessons · ${stats.grammarFamilies} families · Ngữ pháp`,
      href: "/grammar",
    },
    {
      id: "vocabulary",
      title: "Vocabulary",
      subtitle: `${stats.wordSets} word sets · ${stats.words.toLocaleString("en-US")} words · Từ vựng`,
      href: "/vocabulary",
    },
  ];
}

export async function getGreeting(
  now: Date = new Date(),
): Promise<Greeting> {
  const user = await getCurrentUser();
  const timezone = user?.timezone || env.APP_TIMEZONE;
  const userName = user?.firstName ?? "friend";
  const hour = localHour(now, timezone);
  if (hour < 12) {
    return { userName, en: "Good morning", vi: "Chào buổi sáng" };
  }
  if (hour < 18) {
    return { userName, en: "Good afternoon", vi: "Chào buổi chiều" };
  }
  return { userName, en: "Good evening", vi: "Chào buổi tối" };
}
