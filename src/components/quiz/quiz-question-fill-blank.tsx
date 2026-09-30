"use client";

import type { QuizQuestionProps } from "@/components/quiz/quiz-question-props";
import type { FillBlankQuestionPublic } from "@/types/quiz";

export function QuizQuestionFillBlank({
  question,
  index,
  value,
  onChange,
  showVietnamese,
  showHint,
}: QuizQuestionProps<FillBlankQuestionPublic>) {
  const text = typeof value === "string" ? value : "";

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-baseline gap-3">
        <span className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
          Question {index} · Fill in the blank
        </span>
        <span className="flex-1" />
        {showVietnamese ? (
          <span className="text-[15px] text-muted italic">
            {question.instructionVi}
          </span>
        ) : null}
      </div>

      <div className="pt-5 text-[30px] font-semibold leading-relaxed text-ink-2">
        {question.stemBefore ? `${question.stemBefore} ` : null}
        <span className="relative mx-2 inline-block w-[210px] align-baseline">
          <label htmlFor={`quiz-fill-${question.id}`} className="sr-only">
            Your answer
          </label>
          <input
            id={`quiz-fill-${question.id}`}
            autoComplete="off"
            spellCheck={false}
            value={text}
            onChange={(e) => onChange(e.target.value)}
            className="font-hand text-ink-write w-full border-0 bg-transparent px-1.5 pb-1 text-center text-[34px] leading-none outline-none focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-dashed focus-visible:outline-kick"
          />
          <svg
            viewBox="0 0 210 9"
            className="pointer-events-none absolute right-0 -bottom-0.5 left-0 h-[9px] w-full overflow-visible"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M2 5 C 40 2, 80 8, 120 4 S 180 3, 208 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="text-line"
            />
          </svg>
        </span>
        {question.verbHint ? (
          <span className="mx-1 font-medium text-accent">
            ({question.verbHint})
          </span>
        ) : null}{" "}
        {question.stemAfter}
      </div>

      {showVietnamese && question.promptVi ? (
        <p className="font-hand -mt-2.5 text-[21px] text-kick">
          {question.promptVi}
        </p>
      ) : null}

      {question.wordBank?.length ? (
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[15px] font-semibold text-muted">
            Use 1–3 words. Not sure? These forms are all real:
          </span>
          {question.wordBank.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onChange(w)}
              className="font-hand inline-flex h-10 items-center rounded-[10px] border-[1.5px] border-dashed border-line/45 bg-surface px-3.5 text-[22px] leading-none text-line"
            >
              {w}
            </button>
          ))}
        </div>
      ) : null}

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
