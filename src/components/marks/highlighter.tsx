import { cn } from "@/lib/utils";

type HighlighterProps = {
  children: React.ReactNode;
  className?: string;
};

export function Highlighter({ children, className }: HighlighterProps) {
  return (
    <mark
      className={cn(
        "bg-highlight rounded-[4px_10px_6px_12px/10px_4px_12px_6px] px-1.5 py-px text-inherit not-italic",
        className,
      )}
    >
      {children}
    </mark>
  );
}
