import type { QuestionPublic, QuizAnswerValue } from "@/types/quiz";

/** Shared props for every quiz question type component. */
export type QuizQuestionProps<T extends QuestionPublic = QuestionPublic> = {
  question: T;
  index: number;
  total: number;
  value: QuizAnswerValue;
  onChange: (value: QuizAnswerValue) => void;
  showVietnamese: boolean;
  showHint: boolean;
  checked?: boolean;
};
