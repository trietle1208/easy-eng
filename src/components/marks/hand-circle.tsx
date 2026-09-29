import { cn } from "@/lib/utils";

type MarkColor = "ink" | "danger" | "success" | "primary";

const stroke: Record<MarkColor, string> = {
  ink: "text-line",
  danger: "text-danger",
  success: "text-success",
  primary: "text-kick",
};

type HandCircleProps = {
  children: React.ReactNode;
  color?: MarkColor;
  className?: string;
};

export function HandCircle({
  children,
  color = "danger",
  className,
}: HandCircleProps) {
  return (
    <span className={cn("relative inline-block px-1", className)}>
      {children}
      <svg
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-x-1 -inset-y-0.5 h-[calc(100%+4px)] w-[calc(100%+8px)]",
          stroke[color],
        )}
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <ellipse
          cx="50"
          cy="20"
          rx="46"
          ry="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          transform="rotate(-2 50 20)"
        />
      </svg>
    </span>
  );
}
