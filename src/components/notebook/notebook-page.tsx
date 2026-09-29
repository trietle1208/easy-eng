import { cn } from "@/lib/utils";

type NotebookPageProps = {
  children: React.ReactNode;
  className?: string;
  withMargin?: boolean;
  withRings?: boolean;
  ringCount?: number;
  withRules?: boolean;
  style?: React.CSSProperties;
};

export function NotebookPage({
  children,
  className,
  withMargin = false,
  withRings = false,
  ringCount = 5,
  withRules = true,
  style,
}: NotebookPageProps) {
  const rules = withRules
    ? `repeating-linear-gradient(
        180deg,
        transparent 0 calc(var(--rule-gap) - 1px),
        var(--rule) calc(var(--rule-gap) - 1px) var(--rule-gap)
      )`
    : "none";

  const margin = withMargin
    ? `linear-gradient(
        90deg,
        transparent 0 calc(var(--margin-x) - 2px),
        var(--margin) calc(var(--margin-x) - 2px) var(--margin-x),
        transparent var(--margin-x)
      )`
    : "none";

  return (
    <div
      className={cn(
        "relative bg-paper text-ink shadow-[var(--paper-shadow)]",
        withRings && "pl-8",
        className,
      )}
      style={{
        backgroundImage: [margin, rules].filter((v) => v !== "none").join(", "),
        ...style,
      }}
    >
      {withRings ? (
        <div
          className="pointer-events-none absolute top-8 bottom-8 -left-[18px] z-[2] flex flex-col justify-between"
          aria-hidden
        >
          {Array.from({ length: ringCount }).map((_, i) => (
            <span key={i} className="relative block h-4 w-[46px]">
              <i className="absolute top-px left-0 block h-[13px] w-8 rounded-lg border-[3px] border-ring bg-[linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0))] not-italic" />
              <b className="absolute top-[3px] left-[25px] block size-2.5 rounded-full bg-hole shadow-[inset_0_1px_2px_rgba(0,0,0,.6)]" />
            </span>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}
