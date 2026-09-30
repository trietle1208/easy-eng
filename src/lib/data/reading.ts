import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  readingParagraphs,
  readingPassages,
  readingQuestions,
  readingVocabHighlights,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/data/cache-tags";
import { cacheContentQuery } from "@/lib/data/content-cache";
import {
  mapReadingPassage,
  mapReadingPassageSummary,
  mapReadingQuestionsSecure,
  type ReadingParagraphRow,
  type ReadingPassageRow,
  type ReadingQuestionRow,
  type ReadingVocabRow,
} from "@/lib/data/mappers/reading";
import {
  flagsFor,
  loadProgressFlags,
} from "@/lib/data/progress-flags";
import {
  recordActivityEvent,
  upsertLessonProgress,
} from "@/lib/data/progress-write";
import type {
  CheckReadingAnswersResult,
  ReadingPassage,
  ReadingPassageSummary,
  ReadingTopic,
} from "@/types/reading";
import type { CefrLevel } from "@/types/cefr";

export type ReadingFilters = {
  topic?: ReadingTopic | "all";
  level?: CefrLevel | "all";
};

function toPassageRow(
  row: typeof readingPassages.$inferSelect,
): ReadingPassageRow {
  return {
    slug: row.slug,
    title: row.title,
    topic: row.topic,
    level: row.level,
    minutes: row.minutes,
    wordCount: row.wordCount,
    newWordCount: row.newWordCount,
    familyLabel: row.familyLabel,
    sortOrder: row.sortOrder,
  };
}

const loadAllPassages = cacheContentQuery(
  async () => {
    return db
      .select()
      .from(readingPassages)
      .where(eq(readingPassages.status, "published"))
      .orderBy(asc(readingPassages.sortOrder));
  },
  ["reading-passages-all"],
  [CONTENT_CACHE_TAGS.reading],
);

const loadPassageBundle = cacheContentQuery(
  async (slug: string) => {
    const [passage] = await db
      .select()
      .from(readingPassages)
      .where(
        and(
          eq(readingPassages.slug, slug),
          eq(readingPassages.status, "published"),
        ),
      )
      .limit(1);
    if (!passage) return null;

    const [paragraphs, vocabulary, questions, topicPeers] = await Promise.all([
      db
        .select()
        .from(readingParagraphs)
        .where(eq(readingParagraphs.passageId, passage.id))
        .orderBy(asc(readingParagraphs.sortOrder)),
      db
        .select()
        .from(readingVocabHighlights)
        .where(eq(readingVocabHighlights.passageId, passage.id)),
      db
        .select()
        .from(readingQuestions)
        .where(eq(readingQuestions.passageId, passage.id))
        .orderBy(asc(readingQuestions.sortOrder)),
      db
        .select({ slug: readingPassages.slug })
        .from(readingPassages)
        .where(
          and(
            eq(readingPassages.topic, passage.topic),
            eq(readingPassages.status, "published"),
          ),
        )
        .orderBy(asc(readingPassages.sortOrder)),
    ]);

    return { passage, paragraphs, vocabulary, questions, topicPeers };
  },
  ["reading-passage-bundle"],
  [CONTENT_CACHE_TAGS.reading],
);

export async function getFirstReadingSlug(): Promise<string> {
  const rows = await loadAllPassages();
  if (!rows[0]) throw new Error("No reading passages seeded");
  return rows[0].slug;
}

export async function getPassages(
  filters: ReadingFilters = {},
): Promise<ReadingPassageSummary[]> {
  const topic = filters.topic ?? "all";
  const level = filters.level ?? "all";
  const rows = (await loadAllPassages()).filter(
    (p) =>
      (topic === "all" || p.topic === topic) &&
      (level === "all" || p.level === level),
  );

  const user = await getCurrentUser();
  const progress = user
    ? await loadProgressFlags(
        user.id,
        "reading",
        rows.map((r) => r.slug),
      )
    : new Map();

  return rows.map((r) => {
    const flags = flagsFor(progress, r.slug);
    return mapReadingPassageSummary(toPassageRow(r), {
      completed: flags.completed,
      inProgress: flags.inProgress || undefined,
    });
  });
}

export async function getPassage(slug: string): Promise<ReadingPassage | null> {
  const bundle = await loadPassageBundle(slug);
  if (!bundle) return null;

  const user = await getCurrentUser();
  const progress = user
    ? await loadProgressFlags(user.id, "reading", [slug])
    : new Map();
  const flags = flagsFor(progress, slug);

  const paragraphs: ReadingParagraphRow[] = bundle.paragraphs.map((p) => ({
    id: p.id,
    sortOrder: p.sortOrder,
    vi: p.vi,
    segments: p.segments,
  }));
  const vocabulary: ReadingVocabRow[] = bundle.vocabulary.map((v) => ({
    id: v.id,
    word: v.word,
    ipa: v.ipa,
    partOfSpeech: v.partOfSpeech,
    meaningVi: v.meaningVi,
    level: v.level,
  }));
  const questions: ReadingQuestionRow[] = bundle.questions.map((q) => ({
    id: q.id,
    sortOrder: q.sortOrder,
    prompt: q.prompt,
    choices: q.choices,
    correctIndex: q.correctIndex,
  }));

  return mapReadingPassage(
    toPassageRow(bundle.passage),
    paragraphs,
    vocabulary,
    questions,
    bundle.topicPeers,
    {
      completed: flags.completed,
      inProgress: flags.inProgress || undefined,
    },
  );
}

export async function getReadingProgress() {
  const rows = await loadAllPassages();
  const total = rows.length;
  const user = await getCurrentUser();
  if (!user) return { done: 0, total };

  const progress = await loadProgressFlags(
    user.id,
    "reading",
    rows.map((r) => r.slug),
  );
  const done = [...progress.values()].filter((f) => f.completed).length;
  return { done, total };
}

export async function checkReadingAnswers(
  slug: string,
  answers: Record<string, number | null>,
): Promise<CheckReadingAnswersResult | null> {
  const bundle = await loadPassageBundle(slug);
  if (!bundle) return null;

  const secure = mapReadingQuestionsSecure(
    bundle.questions.map((q) => ({
      id: q.id,
      sortOrder: q.sortOrder,
      prompt: q.prompt,
      choices: q.choices,
      correctIndex: q.correctIndex,
    })),
    bundle.passage.slug,
  );

  const results = secure.map((q) => {
    const selectedIndex =
      answers[q.id] === undefined ? null : answers[q.id];
    return {
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect: selectedIndex === q.correctIndex,
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
      contentKind: "reading",
      contentId: slug,
      status: completed ? "completed" : "in_progress",
      progressPercent: total === 0 ? 0 : Math.round((score / total) * 100),
      lastPosition: { score, total },
    });
    if (completed) {
      await recordActivityEvent({
        userId: user.id,
        timezone: user.timezone,
        kind: "reading_done",
        durationSeconds: bundle.passage.minutes * 60,
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
