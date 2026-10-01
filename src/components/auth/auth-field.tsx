import { Children, cloneElement, isValidElement } from "react";

import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

/** Boxed notebook input — thick border + hard offset shadow. */
export const authInputClass =
  "w-full rounded-2xl border-[3px] border-line bg-surface px-4 py-3 text-base text-ink outline-none placeholder:text-muted/55 shadow-[3px_3px_0_var(--line)] focus-visible:border-kick focus-visible:shadow-[3px_3px_0_var(--kick)]";

/** Invalid state — red border/shadow so the field itself calls attention. */
export const authInputErrorClass =
  "border-danger bg-danger-bg shadow-[3px_3px_0_color-mix(in_srgb,var(--danger)_55%,var(--line))] focus-visible:border-danger focus-visible:shadow-[3px_3px_0_var(--danger)]";

/** Primary auth CTA — forest fill, hard stamp shadow. */
export const authSubmitClass =
  "h-[52px] w-full rounded-2xl border-[3px] border-line bg-kick text-base font-extrabold text-on-glass shadow-[4px_4px_0_var(--line)] hover:-translate-y-px hover:brightness-105 active:translate-y-0.5 active:shadow-[2px_2px_0_var(--line)]";

export function AuthField({
  id,
  label,
  error,
  optional,
  hint,
  children,
  className,
}: AuthFieldProps) {
  const control = Children.map(children, (child) => {
    if (!isValidElement<{ className?: string; "aria-invalid"?: boolean }>(child)) {
      return child;
    }
    return cloneElement(child, {
      "aria-invalid": Boolean(error) || undefined,
      className: cn(child.props.className, error && authInputErrorClass),
    });
  });

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-sm font-extrabold",
          error ? "text-danger" : "text-ink",
        )}
      >
        {label}
        {optional ? (
          <span className="ml-2 text-xs font-semibold text-muted">optional</span>
        ) : (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="m-0 rounded-xl border-2 border-danger/35 bg-danger-bg px-2.5 py-1.5 text-sm font-semibold text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
