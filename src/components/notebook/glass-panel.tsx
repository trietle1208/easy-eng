import { cn } from "@/lib/utils";

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
};

export function GlassPanel({
  children,
  className,
  as: Comp = "div",
}: GlassPanelProps) {
  return (
    <Comp
      className={cn(
        "rounded-[var(--radius-glass)] border border-soft-border bg-glass text-on-glass shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] backdrop-saturate-[1.2]",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
