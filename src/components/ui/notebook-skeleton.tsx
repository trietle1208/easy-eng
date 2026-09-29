import { cn } from "@/lib/utils";

type NotebookSkeletonProps = {
  className?: string;
  rows?: number;
  "aria-label"?: string;
};

/** Ruled-paper shimmer placeholder for data-driven sections. */
export function NotebookSkeleton({
  className,
  rows = 5,
  "aria-label": ariaLabel = "Loading",
}: NotebookSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy
      aria-label={ariaLabel}
      className={cn(
        "relative overflow-hidden rounded-[8px_16px_10px_14px] bg-paper p-6 shadow-[var(--paper-shadow)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `repeating-linear-gradient(
            180deg,
            transparent 0 calc(var(--rule-gap) - 1px),
            var(--rule) calc(var(--rule-gap) - 1px) var(--rule-gap)
          )`,
        }}
      />
      <div className="relative flex flex-col gap-4">
        <div className="h-7 w-2/5 animate-pulse rounded bg-line/15" />
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 animate-pulse rounded bg-line/10"
            style={{ width: `${88 - (i % 3) * 12}%` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
