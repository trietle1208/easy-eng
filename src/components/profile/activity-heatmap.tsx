"use client";

import { useMemo } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ActivityDay, ActivitySummary } from "@/types/profile";

type ActivityHeatmapProps = {
  activity: ActivitySummary;
};

const heatClass: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-heat-0 border-dashed border-line/25",
  1: "bg-heat-1 border-line/40",
  2: "bg-heat-2 border-line/40",
  3: "bg-heat-3 border-line/40",
  4: "bg-heat-4 border-[color:color-mix(in_srgb,var(--line)_60%,transparent)]",
};

const rotates = ["-rotate-1", "rotate-[3deg]", "-rotate-[1deg]"] as const;

function dayLabel(day: ActivityDay): string {
  const d = new Date(`${day.date}T12:00:00`);
  const dateStr = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (day.intensity === null) return `${dateStr} · future`;
  if (day.intensity === 0) return `${dateStr} · no study`;
  return `${dateStr} · ${day.minutes} min`;
}

export function ActivityHeatmap({ activity }: ActivityHeatmapProps) {
  const weeks = useMemo(() => {
    const cols: ActivityDay[][] = [];
    for (let w = 0; w < activity.weeks; w++) {
      cols.push(activity.days.slice(w * 7, w * 7 + 7));
    }
    return cols;
  }, [activity.days, activity.weeks]);

  return (
    <section className="flex flex-col gap-3.5 rounded-[8px_16px_10px_14px] bg-paper p-5 text-ink shadow-[var(--paper-shadow)] md:p-6 md:px-7">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-hand m-0 text-[clamp(1.5rem,3vw,2rem)] leading-none">
          Study activity
        </h2>
        <span className="text-sm text-muted">· Hoạt động học tập</span>
        <div className="flex-1" />
        <span className="text-[13px] font-extrabold text-[color:var(--ink)]">
          {activity.activeDays} active days · last {activity.weeks} weeks
        </span>
      </div>

      <div className="relative hidden h-[18px] text-[12px] leading-[18px] font-bold text-muted sm:block">
        {activity.monthLabels.map((m) => (
          <span
            key={`${m.label}-${m.weekIndex}`}
            className="absolute"
            style={{ left: `${36 + m.weekIndex * 23}px` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <TooltipProvider delayDuration={200}>
        <div
          role="img"
          aria-label={`Study activity heatmap for the last ${activity.weeks} weeks`}
          className="flex gap-1.5 overflow-x-auto pb-1"
        >
          <div className="flex w-9 shrink-0 flex-col gap-1.5 text-[11px] leading-[18px] font-bold text-muted">
            <span>Mon</span>
            <span className="h-[18px]" />
            <span>Wed</span>
            <span className="h-[18px]" />
            <span>Fri</span>
            <span className="h-[18px]" />
            <span>Sun</span>
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} className="flex shrink-0 flex-col gap-1.5">
              {week.map((day, di) => {
                if (day.intensity === null) {
                  return (
                    <span
                      key={day.date}
                      className={cn(
                        "size-[18px] rounded-[4px_6px_3px_5px/5px_3px_6px_4px] border border-transparent",
                        rotates[di % 3],
                      )}
                      aria-hidden
                    />
                  );
                }
                return (
                  <Tooltip key={day.date}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "size-[18px] rounded-[4px_6px_3px_5px/5px_3px_6px_4px] border-[1.5px]",
                          heatClass[day.intensity],
                          rotates[di % 3],
                        )}
                        aria-label={dayLabel(day)}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">{dayLabel(day)}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </TooltipProvider>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-[color:var(--ink)]">
        <span className="font-hand text-[19px] text-kick">
          {activity.longestStreakLabel}
        </span>
        <div className="flex-1" />
        <span className="font-bold">Less</span>
        {([0, 1, 2, 3, 4] as const).map((n) => (
          <span
            key={n}
            className={cn(
              "size-[18px] rounded-[4px_6px_3px_5px/5px_3px_6px_4px] border-[1.5px]",
              heatClass[n],
            )}
            aria-hidden
          />
        ))}
        <span className="font-bold">More</span>
      </div>
    </section>
  );
}
