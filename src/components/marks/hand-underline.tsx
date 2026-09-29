import { cn } from "@/lib/utils";

type HandUnderlineProps = {
  children: React.ReactNode;
  color?: "ink" | "danger" | "success" | "primary";
  className?: string;
};

const stroke = {
  ink: "text-line",
  danger: "text-danger",
  success: "text-success",
  primary: "text-kick",
} as const;

export function HandUnderline({
  children,
  color = "primary",
  className,
}: HandUnderlineProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      {children}
      <svg
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-0 -bottom-1 left-0 h-2 w-full",
          stroke[color],
        )}
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
      >
        <path
          d="M2 5 Q25 2 50 5 T98 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
