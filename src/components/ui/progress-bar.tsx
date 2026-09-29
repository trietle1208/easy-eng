import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  className?: string;
  "aria-label"?: string;
};

export function ProgressBar({
  value,
  className,
  "aria-label": ariaLabel = "Progress",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn(
        "h-3.5 overflow-hidden rounded-[10px_4px_12px_5px/5px_12px_4px_10px] border-2 border-line bg-surface",
        className,
      )}
    >
      <span
        className="block h-full bg-[repeating-linear-gradient(-45deg,var(--hatch-1)_0_6px,var(--hatch-2)_6px_12px)]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
