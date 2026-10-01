import { cn } from "@/lib/utils";

type AuthAlertProps = {
  tone?: "danger" | "success" | "info";
  children: React.ReactNode;
  className?: string;
};

const toneStyles = {
  danger:
    "border-danger bg-danger-bg text-danger shadow-[3px_3px_0_color-mix(in_srgb,var(--danger)_55%,var(--line))]",
  success:
    "border-success bg-[color:var(--sticky-green)] text-success shadow-[3px_3px_0_color-mix(in_srgb,var(--success)_45%,var(--line))]",
  info: "border-line bg-surface text-ink shadow-[3px_3px_0_var(--line)]",
} as const;

const toneLabel = {
  danger: "Error",
  success: "Success",
  info: "Note",
} as const;

export function AuthAlert({
  tone = "danger",
  children,
  className,
}: AuthAlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-2xl border-[3px] px-3.5 py-3",
        toneStyles[tone],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black leading-none",
          tone === "danger" && "border-danger",
          tone === "success" && "border-success",
          tone === "info" && "border-line",
        )}
      >
        {tone === "danger" ? "!" : tone === "success" ? "✓" : "i"}
      </span>
      <p className="m-0 text-sm leading-snug font-semibold">
        <span className="sr-only">{toneLabel[tone]}: </span>
        {children}
      </p>
    </div>
  );
}
