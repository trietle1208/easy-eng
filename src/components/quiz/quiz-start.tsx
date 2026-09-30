"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleDot,
  PencilLine,
} from "lucide-react";

import { Mascot } from "@/components/mascot/mascot";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { StickyNote } from "@/components/notebook/sticky-note";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { formatQuizDuration } from "@/lib/format";
import type { QuizAttempt, QuizPublic } from "@/types/quiz";
import { cn } from "@/lib/utils";

type QuizStartProps = {
  quiz: QuizPublic;
  lastAttempt: QuizAttempt | null;
  showVietnameseHints: boolean;
  onToggleHints: (on: boolean) => void;
  onStart: () => void;
};

function typeIcon(id: string) {
  if (id === "multiple_choice") return CircleDot;
  if (id === "fill_blank") return PencilLine;
  return Check;
}

export function QuizStart({
  quiz,
  lastAttempt,
  showVietnameseHints,
  onToggleHints,
  onStart,
}: QuizStartProps) {
  const daysAgo =
    lastAttempt != null
      ? Math.max(
          0,
          Math.round(
            (Date.now() - new Date(lastAttempt.completedAt).getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        )
      : null;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-wrap items-center gap-3 text-on-glass">
        <Link
          href={quiz.lessonHref}
          className="inline-flex h-11 items-center gap-1.5 text-[15px] font-bold text-on-glass hover:text-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back to lesson
        </Link>
        <span className="text-on-glass-2">·</span>
        <span className="text-[15px] text-on-glass-2">{quiz.breadcrumb}</span>
      </div>

      <div className="flex min-h-0 flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
        <NotebookPage
          withMargin
          withRings
          ringCount={14}
          className="flex flex-1 flex-col gap-[22px] rounded-[6px_18px_18px_6px] px-12 py-10 pl-[100px]"
        >
          <span className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
            {quiz.kickEn} · {quiz.kickVi}
          </span>

          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-hand m-0 text-[clamp(2rem,4vw,3.75rem)] leading-none text-ink-2">
              {quiz.title}
            </h1>
            <LevelBadge level={quiz.level} className="px-2.5 py-1.5 text-sm" />
          </div>

          <p className="m-0 text-lg leading-relaxed text-ink">
            {quiz.descriptionEn.includes("have done") ? (
              <>
                Test yourself on when to say <b>have done</b> and when to say{" "}
                <b>did</b>.
              </>
            ) : (
              quiz.descriptionEn
            )}
            <br />
            <i className="text-kick">{quiz.descriptionVi}</i>
          </p>

          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {[
              {
                value: String(quiz.questions.length),
                label: "questions",
              },
              {
                value: formatQuizDuration(quiz.timeLimitSeconds).replace(
                  " min",
                  " min",
                ),
                label: "time limit",
              },
              {
                value: String(quiz.questionTypes.length),
                label: "question types",
              },
              {
                value: `${quiz.passScore} / ${quiz.questions.length}`,
                label: "to pass",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1.5 rounded-[var(--radius-sketch)] border-2 border-line bg-surface px-4 py-3.5"
              >
                <b className="font-hand text-[40px] leading-none text-ink-2">
                  {stat.value}
                </b>
                <span className="text-sm font-semibold leading-snug text-accent">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-extrabold tracking-[0.14em] text-accent uppercase">
              You&apos;ll see
            </span>
            <div className="flex flex-wrap gap-2">
              {quiz.questionTypes.map((t) => {
                const Icon = typeIcon(t.id);
                return (
                  <span
                    key={t.id}
                    className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border-[1.5px] border-line/40 bg-surface px-3.5 text-[15px] font-semibold text-ink"
                  >
                    <Icon className="size-[18px]" aria-hidden />
                    {t.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3.5">
            <span
              id="quiz-hint-lbl"
              className="text-base font-semibold leading-snug text-ink"
            >
              Show Vietnamese hints during the quiz
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={showVietnameseHints}
              aria-labelledby="quiz-hint-lbl"
              onClick={() => onToggleHints(!showVietnameseHints)}
              className={cn(
                "relative h-8 w-[54px] shrink-0 rounded-[var(--radius-pill)] border-2 border-line bg-surface p-0",
                showVietnameseHints && "bg-hatch-1",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 size-5 rounded-full bg-line transition-[left]",
                  showVietnameseHints &&
                    "left-[26px] bg-surface shadow-[0_0_0_2px_var(--line)]",
                )}
              />
            </button>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-5 pt-2">
            <Button type="button" size="lg" onClick={onStart}>
              Start quiz
              <ArrowRight className="size-5" aria-hidden />
            </Button>
            <Link
              href={quiz.lessonHref}
              className="text-[15px] font-bold text-link underline underline-offset-[3px]"
            >
              Review the lesson first
            </Link>
          </div>
        </NotebookPage>

        <aside className="flex w-full shrink-0 flex-col items-center justify-center gap-4.5 lg:w-[300px]">
          <div className="font-hand relative rounded-[20px] bg-surface px-5 py-4 text-center text-[25px] leading-tight text-ink-2 shadow-[0_8px_18px_rgba(0,0,0,.25)]">
            {quiz.encouragementEn}
            <span className="mt-1 block text-[20px] text-kick">
              {quiz.encouragementVi}
            </span>
            <span
              className="absolute bottom-[-9px] left-1/2 -ml-[9px] size-[18px] rotate-45 bg-surface"
              aria-hidden
            />
          </div>

          <Mascot pose="cheer" size={200} />

          {lastAttempt ? (
            <StickyNote
              color="pink"
              rotate={2}
              className="w-[240px] gap-1 px-[18px] pt-[22px] pb-4"
            >
              <span className="font-hand text-[21px] text-danger">
                Last try
              </span>
              <span className="font-hand text-[44px] leading-none text-ink-2">
                {lastAttempt.score} / {lastAttempt.total}
              </span>
              <span className="text-[13px] font-semibold text-accent">
                {daysAgo === 0
                  ? "Today"
                  : daysAgo === 1
                    ? "1 day ago"
                    : `${daysAgo} days ago`}{" "}
                · beat it today!
              </span>
            </StickyNote>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
