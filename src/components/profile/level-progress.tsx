import { LevelBadge } from "@/components/ui/level-badge";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/cefr";
import type { LevelProgress } from "@/types/profile";

type LevelProgressPanelProps = {
  levels: LevelProgress[];
};

const fillClass: Record<CefrLevel, string> = {
  A1: "bg-[repeating-linear-gradient(-45deg,var(--level-a1)_0_5px,color-mix(in_srgb,var(--level-a1)_55%,white)_5px_10px)]",
  A2: "bg-[repeating-linear-gradient(-45deg,var(--level-a2)_0_5px,color-mix(in_srgb,var(--level-a2)_55%,white)_5px_10px)]",
  B1: "bg-[repeating-linear-gradient(-45deg,var(--level-b1)_0_5px,color-mix(in_srgb,var(--level-b1)_55%,white)_5px_10px)]",
  B2: "bg-[repeating-linear-gradient(-45deg,var(--level-b2)_0_5px,color-mix(in_srgb,var(--level-b2)_55%,white)_5px_10px)]",
  C1: "bg-[repeating-linear-gradient(-45deg,var(--level-c1)_0_5px,color-mix(in_srgb,var(--level-c1)_55%,white)_5px_10px)]",
};

export function LevelProgressPanel({ levels }: LevelProgressPanelProps) {
  return (
    <section className="flex flex-col gap-3.5 rounded-[14px_8px_16px_10px] bg-paper p-5 text-ink shadow-[var(--paper-shadow)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(25,12,4,.42),0_2px_0_rgba(0,0,0,.06)] md:p-6">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-hand m-0 text-[clamp(1.5rem,3vw,2rem)] leading-none">
          Progress by level
        </h2>
        <span className="text-sm text-muted">· Tiến độ</span>
      </div>

      <div className="flex flex-col gap-3.5">
        {levels.map((row) => (
          <div key={row.level} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={row.level} />
              <span className="text-[15px] font-extrabold">{row.label}</span>
              {row.current ? (
                <span className="font-hand text-[19px] leading-none text-danger">
                  ← you are here
                </span>
              ) : null}
              <div className="flex-1" />
              <span className="font-hand text-[21px] leading-none">
                {row.statusLabel}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={row.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${row.level} ${row.label} progress`}
              className="h-5 overflow-hidden rounded-[12px_5px_14px_6px/6px_14px_5px_12px] border-2 border-line bg-surface"
            >
              <span
                className={cn(
                  "block h-full",
                  row.locked || row.percent === 0
                    ? "bg-transparent"
                    : fillClass[row.level],
                )}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
