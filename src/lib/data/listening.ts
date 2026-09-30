import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  listeningDictationBlanks,
  listeningLessons,
  listeningTranscriptSentences,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/data/cache-tags";
import { cacheContentQuery } from "@/lib/data/content-cache";
import {
  mapDictationBlanksSecure,
  mapListeningLesson,
  mapListeningLessonSummary,
  type DictationBlankRow,
  type ListeningLessonRow,
  type TranscriptRow,
} from "@/lib/data/mappers/listening";
import {
  flagsFor,
  loadProgressFlags,
} from "@/lib/data/progress-flags";
import {
  recordActivityEvent,
  upsertLessonProgress,
} from "@/lib/data/progress-write";
import { getStorage } from "@/lib/storage";
import type {
  CheckDictationResult,
  ListeningLesson,
  ListeningLessonSummary,
  ListeningTopic,
} from "@/types/listening";
import type { CefrLevel } from "@/types/cefr";

export type ListeningFilters = {
  topic?: ListeningTopic | "all";
  level?: CefrLevel | "all";
};

function toLessonRow(
  row: typeof listeningLessons.$inferSelect,
): ListeningLessonRow {
  return {
    slug: row.slug,
    title: row.title,
    topic: row.topic,
    level: row.level,
    durationSeconds: row.durationSeconds,
    audioPath: row.audioPath,
    speakers: row.speakers,
    accent: row.accent,
    familyLabel: row.familyLabel,
  };
}

const loadAllLessons = cacheContentQuery(
  async () => {
    return db
      .select()
      .from(listeningLessons)
      .where(eq(listeningLessons.status, "published"))
      .orderBy(asc(listeningLessons.sortOrder));
  },
  ["listening-lessons-all"],
  [CONTENT_CACHE_TAGS.listening],
);

const loadLessonBundle = cacheContentQuery(
  async (slug: string) => {
    const [lesson] = await db
      .select()
      .from(listeningLessons)
      .where(
        and(
          eq(listeningLessons.slug, slug),
          eq(listeningLessons.status, "published"),
        ),
      )
      .limit(1);
    if (!lesson) return null;

    const [transcript, blanks] = await Promise.all([
      db
        .select()
        .from(listeningTranscriptSentences)
        .where(eq(listeningTranscriptSentences.lessonId, lesson.id))
        .orderBy(asc(listeningTranscriptSentences.sortOrder)),
      db
        .select()
        .from(listeningDictationBlanks)
        .where(eq(listeningDictationBlanks.lessonId, lesson.id))
        .orderBy(asc(listeningDictationBlanks.sortOrder)),
    ]);

    return { lesson, transcript, blanks };
  },
  ["listening-lesson-bundle"],
  [CONTENT_CACHE_TAGS.listening],
);

export async function getFirstListeningSlug(): Promise<string> {
  const rows = await loadAllLessons();
  if (!rows[0]) throw new Error("No listening lessons seeded");
  return rows[0].slug;
}

export async function getListeningLessons(
  filters: ListeningFilters = {},
): Promise<ListeningLessonSummary[]> {
  const topic = filters.topic ?? "all";
  const level = filters.level ?? "all";
  const rows = (await loadAllLessons()).filter(
    (l) =>
      (topic === "all" || l.topic === topic) &&
      (level === "all" || l.level === level),
  );

  const user = await getCurrentUser();
  const progress = user
    ? await loadProgressFlags(
        user.id,
        "listening",
        rows.map((r) => r.slug),
      )
    : new Map();

  return rows.map((r) => {
    const flags = flagsFor(progress, r.slug);
    return mapListeningLessonSummary(toLessonRow(r), {
      completed: flags.completed,
      inProgress: flags.inProgress || undefined,
    });
  });
}

export async function getListeningLesson(
  slug: string,
): Promise<ListeningLesson | null> {
  const bundle = await loadLessonBundle(slug);
  if (!bundle) return null;

  const user = await getCurrentUser();
  const progress = user
    ? await loadProgressFlags(user.id, "listening", [slug])
    : new Map();
  const flags = flagsFor(progress, slug);

  const transcript: TranscriptRow[] = bundle.transcript.map((s) => ({
    id: s.id,
    sortOrder: s.sortOrder,
    speaker: s.speaker,
    text: s.text,
    startMs: s.startMs,
    endMs: s.endMs,
  }));
  const blanks: DictationBlankRow[] = bundle.blanks.map((b) => ({
    id: b.id,
    sortOrder: b.sortOrder,
    promptBefore: b.promptBefore,
    promptAfter: b.promptAfter,
    answer: b.answer,
    accept: b.accept,
  }));

  const audioSrc = getStorage().publicUrl(bundle.lesson.audioPath);

  return mapListeningLesson(
    toLessonRow(bundle.lesson),
    transcript,
    blanks,
    audioSrc,
    {
      completed: flags.completed,
      inProgress: flags.inProgress || undefined,
    },
  );
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[.,!?]/g, "");
}

export async function checkDictation(
  slug: string,
  answers: Record<string, string>,
): Promise<CheckDictationResult | null> {
  const bundle = await loadLessonBundle(slug);
  if (!bundle) return null;

  const blanks = mapDictationBlanksSecure(
    bundle.blanks.map((b) => ({
      id: b.id,
      sortOrder: b.sortOrder,
      promptBefore: b.promptBefore,
      promptAfter: b.promptAfter,
      answer: b.answer,
      accept: b.accept,
    })),
    bundle.lesson.slug,
  );

  const results = blanks.map((blank) => {
    const given = answers[blank.id] ?? "";
    const accepted = [blank.answer, ...(blank.accept ?? [])].map(normalize);
    const isCorrect = accepted.includes(normalize(given));
    return {
      blankId: blank.id,
      given,
      answer: blank.answer,
      isCorrect,
    };
  });

  const score = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const completed = total > 0 && score === total;

  const user = await getCurrentUser();
  let progressSaved = false;
  if (user) {
    await upsertLessonProgress({
      userId: user.id,
      contentKind: "listening",
      contentId: slug,
      status: completed ? "completed" : "in_progress",
      progressPercent: total === 0 ? 0 : Math.round((score / total) * 100),
      lastPosition: { score, total },
    });
    if (completed) {
      await recordActivityEvent({
        userId: user.id,
        timezone: user.timezone,
        kind: "listening_done",
        durationSeconds: bundle.lesson.durationSeconds,
        ref: slug,
        payload: { score, total },
      });
    }
    progressSaved = true;
  }

  return {
    results,
    score,
    total,
    progressSaved,
  };
}
