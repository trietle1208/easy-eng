import type { CefrLevel } from "@/types/cefr";

export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "correct_sentence";

export type QuestionBase = {
  id: string;
  type: QuestionType;
  /** Short VI instruction shown top-right when hints are on */
  instructionVi: string;
  promptVi?: string;
  hintEn?: string;
  explanationEn: string;
  explanationVi: string;
  /** Review row stem pieces around the answer token */
  reviewBefore: string;
  reviewAfter: string;
};

export type MultipleChoiceQuestion = QuestionBase & {
  type: "multiple_choice";
  stemBefore: string;
  stemAfter: string;
  options: string[];
  correctIndex: number;
};

export type FillBlankQuestion = QuestionBase & {
  type: "fill_blank";
  stemBefore: string;
  stemAfter: string;
  verbHint?: string;
  wordBank?: string[];
  /** Accepted answers (case-insensitive) */
  correctAnswers: string[];
  displayAnswer: string;
};

export type CorrectSentenceQuestion = QuestionBase & {
  type: "correct_sentence";
  promptEn: string;
  options: string[];
  correctIndex: number;
};

export type Question =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | CorrectSentenceQuestion;

/** Public MC — no correctIndex. */
export type MultipleChoiceQuestionPublic = Omit<
  MultipleChoiceQuestion,
  "correctIndex"
>;

/** Public fill — no correctAnswers / displayAnswer. */
export type FillBlankQuestionPublic = Omit<
  FillBlankQuestion,
  "correctAnswers" | "displayAnswer"
>;

/** Public sentence — no correctIndex. */
export type CorrectSentenceQuestionPublic = Omit<
  CorrectSentenceQuestion,
  "correctIndex"
>;

export type QuestionPublic =
  | MultipleChoiceQuestionPublic
  | FillBlankQuestionPublic
  | CorrectSentenceQuestionPublic;

export type QuizQuestionTypeTag = {
  id: QuestionType;
  label: string;
};

export type Quiz = {
  slug: string;
  title: string;
  kickEn: string;
  kickVi: string;
  breadcrumb: string;
  level: CefrLevel;
  descriptionEn: string;
  descriptionVi: string;
  timeLimitSeconds: number;
  passScore: number;
  questionTypes: QuizQuestionTypeTag[];
  lessonHref: string;
  nextHref: string;
  nextLabel: string;
  encouragementEn: string;
  encouragementVi: string;
  questions: Question[];
};

/** Public quiz payload for the browser — questions without answer keys. */
export type QuizPublic = Omit<Quiz, "questions"> & {
  questions: QuestionPublic[];
};

export type QuizAttempt = {
  slug: string;
  score: number;
  total: number;
  passed: boolean;
  timeUsedSeconds: number;
  accuracy: number;
  /** Display-ready given answer per question id */
  answers: Record<string, string>;
  completedAt: string;
};

export type QuizReviewItem = {
  questionId: string;
  index: number;
  typeLabel: string;
  isCorrect: boolean;
  before: string;
  given: string;
  correct: string;
  after: string;
  explanationEn: string;
  explanationVi: string;
};

export type QuizResult = {
  attempt: QuizAttempt;
  review: QuizReviewItem[];
  deltaVsLast: number | null;
  lastScore: number | null;
  lastTotal: number | null;
  dailyGoalLabel: string;
  dailyGoalDetail: string;
  headlineEn: string;
  messageEn: string;
  messageVi: string;
  /** False for anonymous callers — UI can invite them to sign in. */
  progressSaved: boolean;
};

/** Stored answer: option index for MC/sentence, free text for fill */
export type QuizAnswerValue = number | string | null;

export type QuizAnswersMap = Record<string, QuizAnswerValue>;
