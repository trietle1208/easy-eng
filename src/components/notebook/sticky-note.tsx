import { cn } from "@/lib/utils";

type StickyNoteProps = {
  children: React.ReactNode;
  className?: string;
  color?: "yellow" | "pink" | "green" | "blue";
  rotate?: number;
  withTape?: boolean;
};

const colorClass = {
  yellow: "bg-sticky",
  pink: "bg-sticky-pink",
  green: "bg-sticky-green",
  blue: "bg-sticky-blue",
} as const;

export function StickyNote({
  children,
  className,
  color = "yellow",
  rotate = 1.6,
  withTape = true,
}: StickyNoteProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-2.5 rounded-br-[20px] px-6 pt-7 pb-5 shadow-[var(--sticky-shadow)]",
        colorClass[color],
        className,
      )}
      style={{
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {withTape ? (
        <span
          className="pointer-events-none absolute -top-[13px] left-1/2 h-[26px] w-[92px] -ml-[46px] -rotate-4 border border-white/50 bg-[rgba(255,250,235,.62)] shadow-[0_1px_2px_rgba(0,0,0,.08)]"
          aria-hidden
        />
      ) : null}
      {children}
    </div>
  );
}
