"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type MobileCollapsibleAsideProps = {
  title: string;
  titleVi?: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

/**
 * Single aside: always expanded on lg+, collapsible below so long lesson
 * lists don't dominate the first mobile viewport.
 */
export function MobileCollapsibleAside({
  title,
  titleVi,
  children,
  className,
  defaultOpen = false,
}: MobileCollapsibleAsideProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className={cn("flex w-full shrink-0 flex-col", className)}>
      <button
        type="button"
        className="mb-3 flex w-full items-center gap-3 rounded-[18px] border border-soft-border bg-soft px-4 py-3 text-left text-on-glass lg:hidden"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0 flex-1">
          <span className="font-hand block text-2xl leading-none">{title}</span>
          {titleVi ? (
            <span className="mt-0.5 block text-xs text-on-glass-2">{titleVi}</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        id={panelId}
        className={cn(!open && "hidden lg:block", open && "block")}
      >
        {children}
      </div>
    </div>
  );
}
