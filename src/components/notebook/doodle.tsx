import { cn } from "@/lib/utils";

type DoodleProps = {
  children?: React.ReactNode;
  className?: string;
  label?: string;
};

/** Decorative hand-drawn wrapper / slot for inline SVG doodles. */
export function Doodle({ children, className, label }: DoodleProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-line", className)}
    >
      {children ?? (
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
          <path
            d="M8 28c4-10 12-16 20-14 8 2 12 10 10 18-2 8-12 12-20 8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M30 12c4 1 8 4 9 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}
