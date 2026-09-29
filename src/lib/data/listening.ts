import {
  FIRST_LISTENING_SLUG,
  mockListeningLessons,
} from "@/lib/mock/listening";
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

export async function getFirstListeningSlug(): Promise<string> {
  return FIRST_LISTENING_SLUG;
}

export async function getListeningLessons(
  filters: ListeningFilters = {},
): Promise<ListeningLessonSummary[]> {
  const topic = filters.topic ?? "all";
  const level = filters.level ?? "all";
  return mockListeningLessons
    .filter(
      (l) =>
        (topic === "all" || l.topic === topic) &&
        (level === "all" || l.level === level),
    )
    .map(
      ({
        slug,
        title,
        topic,
        level,
        durationSeconds,
        completed,
        inProgress,
      }) => ({
        slug,
        title,
        topic,
        level,
        durationSeconds,
        completed,
        inProgress,
      }),
    );
}

export async function getListeningLesson(
  slug: string,
): Promise<ListeningLesson | null> {
  return mockListeningLessons.find((l) => l.slug === slug) ?? null;
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[.,!?]/g, "");
}

export async function checkDictation(
  slug: string,
  answers: Record<string, string>,
): Promise<CheckDictationResult | null> {
  const lesson = await getListeningLesson(slug);
  if (!lesson) return null;

  const results = lesson.blanks.map((blank) => {
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

  return {
    results,
    score: results.filter((r) => r.isCorrect).length,
    total: results.length,
  };
}
