"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Mascot } from "@/components/mascot/mascot";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ThemeSwitcherProps = {
  className?: string;
};

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted ? (theme ?? "default") : "default";
  const isBlossom = active === "blossom";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "ibtn relative inline-flex size-[46px] items-center justify-center rounded-full border border-soft-border bg-pill text-on-glass backdrop-blur-[10px]",
            className,
          )}
          aria-label={
            isBlossom
              ? "Theme: Blossom (pink). Change theme"
              : "Theme: Default (green). Change theme"
          }
        >
          <Mascot pose="face" size={30} className="pointer-events-none" />
          <span
            aria-hidden
            className={cn(
              "absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-[color:var(--hole)]",
              isBlossom ? "bg-primary" : "bg-primary",
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" aria-label="Choose a theme">
        <DropdownMenuLabel>Theme · Giao diện</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={active}
          onValueChange={(value) => setTheme(value)}
        >
          <DropdownMenuRadioItem value="default" className="gap-3 py-2.5">
            <ThemeOption
              title="Default · green"
              subtitle="Ếch xanh"
              kind="frog"
            />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="blossom" className="gap-3 py-2.5">
            <ThemeOption
              title="Blossom · pink"
              subtitle="Bông the foal"
              kind="foal"
            />
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeOption({
  title,
  subtitle,
  kind,
}: {
  title: string;
  subtitle: string;
  kind: "frog" | "foal";
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/mascot/${kind}/face.svg`}
        alt=""
        width={36}
        height={36}
        className="size-9 object-contain"
      />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-extrabold text-ink">{title}</span>
        <span className="text-muted text-xs">{subtitle}</span>
      </span>
    </span>
  );
}
