"use client";

import { QuizQuestionCorrectSentence } from "@/components/quiz/quiz-question-correct-sentence";
import { QuizQuestionFillBlank } from "@/components/quiz/quiz-question-fill-blank";
import { QuizQuestionMultipleChoice } from "@/components/quiz/quiz-question-multiple-choice";
import type { QuizQuestionProps } from "@/components/quiz/quiz-question-props";

export function QuizQuestionView(props: QuizQuestionProps) {
  const { question } = props;
  switch (question.type) {
    case "multiple_choice":
      return (
        <QuizQuestionMultipleChoice
          {...props}
          question={question}
        />
      );
    case "fill_blank":
      return <QuizQuestionFillBlank {...props} question={question} />;
    case "correct_sentence":
      return (
        <QuizQuestionCorrectSentence {...props} question={question} />
      );
  }
}
