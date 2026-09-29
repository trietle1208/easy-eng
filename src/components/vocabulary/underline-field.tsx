"use client";

import { HandCircle } from "@/components/marks/hand-circle";
import { cn } from "@/lib/utils";

type UnderlineFieldProps = {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function UnderlineField({
  id,
  label,
  error,
  optional,
  hint,
  children,
  className,
}: UnderlineFieldProps) {
  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-extrabold text-ink">
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
      {children}
      {hint && !error ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
      {error ? (
        <div className="mt-1 flex items-start gap-2">
          <HandCircle color="danger">
            <span className="sr-only">Error</span>
            <span aria-hidden className="inline-block size-2" />
          </HandCircle>
          <span className="font-hand text-lg leading-tight text-danger">
            {error}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export const underlineInputClass =
  "w-full border-0 border-b-2 border-line bg-transparent px-0 py-2 font-hand text-xl text-ink outline-none placeholder:text-muted/60 focus-visible:border-kick";
