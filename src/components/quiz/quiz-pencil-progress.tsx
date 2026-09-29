import { cn } from "@/lib/utils";

type QuizPencilProgressProps = {
  value: number;
  max: number;
  className?: string;
};

/** Hand-drawn pencil progress line matching the quiz mockup. */
export function QuizPencilProgress({
  value,
  max,
  className,
}: QuizPencilProgressProps) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  // Pencil tip sits along the path; translateX uses approx path length mapping
  const tipX = 6 + (1128 * pct) / 100;

  return (
    <svg
      viewBox="0 0 1140 40"
      className={cn("h-10 w-full overflow-visible", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label="Quiz progress"
    >
      <path
        d="M6 20 C 200 16, 400 24, 600 19 S 950 16, 1134 20"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 7"
        className="text-on-glass"
      />
      <path
        d="M6 20 C 200 16, 400 24, 600 19 S 950 16, 1134 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${pct} 100`}
        className="text-on-glass"
      />
      <path
        d="M6 22 C 200 18, 400 26, 600 21 S 950 18, 1134 22"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${pct} 100`}
        className="text-on-glass"
      />
      <g transform={`translate(${tipX} 20) rotate(125)`}>
        <path
          d="M0 0 L-9 -4.5 L-9 4.5 Z"
          fill="var(--on-glass-2)"
          stroke="var(--ink)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M0 0 L-3.5 -1.7 L-3.5 1.7 Z" fill="var(--ink)" />
        <rect
          x="-44"
          y="-4.5"
          width="35"
          height="9"
          fill="#FFD25C"
          stroke="var(--ink)"
          strokeWidth="1.4"
        />
        <path
          d="M-44 -1.5 H-9 M-44 1.5 H-9"
          stroke="#E0A92A"
          strokeWidth="1"
        />
        <rect
          x="-52"
          y="-4.5"
          width="8"
          height="9"
          rx="1.5"
          fill="#F29C8F"
          stroke="var(--ink)"
          strokeWidth="1.4"
        />
      </g>
    </svg>
  );
}
