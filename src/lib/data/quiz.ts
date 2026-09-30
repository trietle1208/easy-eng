import "server-only";

import { and, asc, desc, eq, gt, ne, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  grammarLessons,
  quizAttempts,
  quizQuestions,
  quizzes,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { CONTENT_CACHE_TAGS } from "@/lib/data/cache-tags";
import { cacheContentQuery } from "@/lib/data/content-cache";
import {
  mapQuiz,
  mapQuizAttempt,
  toPublicQuiz,
  type QuizQuestionRow,
  type QuizRow,
} from "@/lib/data/mappers/quiz";
import {
  IDEMPOTENCY_WINDOW_MS,
  newEntityId,
  recordActivityEvent,
  upsertLessonProgress,
} from "@/lib/data/progress-write";
import { getGrammarDailyGoalLabels } from "@/lib/data/profile";
import type {
  Question,
  Quiz,
  QuizAnswersMap,
  QuizAnswerValue,
  QuizAttempt,
  QuizPublic,
  QuizResult,
  QuizReviewItem,
} from "@/types/quiz";

function toQuizRow(row: typeof quizzes.$inferSelect): QuizRow {
  return {
    slug: row.slug,
    title: row.title,
    kickEn: row.kickEn,
    kickVi: row.kickVi,
    breadcrumb: row.breadcrumb,
    level: row.level,
    descriptionEn: row.descriptionEn,
    descriptionVi: row.descriptionVi,
    timeLimitSeconds: row.timeLimitSeconds,
    passScore: row.passScore,
    questionTypes: row.questionTypes,
    lessonHref: row.lessonHref,
    nextHref: row.nextHref,
    nextLabel: row.nextLabel,
    encouragementEn: row.encouragementEn,
    encouragementVi: row.encouragementVi,
  };
}

const loadQuizBundle = cacheContentQuery(
  async (slug: string) => {
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.slug, slug), eq(quizzes.status, "published")))
      .limit(1);
    if (!quiz) return null;

    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quiz.id))
      .orderBy(asc(quizQuestions.sortOrder));

    return { quiz, questions };
  },
  ["quiz-bundle"],
  [CONTENT_CACHE_TAGS.quiz],
);

const loadFirstQuizSlug = cacheContentQuery(
  async () => {
    const [row] = await db
      .select({ slug: quizzes.slug })
      .from(quizzes)
      .where(eq(quizzes.status, "published"))
      .orderBy(asc(quizzes.createdAt))
      .limit(1);
    return row?.slug ?? null;
  },
  ["quiz-first-slug"],
  [CONTENT_CACHE_TAGS.quiz],
);

async function getQuizSecure(slug: string): Promise<Quiz | null> {
  const bundle = await loadQuizBundle(slug);
  if (!bundle) return null;

  const questionRows: QuizQuestionRow[] = bundle.questions.map((q) => ({
    id: q.id,
    sortOrder: q.sortOrder,
    type: q.type,
    instructionVi: q.instructionVi,
    promptVi: q.promptVi,
    hintEn: q.hintEn,
    explanationEn: q.explanationEn,
    explanationVi: q.explanationVi,
    reviewBefore: q.reviewBefore,
    reviewAfter: q.reviewAfter,
    payload: q.payload,
  }));

  return mapQuiz(toQuizRow(bundle.quiz), questionRows);
}

export async function getFirstQuizSlug(): Promise<string> {
  const slug = await loadFirstQuizSlug();
  if (!slug) throw new Error("No quizzes seeded");
  return slug;
}

/** Public quiz for the browser — answer keys stripped. */
export async function getQuiz(slug: string): Promise<QuizPublic | null> {
  const quiz = await getQuizSecure(slug);
  if (!quiz) return null;
  const user = await getCurrentUser();
  const name = user?.firstName ?? "friend";
  const personalized: Quiz = {
    ...quiz,
    encouragementEn: quiz.encouragementEn.replace(/\bLinh\b/g, name),
  };
  return toPublicQuiz(personalized);
}

async function loadLastFullAttempt(
  userId: string,
  quizId: string,
  quizSlug: string,
  excludeAttemptId?: string,
): Promise<QuizAttempt | null> {
  const filters: SQL[] = [
    eq(quizAttempts.userId, userId),
    eq(quizAttempts.quizId, quizId),
    eq(quizAttempts.isFullRun, true),
  ];
  if (excludeAttemptId) {
    filters.push(ne(quizAttempts.id, excludeAttemptId));
  }

  const [row] = await db
    .select()
    .from(quizAttempts)
    .where(and(...filters))
    .orderBy(desc(quizAttempts.completedAt))
    .limit(1);

  if (!row) return null;
  return mapQuizAttempt({
    quizSlug,
    score: row.score,
    total: row.total,
    passed: row.passed,
    timeUsedSeconds: row.timeUsedSeconds,
    accuracy: row.accuracy,
    answers: row.answers,
    completedAt: row.completedAt,
  });
}

export async function getLastAttempt(
  slug: string,
): Promise<QuizAttempt | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [quiz] = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(and(eq(quizzes.slug, slug), eq(quizzes.status, "published")))
    .limit(1);
  if (!quiz) return null;

  return loadLastFullAttempt(user.id, quiz.id, slug);
}

function typeLabel(q: Question): string {
  switch (q.type) {
    case "multiple_choice":
      return "Multiple choice";
    case "fill_blank":
      return "Fill in";
    case "correct_sentence":
      return "Sentence";
  }
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function displayGiven(q: Question, value: QuizAnswerValue): string {
  if (value === null || value === undefined || value === "") return "—";
  if (q.type === "fill_blank") return String(value).trim() || "—";
  const idx = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(idx) || idx < 0 || idx >= q.options.length) return "—";
  return q.options[idx]!;
}

function isCorrect(q: Question, value: QuizAnswerValue): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (q.type === "fill_blank") {
    return q.correctAnswers.map(normalize).includes(normalize(String(value)));
  }
  const idx = typeof value === "number" ? value : Number(value);
  return idx === q.correctIndex;
}

function correctDisplay(q: Question): string {
  if (q.type === "fill_blank") return q.displayAnswer;
  return q.options[q.correctIndex]!;
}

function buildReview(
  quiz: Quiz,
  questions: Question[],
  answers: QuizAnswersMap,
  questionIds?: string[],
): QuizReviewItem[] {
  return questions.map((q, index) => {
    const value = answers[q.id] ?? null;
    const given = displayGiven(q, value);
    const correct = correctDisplay(q);
    const ok = isCorrect(q, value);
    return {
      questionId: q.id,
      index: questionIds?.length
        ? quiz.questions.findIndex((qq) => qq.id === q.id) + 1
        : index + 1,
      typeLabel: typeLabel(q),
      isCorrect: ok,
      before: q.reviewBefore,
      given: ok ? correct : given,
      correct,
      after: q.reviewAfter,
      explanationEn: q.explanationEn,
      explanationVi: q.explanationVi,
    };
  });
}

function buildMessages(
  name: string,
  attempt: QuizAttempt,
  isFullRun: boolean,
  previous: QuizAttempt | null,
  score: number,
  total: number,
  mistakes: number,
) {
  const headlineEn = attempt.passed
    ? `Great job, ${name}!`
    : `Keep going, ${name}!`;
  const messageEn =
    attempt.passed &&
    isFullRun &&
    previous &&
    attempt.score > previous.score &&
    mistakes === 2
      ? "Your best score on this quiz so far. Two small slips — let's fix them below."
      : attempt.passed
        ? mistakes === 0
          ? "Perfect score — every answer correct!"
          : `You passed with ${mistakes} slip${mistakes === 1 ? "" : "s"} — review them below.`
        : `You scored ${score}/${total}. Review the mistakes and try again.`;

  const messageVi = attempt.passed
    ? mistakes === 0
      ? "Xuất sắc! Tất cả đều đúng."
      : `Làm tốt lắm! Xem lại ${mistakes} lỗi nhỏ bên dưới nhé.`
    : `Được ${score}/${total}. Xem lại lỗi và thử lại nhé.`;

  return { headlineEn, messageEn, messageVi };
}

async function completeLinkedGrammarLesson(
  userId: string,
  timezone: string,
  quizSlug: string,
  lessonHref: string,
  readMinutes: number | null,
): Promise<void> {
  const hrefSlug = lessonHref.startsWith("/grammar/")
    ? lessonHref.slice("/grammar/".length).split("/")[0] || null
    : null;

  const linkFilter = hrefSlug
    ? or(
        eq(grammarLessons.practiceQuizSlug, quizSlug),
        eq(grammarLessons.slug, hrefSlug),
      )
    : eq(grammarLessons.practiceQuizSlug, quizSlug);

  const lessons = await db
    .select({
      slug: grammarLessons.slug,
      readMinutes: grammarLessons.readMinutes,
    })
    .from(grammarLessons)
    .where(and(linkFilter, eq(grammarLessons.status, "published")));

  for (const lesson of lessons) {
    await upsertLessonProgress({
      userId,
      contentKind: "grammar",
      contentId: lesson.slug,
      status: "completed",
      progressPercent: 100,
    });
    await recordActivityEvent({
      userId,
      timezone,
      kind: "grammar_done",
      durationSeconds: (lesson.readMinutes || readMinutes || 5) * 60,
      ref: lesson.slug,
      payload: { viaQuiz: quizSlug },
    });
  }
}

async function resolveDailyGoalLabels(user: {
  id: string;
  timezone: string;
} | null): Promise<{ dailyGoalLabel: string; dailyGoalDetail: string }> {
  if (!user) {
    return {
      dailyGoalLabel: "0 / 2",
      dailyGoalDetail: "Sign in to track your grammar goal",
    };
  }
  return getGrammarDailyGoalLabels(user);
}

export async function submitQuiz(
  slug: string,
  answers: QuizAnswersMap,
  timeUsedSeconds: number,
  options?: { questionIds?: string[]; clientAttemptId?: string },
): Promise<QuizResult | null> {
  const bundle = await loadQuizBundle(slug);
  if (!bundle) return null;

  const quiz = await getQuizSecure(slug);
  if (!quiz) return null;

  const questions = options?.questionIds?.length
    ? quiz.questions.filter((q) => options.questionIds!.includes(q.id))
    : quiz.questions;

  if (!questions.length) return null;

  const isFullRun = !options?.questionIds?.length;
  const user = await getCurrentUser();
  const name = user?.firstName ?? "friend";

  // Idempotency: reuse an existing row for the same clientAttemptId
  if (user && options?.clientAttemptId) {
    const [existing] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.clientAttemptId, options.clientAttemptId),
        ),
      )
      .limit(1);
    if (existing) {
      const previous = isFullRun
        ? await loadLastFullAttempt(
            user.id,
            bundle.quiz.id,
            slug,
            existing.id,
          )
        : null;
      const review = buildReview(quiz, questions, answers, options.questionIds);
      const attempt = mapQuizAttempt({
        quizSlug: slug,
        score: existing.score,
        total: existing.total,
        passed: existing.passed,
        timeUsedSeconds: existing.timeUsedSeconds,
        accuracy: existing.accuracy,
        answers: existing.answers,
        completedAt: existing.completedAt,
      });
      const mistakes = attempt.total - attempt.score;
      const messages = buildMessages(
        name,
        attempt,
        isFullRun,
        previous,
        attempt.score,
        attempt.total,
        mistakes,
      );
      return {
        attempt,
        review,
        deltaVsLast:
          isFullRun && previous != null
            ? attempt.score - previous.score
            : null,
        lastScore: isFullRun ? (previous?.score ?? null) : null,
        lastTotal: isFullRun ? (previous?.total ?? null) : null,
        ...(await resolveDailyGoalLabels(user)),
        ...messages,
        progressSaved: true,
      };
    }
  }

  // Short time-window dedupe when clientAttemptId is missing
  if (user && !options?.clientAttemptId) {
    const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
    const [recent] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, user.id),
          eq(quizAttempts.quizId, bundle.quiz.id),
          eq(quizAttempts.isFullRun, isFullRun),
          gt(quizAttempts.completedAt, windowStart),
        ),
      )
      .orderBy(desc(quizAttempts.completedAt))
      .limit(1);
    if (
      recent &&
      JSON.stringify(recent.rawAnswers) === JSON.stringify(answers)
    ) {
      const previous = isFullRun
        ? await loadLastFullAttempt(
            user.id,
            bundle.quiz.id,
            slug,
            recent.id,
          )
        : null;
      const review = buildReview(quiz, questions, answers, options?.questionIds);
      const attempt = mapQuizAttempt({
        quizSlug: slug,
        score: recent.score,
        total: recent.total,
        passed: recent.passed,
        timeUsedSeconds: recent.timeUsedSeconds,
        accuracy: recent.accuracy,
        answers: recent.answers,
        completedAt: recent.completedAt,
      });
      const mistakes = attempt.total - attempt.score;
      const messages = buildMessages(
        name,
        attempt,
        isFullRun,
        previous,
        attempt.score,
        attempt.total,
        mistakes,
      );
      return {
        attempt,
        review,
        deltaVsLast:
          isFullRun && previous != null
            ? attempt.score - previous.score
            : null,
        lastScore: isFullRun ? (previous?.score ?? null) : null,
        lastTotal: isFullRun ? (previous?.total ?? null) : null,
        ...(await resolveDailyGoalLabels(user)),
        ...messages,
        progressSaved: true,
      };
    }
  }

  const previous =
    user && isFullRun
      ? await loadLastFullAttempt(user.id, bundle.quiz.id, slug)
      : null;

  const review = buildReview(quiz, questions, answers, options?.questionIds);
  const score = review.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const completedAt = new Date();
  const attempt: QuizAttempt = {
    slug,
    score,
    total,
    passed: score >= (isFullRun ? quiz.passScore : Math.ceil(total * 0.7)),
    timeUsedSeconds: Math.max(0, Math.round(timeUsedSeconds)),
    accuracy: total === 0 ? 0 : Math.round((score / total) * 100),
    answers: Object.fromEntries(
      questions.map((q) => [q.id, displayGiven(q, answers[q.id] ?? null)]),
    ),
    completedAt: completedAt.toISOString(),
  };

  let progressSaved = false;
  if (user) {
    const attemptId = newEntityId();
    try {
      await db.insert(quizAttempts).values({
        id: attemptId,
        userId: user.id,
        quizId: bundle.quiz.id,
        score: attempt.score,
        total: attempt.total,
        passed: attempt.passed,
        timeUsedSeconds: attempt.timeUsedSeconds,
        accuracy: attempt.accuracy,
        answers: attempt.answers,
        rawAnswers: answers,
        isFullRun,
        clientAttemptId: options?.clientAttemptId ?? null,
        completedAt,
      });
    } catch (err) {
      // Unique violation on clientAttemptId — treat as idempotent replay
      if (
        options?.clientAttemptId &&
        (err as { code?: string }).code === "23505"
      ) {
        return submitQuiz(slug, answers, timeUsedSeconds, options);
      }
      throw err;
    }

    await recordActivityEvent({
      userId: user.id,
      timezone: user.timezone,
      kind: "quiz_done",
      durationSeconds: attempt.timeUsedSeconds,
      ref: `${slug}:${attemptId}`,
      payload: {
        quizSlug: slug,
        score: attempt.score,
        total: attempt.total,
        passed: attempt.passed,
        isFullRun,
      },
    });

    if (isFullRun && attempt.passed) {
      await completeLinkedGrammarLesson(
        user.id,
        user.timezone,
        slug,
        quiz.lessonHref,
        null,
      );
    }

    progressSaved = true;
  }

  const mistakes = total - score;
  const messages = buildMessages(
    name,
    attempt,
    isFullRun,
    previous,
    score,
    total,
    mistakes,
  );

  return {
    attempt,
    review,
    deltaVsLast:
      isFullRun && previous != null ? attempt.score - previous.score : null,
    lastScore: isFullRun ? (previous?.score ?? null) : null,
    lastTotal: isFullRun ? (previous?.total ?? null) : null,
    ...(await resolveDailyGoalLabels(user)),
    ...messages,
    progressSaved,
  };
}
