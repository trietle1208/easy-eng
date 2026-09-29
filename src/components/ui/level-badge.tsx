import type { CefrLevel } from "@/types/cefr";
import { cn } from "@/lib/utils";

const levelBg: Record<CefrLevel, string> = {
  A1: "bg-level-a1",
  A2: "bg-level-a2",
  B1: "bg-level-b1",
  B2: "bg-level-b2",
  C1: "bg-level-c1",
};

type LevelBadgeProps = {
  level: CefrLevel;
  className?: string;
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md px-[7px] py-1 text-[11px] leading-none font-extrabold tracking-wide text-white",
        levelBg[level],
        className,
      )}
    >
      {level}
    </span>
  );
}
