import type { CefrLevel } from "@/types/cefr";
import type {
  CorrectSentenceQuestion,
  FillBlankQuestion,
  MultipleChoiceQuestion,
  Question,
  QuestionPublic,
  QuestionType,
  Quiz,
  QuizAttempt,
  QuizPublic,
  QuizQuestionTypeTag,
} from "@/types/quiz";

export type QuizRow = {
  slug: string;
  title: string;
  kickEn: string;
  kickVi: string;
  breadcrumb: string;
  level: string;
  descriptionEn: string;
  descriptionVi: string;
  timeLimitSeconds: number;
  passScore: number;
  questionTypes: { id: string; label: string }[];
  lessonHref: string;
  nextHref: string;
  nextLabel: string;
  encouragementEn: string;
  encouragementVi: string;
};

export type QuizQuestionRow = {
  id: string;
  sortOrder: number;
  type: string;
  instructionVi: string;
  promptVi: string | null;
  hintEn: string | null;
  explanationEn: string;
  explanationVi: string;
  reviewBefore: string;
  reviewAfter: string;
  payload: Record<string, unknown>;
};

export type QuizAttemptRow = {
  quizSlug: string;
  score: number;
  total: number;
  passed: boolean;
  timeUsedSeconds: number;
  accuracy: number;
  answers: Record<string, string>;
  completedAt: Date;
};

function localQuestionId(id: string, quizSlug: string): string {
  const prefix = `${quizSlug}:`;
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

export function mapQuizQuestion(
  row: QuizQuestionRow,
  quizSlug: string,
): Question {
  const base = {
    id: localQuestionId(row.id, quizSlug),
    instructionVi: row.instructionVi,
    promptVi: row.promptVi ?? undefined,
    hintEn: row.hintEn ?? undefined,
    explanationEn: row.explanationEn,
    explanationVi: row.explanationVi,
    reviewBefore: row.reviewBefore,
    reviewAfter: row.reviewAfter,
  };
  const p = row.payload;

  if (row.type === "multiple_choice") {
    const q: MultipleChoiceQuestion = {
      ...base,
      type: "multiple_choice",
      stemBefore: String(p.stemBefore ?? ""),
      stemAfter: String(p.stemAfter ?? ""),
      options: (p.options as string[]) ?? [],
      correctIndex: Number(p.correctIndex ?? 0),
    };
    return q;
  }

  if (row.type === "fill_blank") {
    const q: FillBlankQuestion = {
      ...base,
      type: "fill_blank",
      stemBefore: String(p.stemBefore ?? ""),
      stemAfter: String(p.stemAfter ?? ""),
      verbHint: p.verbHint ? String(p.verbHint) : undefined,
      wordBank: (p.wordBank as string[] | undefined) ?? undefined,
      correctAnswers: (p.correctAnswers as string[]) ?? [],
      displayAnswer: String(p.displayAnswer ?? ""),
    };
    return q;
  }

  const q: CorrectSentenceQuestion = {
    ...base,
    type: "correct_sentence",
    promptEn: String(p.promptEn ?? ""),
    options: (p.options as string[]) ?? [],
    correctIndex: Number(p.correctIndex ?? 0),
  };
  return q;
}

export function mapQuiz(row: QuizRow, questions: QuizQuestionRow[]): Quiz {
  return {
    slug: row.slug,
    title: row.title,
    kickEn: row.kickEn,
    kickVi: row.kickVi,
    breadcrumb: row.breadcrumb,
    level: row.level as CefrLevel,
    descriptionEn: row.descriptionEn,
    descriptionVi: row.descriptionVi,
    timeLimitSeconds: row.timeLimitSeconds,
    passScore: row.passScore,
    questionTypes: row.questionTypes.map(
      (t): QuizQuestionTypeTag => ({
        id: t.id as QuestionType,
        label: t.label,
      }),
    ),
    lessonHref: row.lessonHref,
    nextHref: row.nextHref,
    nextLabel: row.nextLabel,
    encouragementEn: row.encouragementEn,
    encouragementVi: row.encouragementVi,
    questions: questions
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((q) => mapQuizQuestion(q, row.slug)),
  };
}

export function toPublicQuestion(q: Question): QuestionPublic {
  if (q.type === "multiple_choice") {
    return {
      id: q.id,
      type: q.type,
      instructionVi: q.instructionVi,
      promptVi: q.promptVi,
      hintEn: q.hintEn,
      explanationEn: q.explanationEn,
      explanationVi: q.explanationVi,
      reviewBefore: q.reviewBefore,
      reviewAfter: q.reviewAfter,
      stemBefore: q.stemBefore,
      stemAfter: q.stemAfter,
      options: q.options,
    };
  }
  if (q.type === "fill_blank") {
    return {
      id: q.id,
      type: q.type,
      instructionVi: q.instructionVi,
      promptVi: q.promptVi,
      hintEn: q.hintEn,
      explanationEn: q.explanationEn,
      explanationVi: q.explanationVi,
      reviewBefore: q.reviewBefore,
      reviewAfter: q.reviewAfter,
      stemBefore: q.stemBefore,
      stemAfter: q.stemAfter,
      verbHint: q.verbHint,
      wordBank: q.wordBank,
    };
  }
  return {
    id: q.id,
    type: q.type,
    instructionVi: q.instructionVi,
    promptVi: q.promptVi,
    hintEn: q.hintEn,
    explanationEn: q.explanationEn,
    explanationVi: q.explanationVi,
    reviewBefore: q.reviewBefore,
    reviewAfter: q.reviewAfter,
    promptEn: q.promptEn,
    options: q.options,
  };
}

export function toPublicQuiz(quiz: Quiz): QuizPublic {
  return {
    ...quiz,
    questions: quiz.questions.map(toPublicQuestion),
  };
}

export function mapQuizAttempt(row: QuizAttemptRow): QuizAttempt {
  return {
    slug: row.quizSlug,
    score: row.score,
    total: row.total,
    passed: row.passed,
    timeUsedSeconds: row.timeUsedSeconds,
    accuracy: row.accuracy,
    answers: row.answers,
    completedAt: row.completedAt.toISOString(),
  };
}
