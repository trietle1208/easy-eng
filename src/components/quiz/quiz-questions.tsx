"use client";

import { Lightbulb, X } from "lucide-react";

import { Mascot } from "@/components/mascot/mascot";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { QuizPencilProgress } from "@/components/quiz/quiz-pencil-progress";
import { QuizQuestionView } from "@/components/quiz/quiz-question-view";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { formatTimer } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  QuestionPublic,
  QuizAnswerValue,
  QuizAnswersMap,
  QuizPublic,
} from "@/types/quiz";

type QuizQuestionsProps = {
  quiz: QuizPublic;
  currentIndex: number;
  answers: QuizAnswersMap;
  secondsLeft: number;
  showVietnamese: boolean;
  showHint: boolean;
  onQuit: () => void;
  onSelectIndex: (index: number) => void;
  onChangeAnswer: (questionId: string, value: QuizAnswerValue) => void;
  onToggleHint: () => void;
  onSkip: () => void;
  onCheck: () => void;
  isLast: boolean;
};

function hasAnswer(q: QuestionPublic, value: QuizAnswerValue): boolean {
  if (value === null || value === undefined) return false;
  if (q.type === "fill_blank") return String(value).trim().length > 0;
  return typeof value === "number" && !Number.isNaN(value) && value >= 0;
}

export function QuizQuestions({
  quiz,
  currentIndex,
  answers,
  secondsLeft,
  showVietnamese,
  showHint,
  onQuit,
  onSelectIndex,
  onChangeAnswer,
  onToggleHint,
  onSkip,
  onCheck,
  isLast,
}: QuizQuestionsProps) {
  const question = quiz.questions[currentIndex]!;
  const value = answers[question.id] ?? null;
  const answeredTotal = quiz.questions.filter((q) =>
    hasAnswer(q, answers[q.id] ?? null),
  ).length;
  const visitedWithoutAnswer = quiz.questions.filter((q, i) => {
    if (i > currentIndex) return false;
    return !hasAnswer(q, answers[q.id] ?? null);
  }).length;
  const lowTime = secondsLeft <= 60;

  return (
    <div className="flex flex-col gap-3.5 text-on-glass">
      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onQuit}
          className="gap-2"
        >
          <X className="size-4" aria-hidden />
          Quit
        </Button>
        <span className="font-hand text-[30px] leading-none">{quiz.title}</span>
        <LevelBadge level={quiz.level} />
        <span className="flex-1" />
        <span className="font-hand text-[28px] leading-none">
          Question{" "}
          <span className="text-headline">{currentIndex + 1}</span> /{" "}
          {quiz.questions.length}
        </span>
        <span
          role="timer"
          aria-label={`Time left ${formatTimer(secondsLeft)}`}
          className={cn(
            "inline-flex h-[46px] items-center gap-2 rounded-[14px] border border-soft-border bg-soft px-4 text-on-glass",
            lowTime &&
              "border-notif bg-[color-mix(in_srgb,var(--notif)_18%,transparent)]",
          )}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 1.5" />
            <path d="M9 2h6" />
          </svg>
          <span className="font-mono text-xl font-bold">
            {formatTimer(secondsLeft)}
          </span>
          <span className="text-xs text-on-glass-2">left</span>
        </span>
      </div>

      <QuizPencilProgress
        value={currentIndex + 1}
        max={quiz.questions.length}
        className="mt-2"
      />

      <nav
        aria-label="Questions"
        className="flex flex-wrap items-center gap-2.5"
      >
        {quiz.questions.map((q, i) => {
          const done =
            hasAnswer(q, answers[q.id] ?? null) && i !== currentIndex;
          const now = i === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              aria-label={`Question ${i + 1}`}
              aria-current={now ? "step" : undefined}
              onClick={() => onSelectIndex(i)}
              className={cn(
                "font-hand flex size-[38px] items-center justify-center rounded-full border-2 border-soft-border bg-transparent p-0 text-[19px] leading-none text-on-glass-2",
                done && "border-primary bg-primary text-on-primary",
                now &&
                  "scale-110 border-[2.5px] border-dashed border-notif bg-surface text-ink-2",
              )}
            >
              {i + 1}
            </button>
          );
        })}
        <span className="flex-1" />
        <span className="text-[13px] text-on-glass-2">
          {answeredTotal} answered · {visitedWithoutAnswer} skipped
        </span>
      </nav>

      <NotebookPage
        withMargin
        withRings
        ringCount={10}
        className="relative mx-auto mt-8 w-full max-w-[920px] rounded-[6px_18px_18px_6px] px-12 py-9 pl-[100px] text-ink"
      >
        <div className="absolute right-[60px] bottom-full -mb-1.5">
          <Mascot pose="think" size={70} />
        </div>

        <QuizQuestionView
          question={question}
          index={currentIndex + 1}
          total={quiz.questions.length}
          value={value}
          onChange={(v) => onChangeAnswer(question.id, v)}
          showVietnamese={showVietnamese}
          showHint={showHint}
        />

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ink"
            size="sm"
            onClick={onToggleHint}
            className="gap-2"
          >
            <Lightbulb className="size-[18px]" aria-hidden />
            {showHint ? "Hide hint" : "Show hint"}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="px-3 py-3 text-[15px] font-bold text-link"
          >
            Skip
          </button>
          <span className="flex-1" />
          <Button type="button" onClick={onCheck}>
            {isLast ? "Submit quiz" : "Check answer"}
          </Button>
        </div>
      </NotebookPage>
    </div>
  );
}
