import { HandCircle } from "@/components/marks/hand-circle";
import { cn } from "@/lib/utils";

type CorrectionMarkProps = {
  wrong: string;
  correct: string;
  note?: string;
  className?: string;
};

export function CorrectionMark({
  wrong,
  correct,
  note,
  className,
}: CorrectionMarkProps) {
  return (
    <span className={cn("relative inline-flex flex-col items-start", className)}>
      <span className="font-hand text-success absolute -top-5 left-1 text-lg leading-none">
        {correct}
      </span>
      <HandCircle color="danger">
        <span className="text-danger line-through decoration-2">{wrong}</span>
      </HandCircle>
      {note ? (
        <span className="font-hand text-muted mt-1 max-w-[16rem] text-base leading-tight">
          <svg
            aria-hidden
            className="text-kick mr-1 inline-block align-middle"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M4 8c6 1 10 4 12 10M16 14l4 4-5 1"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {note}
        </span>
      ) : null}
    </span>
  );
}
