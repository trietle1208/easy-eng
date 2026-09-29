import {
  FIRST_READING_SLUG,
  mockPassages,
  readingProgress,
} from "@/lib/mock/reading";
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

export async function getFirstReadingSlug(): Promise<string> {
  return FIRST_READING_SLUG;
}

export async function getPassages(
  filters: ReadingFilters = {},
): Promise<ReadingPassageSummary[]> {
  const topic = filters.topic ?? "all";
  const level = filters.level ?? "all";
  return mockPassages
    .filter((p) => (topic === "all" || p.topic === topic) && (level === "all" || p.level === level))
    .map(
      ({
        slug,
        title,
        topic,
        level,
        minutes,
        completed,
        inProgress,
      }) => ({
        slug,
        title,
        topic,
        level,
        minutes,
        completed,
        inProgress,
      }),
    );
}

export async function getPassage(slug: string): Promise<ReadingPassage | null> {
  return mockPassages.find((p) => p.slug === slug) ?? null;
}

export async function getReadingProgress() {
  return readingProgress;
}

export async function checkReadingAnswers(
  slug: string,
  answers: Record<string, number | null>,
): Promise<CheckReadingAnswersResult | null> {
  const passage = await getPassage(slug);
  if (!passage) return null;

  const results = passage.questions.map((q) => {
    const selectedIndex =
      answers[q.id] === undefined ? null : answers[q.id];
    return {
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect: selectedIndex === q.correctIndex,
    };
  });

  return {
    results,
    score: results.filter((r) => r.isCorrect).length,
    total: results.length,
  };
}
