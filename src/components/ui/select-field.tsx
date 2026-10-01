"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
  leading?: ReactNode;
};

type SelectFieldProps<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  id?: string;
  "aria-label"?: string;
  /** `soft` = dark glass sidebars (grammar / reading / listening). */
  variant?: "default" | "soft";
  className?: string;
  contentClassName?: string;
};

const triggerVariants = {
  default: cn(
    "h-12 rounded-[12px] border-2 border-line bg-surface px-3 text-[15px] text-ink shadow-[0_2px_0_color-mix(in_srgb,var(--line)_35%,transparent)]",
    "hover:-translate-y-px hover:bg-primary-soft/35 hover:shadow-[0_4px_0_color-mix(in_srgb,var(--line)_40%,transparent)]",
    "data-[state=open]:translate-y-0 data-[state=open]:border-kick/50 data-[state=open]:bg-primary-soft/55 data-[state=open]:shadow-[0_1px_0_color-mix(in_srgb,var(--line)_30%,transparent)]",
  ),
  soft: cn(
    "h-[42px] rounded-xl border border-soft-border bg-[rgba(255,240,220,.14)] px-3 text-[13px] text-on-glass shadow-none",
    "hover:bg-[rgba(255,240,220,.22)] hover:shadow-none",
    "data-[state=open]:border-primary data-[state=open]:bg-[rgba(255,240,220,.22)] data-[state=open]:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_65%,transparent)]",
  ),
} as const;

export function SelectField<T extends string>({
  value,
  onValueChange,
  options,
  id,
  "aria-label": ariaLabel,
  variant = "default",
  className,
  contentClassName,
}: SelectFieldProps<T>) {
  const selected = options.find((o) => o.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          className={cn(
            "group flex w-full items-center gap-2.5 text-left font-bold transition-[transform,box-shadow,background-color,border-color] duration-150",
            triggerVariants[variant],
            className,
          )}
        >
          {selected?.leading ? (
            <span className="shrink-0">{selected.leading}</span>
          ) : null}
          <span className="min-w-0 flex-1 truncate">
            {selected?.label ?? value}
          </span>
          <ChevronDown
            className="size-4 shrink-0 opacity-70 transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "max-h-80 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto border-2 border-line bg-paper p-2 text-ink shadow-[0_18px_40px_rgba(25,12,4,.28)]",
          contentClassName,
        )}
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(v) => onValueChange(v as T)}
        >
          {options.map((opt) => (
            <DropdownMenuRadioItem
              key={opt.value}
              value={opt.value}
              className={cn(
                "items-center gap-2.5 rounded-xl py-2.5 pr-3 text-ink focus:bg-primary-soft data-[state=checked]:bg-primary-soft data-[state=checked]:font-extrabold",
              )}
            >
              {opt.leading ? (
                <span className="shrink-0">{opt.leading}</span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold">{opt.label}</span>
                {opt.description ? (
                  <span className="text-xs font-medium text-muted">
                    {opt.description}
                  </span>
                ) : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
