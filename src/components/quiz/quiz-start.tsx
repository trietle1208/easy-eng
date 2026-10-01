"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

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

const statColors = ["yellow", "green", "pink", "blue"] as const;
const statRotates = [-1.6, 1.4, -0.9, 1.8] as const;

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

  const durationLabel = formatQuizDuration(quiz.timeLimitSeconds);

  const stats: { line1: string; line2: string }[] = [
    { line1: String(quiz.questions.length), line2: "questions" },
    {
      line1: durationLabel.endsWith(" min")
        ? durationLabel.replace(" min", "")
        : durationLabel,
      line2: durationLabel.endsWith(" min") ? "min time limit" : "time limit",
    },
    {
      line1: String(quiz.questionTypes.length),
      line2: "question types",
    },
    {
      line1: `${quiz.passScore} / ${quiz.questions.length}`,
      line2: "to pass",
    },
  ];

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

      <div className="relative">
        <NotebookPage
          withMargin
          withRings
          ringCount={14}
          withRules
          className="relative flex flex-1 flex-col gap-7 rounded-[6px_18px_18px_6px] px-12 py-10 pl-[100px]"
        >
          <div className="flex flex-col gap-3">
            <span className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
              {quiz.kickEn} · {quiz.kickVi}
            </span>

            <h1 className="m-0 text-[clamp(1.85rem,3.6vw,2.75rem)] leading-[1.1] font-extrabold tracking-tight text-ink-2">
              {quiz.title}
            </h1>

            <LevelBadge level={quiz.level} className="w-fit px-2.5 py-1.5 text-sm" />

            <p className="m-0 text-lg leading-relaxed text-ink">
              {quiz.descriptionEn.includes("have done") ? (
                <>
                  Test yourself on when to say <b>have done</b> and when to say{" "}
                  <b>did</b>.
                </>
              ) : (
                quiz.descriptionEn
              )}
            </p>
            <p className="m-0 text-[17px] leading-snug font-semibold text-kick">
              {quiz.descriptionVi}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {stats.map((stat, i) => (
              <StickyNote
                key={`${stat.line1}-${stat.line2}`}
                color={statColors[i]!}
                rotate={statRotates[i]!}
                withTape={false}
                className="min-h-[108px] justify-center gap-1 rounded-[4px_4px_16px_4px] px-4 pt-5 pb-4"
              >
                <b className="font-hand text-[40px] leading-none text-ink-2">
                  {stat.line1}
                </b>
                <span className="text-sm font-semibold leading-snug text-ink">
                  {stat.line2}
                </span>
              </StickyNote>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-extrabold tracking-[0.14em] text-muted uppercase">
              You&apos;ll see
            </span>
            <div className="flex flex-wrap gap-2.5">
              {quiz.questionTypes.map((t, i) => (
                <span
                  key={t.id}
                  className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-dashed border-line/40 bg-surface/70 px-3.5 text-[15px] font-semibold text-ink"
                >
                  <i className="font-hand text-lg not-italic text-kick">
                    {i + 1}
                  </i>
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {lastAttempt ? (
            <StickyNote
              color="pink"
              rotate={1.2}
              className="w-full max-w-[280px] gap-1 px-[18px] pt-[22px] pb-4 sm:w-[240px]"
            >
              <span className="font-hand text-[21px] text-danger">Last try</span>
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

          <div className="mt-auto flex flex-col gap-4 rounded-[16px] border-[2.5px] border-line bg-surface px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex flex-1 cursor-pointer items-center gap-3 text-base font-semibold leading-snug text-ink">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-[6px] border-2 border-line",
                  showVietnameseHints && "border-primary bg-primary text-on-primary",
                )}
              >
                {showVietnameseHints ? (
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                ) : null}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={showVietnameseHints}
                onChange={(e) => onToggleHints(e.target.checked)}
              />
              Show Vietnamese hints during the quiz
            </label>

            <Link
              href={quiz.lessonHref}
              className="text-[15px] font-bold text-link underline underline-offset-[3px]"
            >
              Review the lesson first
            </Link>

            <Button type="button" size="lg" onClick={onStart} className="sm:ml-auto">
              Start quiz
              <ArrowRight className="size-5" aria-hidden />
            </Button>
          </div>
        </NotebookPage>

        <div className="pointer-events-none absolute right-[-6px] bottom-[-18px] z-10 sm:right-3 sm:bottom-[-22px]">
          <Mascot pose="peek" size={92} alt="" />
        </div>
      </div>
    </div>
  );
}
