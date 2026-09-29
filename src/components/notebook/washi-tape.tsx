import { cn } from "@/lib/utils";

type WashiTapeProps = {
  variant?: "cream" | "stripe" | "lavender" | "peach";
  className?: string;
};

const variants: Record<NonNullable<WashiTapeProps["variant"]>, string> = {
  cream:
    "bg-[rgba(255,250,235,.62)] border border-white/50 shadow-[0_1px_2px_rgba(0,0,0,.08)]",
  stripe:
    "bg-[repeating-linear-gradient(45deg,rgba(244,167,185,.92)_0_7px,rgba(255,251,250,.88)_7px_14px)] shadow-[0_1px_3px_rgba(60,20,40,.15)]",
  lavender:
    "bg-[repeating-linear-gradient(45deg,rgba(217,200,240,.95)_0_7px,rgba(255,251,250,.88)_7px_14px)] shadow-[0_1px_3px_rgba(60,20,40,.15)]",
  peach:
    "bg-[repeating-linear-gradient(90deg,rgba(255,201,168,.95)_0_8px,rgba(255,251,250,.85)_8px_16px)] shadow-[0_1px_3px_rgba(60,20,40,.15)]",
};

export function WashiTape({ variant = "cream", className }: WashiTapeProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -top-3 left-1/2 z-10 h-6 w-24 -ml-12 -rotate-4",
        variants[variant],
        className,
      )}
    />
  );
}
