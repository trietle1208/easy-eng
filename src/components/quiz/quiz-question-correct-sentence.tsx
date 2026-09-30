"use client";

import { QuizOptionButton } from "@/components/quiz/quiz-option-button";
import type { QuizQuestionProps } from "@/components/quiz/quiz-question-props";
import type { CorrectSentenceQuestionPublic } from "@/types/quiz";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizQuestionCorrectSentence({
  question,
  index,
  value,
  onChange,
  showVietnamese,
  showHint,
}: QuizQuestionProps<CorrectSentenceQuestionPublic>) {
  const selected =
    typeof value === "number" ? value : value === null ? null : Number(value);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline gap-3">
        <span className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
          Question {index} · Choose the correct sentence
        </span>
        <span className="flex-1" />
        {showVietnamese ? (
          <span className="text-[15px] text-muted italic">
            {question.instructionVi}
          </span>
        ) : null}
      </div>

      <div className="text-[28px] font-semibold leading-snug text-ink-2">
        {question.promptEn}
      </div>

      {showVietnamese && question.promptVi ? (
        <p className="font-hand -mt-2 text-[21px] text-kick">
          {question.promptVi}
        </p>
      ) : null}

      <div
        role="radiogroup"
        aria-label="Sentences"
        className="flex flex-col gap-3"
      >
        {question.options.map((opt, i) => (
          <QuizOptionButton
            key={opt}
            letter={LETTERS[i] ?? String(i + 1)}
            label={opt}
            selected={selected === i}
            onSelect={() => onChange(i)}
          />
        ))}
      </div>

      {showHint && question.hintEn ? (
        <div
          className="relative max-w-[580px] self-start rounded-[2px_2px_14px] bg-sticky px-5 pt-5 pb-4 shadow-[var(--sticky-shadow)]"
          style={{ transform: "rotate(-1.2deg)" }}
        >
          <span
            className="pointer-events-none absolute -top-3 left-1/2 h-6 w-20 -ml-10 -rotate-4 border border-white/50 bg-[rgba(255,250,235,.62)] shadow-[0_1px_2px_rgba(0,0,0,.08)]"
            aria-hidden
          />
          <p className="font-hand m-0 text-[22px] leading-snug text-ink-2">
            Hint: {question.hintEn}
          </p>
        </div>
      ) : null}
    </div>
  );
}
