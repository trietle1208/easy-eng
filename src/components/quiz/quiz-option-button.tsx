import { cn } from "@/lib/utils";

type QuizOptionButtonProps = {
  letter: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
};

export function QuizOptionButton({
  letter,
  label,
  selected,
  onSelect,
  disabled,
}: QuizOptionButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-[66px] w-full items-center gap-3.5 rounded-[12px_20px_10px_18px/18px_10px_20px_12px] border-2 border-line bg-surface px-4 py-3 text-left text-[19px] font-medium leading-snug text-ink-2",
        selected && "bg-primary-soft shadow-[0_3px_0_var(--line)]",
      )}
    >
      <span
        className={cn(
          "font-hand flex size-[34px] shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface text-[21px] leading-none",
          selected && "bg-line text-surface",
        )}
      >
        {letter}
      </span>
      <span className="min-w-0 flex-1">{label}</span>
      {selected ? (
        <svg
          className="absolute top-1/2 right-3 -mt-[17px]"
          width="34"
          height="34"
          viewBox="0 0 34 34"
          aria-hidden
        >
          <path
            d="M7 19 L13 25 L28 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 3"
            className="text-line"
          />
        </svg>
      ) : null}
    </button>
  );
}
