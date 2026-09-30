"use client";

import { QuizOptionButton } from "@/components/quiz/quiz-option-button";
import type { QuizQuestionProps } from "@/components/quiz/quiz-question-props";
import type { MultipleChoiceQuestionPublic } from "@/types/quiz";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizQuestionMultipleChoice({
  question,
  index,
  value,
  onChange,
  showVietnamese,
  showHint,
}: QuizQuestionProps<MultipleChoiceQuestionPublic>) {
  const selected =
    typeof value === "number" ? value : value === null ? null : Number(value);

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-baseline gap-3">
        <span className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
          Question {index} · Multiple choice
        </span>
        <span className="flex-1" />
        {showVietnamese ? (
          <span className="text-[15px] text-muted italic">
            {question.instructionVi}
          </span>
        ) : null}
      </div>

      <div className="text-[30px] font-semibold leading-snug text-ink-2">
        {question.stemBefore}
        <span
          className="relative mx-1.5 inline-block h-[30px] w-[150px] align-[-4px]"
          aria-hidden
        >
          <svg
            viewBox="0 0 150 8"
            className="absolute right-0 bottom-0 left-0 h-2 w-full overflow-visible"
            preserveAspectRatio="none"
          >
            <path
              d="M2 5 C 30 2, 60 7, 90 4 S 130 3, 148 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="text-line"
            />
          </svg>
        </span>
        {question.stemAfter}
      </div>

      {showVietnamese && question.promptVi ? (
        <p className="font-hand -mt-2.5 text-[21px] text-kick">
          {question.promptVi}
        </p>
      ) : null}

      <div
        role="radiogroup"
        aria-label="Answer options"
        className="grid grid-cols-1 gap-3.5 sm:grid-cols-2"
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
