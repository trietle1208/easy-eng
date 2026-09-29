"use client";

import { LevelBadge } from "@/components/ui/level-badge";
import { CEFR_LABELS, CEFR_LEVELS, type CefrLevel } from "@/types/cefr";
import { cn } from "@/lib/utils";

type LevelValue = "all" | CefrLevel;

type LevelChipsProps = {
  value: LevelValue;
  onChange: (value: LevelValue) => void;
  className?: string;
  includeAll?: boolean;
};

export function LevelChips({
  value,
  onChange,
  className,
  includeAll = true,
}: LevelChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter by CEFR level"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {includeAll ? (
        <Chip
          pressed={value === "all"}
          onClick={() => onChange("all")}
          label="All levels"
        />
      ) : null}
      {CEFR_LEVELS.map((level) => (
        <Chip
          key={level}
          pressed={value === level}
          onClick={() => onChange(level)}
          label={
            <>
              <LevelBadge level={level} />
              {CEFR_LABELS[level]}
            </>
          }
        />
      ))}
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  label: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border text-sm font-bold",
        pressed
          ? "border-primary bg-primary px-4 text-on-primary"
          : "border-soft-border bg-[rgba(255,240,220,.1)] pr-3.5 pl-2 text-on-glass",
      )}
    >
      {label}
    </button>
  );
}
