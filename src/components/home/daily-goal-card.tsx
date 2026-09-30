"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Flame, Pause, Play } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { recordStudySessionAction } from "@/lib/actions/record-study-session";
import { cn } from "@/lib/utils";
import type { DailyGoal } from "@/types/home";

type DailyGoalCardProps = {
  goal: DailyGoal;
};

type TimerMode = "study" | "pomodoro";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function DailyGoalCard({ goal }: DailyGoalCardProps) {
  const [mode, setMode] = useState<TimerMode>("study");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const elapsedRef = useRef(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setRunning(false);
    elapsedRef.current = 0;
    setSeconds(mode === "study" ? 0 : goal.pomodoroSeconds);
  }, [mode, goal.pomodoroSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (mode === "study") {
        setSeconds((prev) => {
          const next = prev + 1;
          elapsedRef.current = next;
          return next;
        });
        return;
      }
      setSeconds((prev) => {
        const next = Math.max(0, prev - 1);
        elapsedRef.current = goal.pomodoroSeconds - next;
        if (next === 0) {
          setRunning(false);
          const duration = goal.pomodoroSeconds;
          if (duration >= 60) {
            startTransition(async () => {
              await recordStudySessionAction({
                durationSeconds: duration,
                mode: "pomodoro",
              });
            });
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, mode, goal.pomodoroSeconds]);

  function toggleRunning() {
    if (running && mode === "study") {
      const duration = elapsedRef.current;
      setRunning(false);
      if (duration >= 60) {
        startTransition(async () => {
          await recordStudySessionAction({
            durationSeconds: duration,
            mode: "study",
          });
        });
        setSeconds(0);
        elapsedRef.current = 0;
      }
      return;
    }
    setRunning((v) => !v);
  }

  const wordsPct = (goal.newWords.current / goal.newWords.target) * 100;
  const grammarPct = (goal.grammar.current / goal.grammar.target) * 100;

  return (
    <section className="relative flex flex-col gap-[18px] rounded-[8px_16px_10px_14px] bg-paper p-[26px_24px_22px] text-ink shadow-[var(--paper-shadow)]">
      <span
        aria-hidden
        className="absolute -top-[13px] left-1/2 h-[26px] w-[92px] -ml-[46px] -rotate-4 border border-white/50 bg-[rgba(255,250,235,.62)] shadow-[0_1px_2px_rgba(0,0,0,.08)]"
      />

      <div className="flex items-baseline gap-3">
        <h2 className="font-hand m-0 text-[33px] leading-none text-ink">
          Today&apos;s goal
        </h2>
        <div className="flex-1" />
        <span className="text-[13px] font-extrabold text-muted">
          {goal.dateLabel}
        </span>
      </div>

      <div className="flex items-center gap-3.5">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-line bg-[color-mix(in_srgb,var(--sticky)_70%,white)] text-accent"
          aria-hidden
        >
          <Flame className="size-7" strokeWidth={2} />
        </div>
        <div>
          <div className="font-hand text-[30px] leading-none font-black">
            {goal.streakDays}{" "}
            <span className="text-base font-extrabold">day streak</span>
          </div>
          <div className="font-hand mt-0.5 text-[19px] text-muted">
            {goal.streakNote}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {goal.weekdays.map((day, i) => (
          <div key={`${day.label}-${i}`}>
            <div className="text-xs font-extrabold text-muted">{day.label}</div>
            <div
              className={cn(
                "mx-auto mt-1.5 flex size-[34px] items-center justify-center rounded-[48%_52%_50%_46%/50%_46%_54%_50%] border-2 border-line text-kick",
                day.status === "done" && "bg-primary-soft",
                day.status === "today" &&
                  "border-dashed border-danger bg-surface",
              )}
              aria-label={
                day.status === "done"
                  ? `${day.label} done`
                  : day.status === "today"
                    ? `${day.label} today`
                    : day.label
              }
            >
              {day.status === "done" ? (
                <Check className="size-4" strokeWidth={3} aria-hidden />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline">
          <span className="text-[15px] font-extrabold">
            {goal.newWords.label}
          </span>
          <div className="flex-1" />
          <span className="font-hand text-[25px] leading-none">
            {goal.newWords.current} / {goal.newWords.target}
          </span>
        </div>
        <ProgressBar value={wordsPct} aria-label="New words progress" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline">
          <span className="text-[15px] font-extrabold">
            {goal.grammar.label}
          </span>
          <div className="flex-1" />
          <span className="font-hand text-[25px] leading-none">
            {goal.grammar.current} / {goal.grammar.target}
          </span>
        </div>
        <ProgressBar value={grammarPct} aria-label="Grammar lessons progress" />
      </div>

      <div className="radius-sketch flex items-center gap-3 border-2 border-line bg-surface py-3 pr-3 pl-4">
        <div className="min-w-0 flex-1">
          <div className="text-kick text-xs font-extrabold tracking-[0.16em] uppercase">
            Study timer
          </div>
          <div className="font-mono mt-1.5 text-[30px] font-bold tabular-nums">
            {formatTime(seconds)}
          </div>
        </div>
        <div
          role="radiogroup"
          aria-label="Timer mode"
          className="inline-flex overflow-hidden rounded-[10px] border-[1.5px] border-line"
        >
          {(["study", "pomodoro"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mode === option}
              onClick={() => setMode(option)}
              className={cn(
                "h-[30px] px-2.5 text-xs font-bold capitalize",
                mode === option ? "bg-primary-soft" : "bg-surface",
              )}
            >
              {option === "study" ? "Study" : "Pomodoro"}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label={running ? "Pause timer" : "Start timer"}
          onClick={toggleRunning}
          className="flex size-[46px] items-center justify-center rounded-full border-2 border-line bg-primary text-on-primary"
        >
          {running ? (
            <Pause className="size-[18px]" fill="currentColor" />
          ) : (
            <Play className="size-[18px] translate-x-px" fill="currentColor" />
          )}
        </button>
      </div>
    </section>
  );
}
