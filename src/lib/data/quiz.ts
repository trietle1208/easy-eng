import {
  FIRST_QUIZ_SLUG,
  mockQuizzes,
  seedLastAttempts,
} from "@/lib/mock/quiz";
import type {
  Quiz,
  QuizAnswersMap,
  QuizAnswerValue,
  QuizAttempt,
  QuizResult,
  QuizReviewItem,
  Question,
} from "@/types/quiz";

const lastAttempts: Record<string, QuizAttempt> = { ...seedLastAttempts };

export async function getFirstQuizSlug(): Promise<string> {
  return FIRST_QUIZ_SLUG;
}

export async function getQuiz(slug: string): Promise<Quiz | null> {
  return mockQuizzes.find((q) => q.slug === slug) ?? null;
}

export async function getLastAttempt(
  slug: string,
): Promise<QuizAttempt | null> {
  return lastAttempts[slug] ?? null;
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

export async function submitQuiz(
  slug: string,
  answers: QuizAnswersMap,
  timeUsedSeconds: number,
  options?: { questionIds?: string[] },
): Promise<QuizResult | null> {
  const quiz = await getQuiz(slug);
  if (!quiz) return null;

  const previous = lastAttempts[slug] ?? null;
  const questions = options?.questionIds?.length
    ? quiz.questions.filter((q) => options.questionIds!.includes(q.id))
    : quiz.questions;

  if (!questions.length) return null;

  const review: QuizReviewItem[] = questions.map((q, index) => {
    const value = answers[q.id] ?? null;
    const given = displayGiven(q, value);
    const correct = correctDisplay(q);
    const ok = isCorrect(q, value);
    return {
      questionId: q.id,
      index: options?.questionIds?.length
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

  const score = review.filter((r) => r.isCorrect).length;
  const total = questions.length;
  const isFullRun = !options?.questionIds?.length;
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
    completedAt: new Date().toISOString(),
  };

  // Only replace last attempt for full runs
  if (isFullRun) {
    lastAttempts[slug] = attempt;
  }

  const deltaVsLast =
    isFullRun && previous != null ? attempt.score - previous.score : null;

  const mistakes = total - score;
  const headlineEn = attempt.passed
    ? "Great job, Linh!"
    : "Keep going, Linh!";
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

  return {
    attempt,
    review,
    deltaVsLast,
    lastScore: isFullRun ? (previous?.score ?? null) : null,
    lastTotal: isFullRun ? (previous?.total ?? null) : null,
    dailyGoalLabel: "2 / 2",
    dailyGoalDetail: "grammar goal done today",
    headlineEn,
    messageEn,
    messageVi,
  };
}

export function formatQuizDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatTimer(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
