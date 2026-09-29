import { MessageSquare, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type FloatingActionsProps = {
  className?: string;
};

export function FloatingActions({ className }: FloatingActionsProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed top-[min(78vh,780px)] right-3 z-30 hidden flex-col gap-3 md:pointer-events-auto md:flex lg:right-6",
        className,
      )}
    >
      <Fab ariaLabel="Search">
        <Search className="size-[22px]" aria-hidden />
      </Fab>
      <Fab ariaLabel="Ask the AI study buddy" primary>
        <Sparkles className="size-[22px]" aria-hidden />
      </Fab>
      <Fab ariaLabel="Send feedback">
        <MessageSquare className="size-[22px]" aria-hidden />
      </Fab>
    </div>
  );
}

function Fab({
  children,
  ariaLabel,
  primary = false,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        "pointer-events-auto flex size-[52px] items-center justify-center rounded-[var(--radius-fab)] border backdrop-blur-[14px]",
        primary
          ? "border-primary bg-primary text-on-primary"
          : "border-soft-border bg-pill text-on-glass",
      )}
    >
      {children}
    </button>
  );
}
