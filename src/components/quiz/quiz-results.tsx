"use client";

import Link from "next/link";
import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { HandUnderline } from "@/components/marks/hand-underline";
import { CorrectionMark } from "@/components/marks/correction-mark";
import { Mascot } from "@/components/mascot/mascot";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { signInUrl } from "@/lib/auth/paths";
import { cn } from "@/lib/utils";
import type { QuizPublic, QuizResult } from "@/types/quiz";

type QuizResultsProps = {
  quiz: QuizPublic;
  result: QuizResult;
  onTryAgain: () => void;
  onPractiseMistakes: () => void;
};

function formatUsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatLimit(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizResults({
  quiz,
  result,
  onTryAgain,
  onPractiseMistakes,
}: QuizResultsProps) {
  const [filter, setFilter] = useState<"all" | "mistakes">("all");
  const { attempt, review } = result;
  const mistakes = review.filter((r) => !r.isCorrect);
  const rows = filter === "all" ? review : mistakes;

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-center gap-3 text-on-glass">
        <span className="font-hand text-[28px] leading-none">Quiz complete</span>
        <span className="text-on-glass-2">·</span>
        <span className="text-[15px] text-on-glass-2">{quiz.title}</span>
        <LevelBadge level={quiz.level} />
      </div>

      <NotebookPage
        withMargin
        withRings
        ringCount={20}
        className="flex flex-col gap-[26px] rounded-[6px_18px_18px_6px] px-[52px] py-10 pl-[100px] text-ink"
      >
        <section className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-9">
          <div
            role="img"
            aria-label={`Score ${attempt.score} out of ${attempt.total}${attempt.passed ? ", passed" : ""}`}
            className="relative flex h-[170px] w-[210px] shrink-0 items-center justify-center"
          >
            <svg
              viewBox="0 0 210 170"
              className="absolute inset-0"
              width={210}
              height={170}
              aria-hidden
            >
              <path
                d="M60 16 C 130 2, 204 30, 200 86 C 196 144, 120 166, 70 156 C 20 146, 4 104, 14 64 C 22 34, 52 18, 96 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="text-danger"
              />
            </svg>
            <span
              className="font-hand text-[96px] leading-none text-danger"
              style={{ transform: "rotate(-6deg)" }}
            >
              {attempt.score}
              <span className="text-[56px]">/{attempt.total}</span>
            </span>
            {attempt.passed ? (
              <span
                className="font-hand absolute right-[-24px] bottom-[-8px] rounded-lg border-[3px] border-success bg-paper/85 px-3 py-0.5 text-[26px] text-success"
                style={{ transform: "rotate(-12deg)" }}
              >
                Passed!
              </span>
            ) : (
              <span
                className="font-hand absolute right-[-24px] bottom-[-8px] rounded-lg border-[3px] border-danger bg-paper/85 px-3 py-0.5 text-[26px] text-danger"
                style={{ transform: "rotate(-12deg)" }}
              >
                Keep going
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h1 className="font-hand m-0 text-[clamp(2rem,4vw,3.6rem)] leading-none text-ink-2">
              {result.headlineEn}
            </h1>
            <p className="m-0 text-lg leading-relaxed">
              {result.messageEn}
              <br />
              <i className="text-kick">{result.messageVi}</i>
            </p>
            {!result.progressSaved ? (
              <p className="m-0 text-sm font-semibold text-muted">
                <Link
                  href={signInUrl(`/quiz/${quiz.slug}`)}
                  className="font-bold text-link underline-offset-2 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to save this attempt and compare with your next try.
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="flex flex-col gap-1.5 rounded-[var(--radius-sketch)] border-2 border-line bg-surface px-4 py-3.5">
                <b className="font-hand text-[36px] leading-none text-ink-2">
                  {formatUsed(attempt.timeUsedSeconds)}
                </b>
                <span className="text-sm font-semibold text-accent">
                  of {formatLimit(quiz.timeLimitSeconds)} used
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[var(--radius-sketch)] border-2 border-line bg-surface px-4 py-3.5">
                <b className="font-hand text-[36px] leading-none text-ink-2">
                  {attempt.accuracy}%
                </b>
                <span className="text-sm font-semibold text-accent">
                  accuracy
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[var(--radius-sketch)] border-2 border-line bg-surface px-4 py-3.5">
                <b
                  className={cn(
                    "font-hand text-[36px] leading-none",
                    result.deltaVsLast != null && result.deltaVsLast > 0
                      ? "text-success"
                      : "text-ink-2",
                  )}
                >
                  {result.deltaVsLast == null
                    ? "—"
                    : result.deltaVsLast > 0
                      ? `+${result.deltaVsLast}`
                      : String(result.deltaVsLast)}
                </b>
                <span className="text-sm font-semibold text-accent">
                  {result.lastScore != null
                    ? `better than last try (${result.lastScore}/${result.lastTotal})`
                    : "first try"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 rounded-[var(--radius-sketch)] border-2 border-line bg-surface px-4 py-3.5">
                <b className="font-hand text-[36px] leading-none text-ink-2">
                  {result.dailyGoalLabel}
                </b>
                <span className="text-sm font-semibold text-accent">
                  {result.dailyGoalDetail}
                </span>
              </div>
            </div>
          </div>

          <div className="relative hidden w-[190px] shrink-0 lg:block">
            <Mascot pose="cheer" size={170} />
          </div>
        </section>

        <div className="border-t-2 border-dashed border-line/25" />

        <section className="flex flex-col gap-1.5">
          <div className="mb-1.5 flex flex-wrap items-center gap-3">
            <h2 className="font-hand m-0 text-[34px] leading-none">
              Review your answers
            </h2>
            <span className="text-[15px] text-muted">· Xem lại đáp án</span>
            <span className="flex-1" />
            <div
              role="group"
              aria-label="Filter answers"
              className="flex gap-2"
            >
              <button
                type="button"
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
                className={cn(
                  "fpill h-10 rounded-[var(--radius-pill)] border-2 border-line bg-surface px-4 text-sm font-bold text-ink",
                  filter === "all" && "bg-primary-soft",
                )}
              >
                All {review.length}
              </button>
              <button
                type="button"
                aria-pressed={filter === "mistakes"}
                onClick={() => setFilter("mistakes")}
                className={cn(
                  "h-10 rounded-[var(--radius-pill)] border-2 border-line bg-surface px-4 text-sm font-bold text-ink",
                  filter === "mistakes" && "bg-primary-soft",
                )}
              >
                Mistakes {mistakes.length}
              </button>
            </div>
          </div>

          <ul className="m-0 flex list-none flex-col p-0">
            {rows.map((row) => (
              <li
                key={row.questionId}
                className={cn(
                  "grid grid-cols-[36px_96px_minmax(0,1fr)] items-center gap-3.5 border-b-[1.5px] border-dashed border-line/18 py-3.5 lg:grid-cols-[36px_96px_minmax(0,1fr)_290px]",
                  !row.isCorrect && "items-start pt-10",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2",
                    row.isCorrect
                      ? "border-success bg-[color-mix(in_srgb,var(--success)_12%,white)] text-success"
                      : "border-danger bg-danger-bg text-danger",
                  )}
                  aria-label={row.isCorrect ? "Correct" : "Incorrect"}
                >
                  {row.isCorrect ? (
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                  ) : (
                    <X className="size-3.5" strokeWidth={3.2} aria-hidden />
                  )}
                </span>
                <span className="text-xs font-bold tracking-[0.08em] text-muted uppercase">
                  {row.index}. {row.typeLabel}
                </span>
                <div className="text-lg font-medium leading-relaxed text-ink-2">
                  {row.before}
                  {row.isCorrect ? (
                    <HandUnderline
                      color="success"
                      className="font-hand mx-1 text-[25px] text-success"
                    >
                      {row.correct}
                    </HandUnderline>
                  ) : (
                    <CorrectionMark
                      wrong={row.given === "—" ? "…" : row.given}
                      correct={row.correct}
                      className="mx-1 align-baseline"
                    />
                  )}
                  {row.after}
                </div>
                {!row.isCorrect ? (
                  <div className="font-hand col-span-full flex gap-1.5 text-[20px] leading-tight text-ink-2 lg:col-span-1 lg:col-start-4">
                    <svg
                      width="40"
                      height="24"
                      viewBox="0 0 44 26"
                      aria-hidden
                      className="mt-0.5 shrink-0"
                    >
                      <path
                        d="M42 8 C 30 1, 14 3, 4 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="text-line"
                      />
                      <path
                        d="M3 6 L 3 17 L 13 15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-line"
                      />
                    </svg>
                    <span>
                      {row.explanationEn}
                      <span className="mt-0.5 block text-[17px] text-muted">
                        {row.explanationVi}
                      </span>
                    </span>
                  </div>
                ) : (
                  <span className="hidden lg:block" />
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
          {mistakes.length > 0 ? (
            <Button type="button" variant="ink" onClick={onPractiseMistakes}>
              <RotateCcw className="size-[18px]" aria-hidden />
              Practise my {mistakes.length} mistake
              {mistakes.length === 1 ? "" : "s"}
            </Button>
          ) : null}
          <Button type="button" variant="ink" onClick={onTryAgain}>
            Try again
          </Button>
          <span className="flex-1" />
          <Button asChild>
            <Link href={quiz.nextHref}>
              {quiz.nextLabel}
              <ArrowRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </div>
      </NotebookPage>
    </div>
  );
}
