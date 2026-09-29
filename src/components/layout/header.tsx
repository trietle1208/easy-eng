"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  Menu,
  Trophy,
  X,
} from "lucide-react";
import { useState } from "react";

import { MainNav } from "@/components/layout/main-nav";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

type HeaderProps = {
  className?: string;
};

export function Header({ className }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "relative z-20 flex h-[60px] items-center gap-3 md:gap-7",
        className,
      )}
    >
      <Link
        href="/"
        aria-label="Easy English home"
        className="flex shrink-0 items-center gap-2.5 text-on-glass"
      >
        <Mascot pose="face" size={42} className="shrink-0" />
        <span className="font-hand text-[28px] leading-none font-normal tracking-tight text-[color:var(--on-glass)] drop-shadow-[0_2px_10px_rgba(0,0,0,.3)] md:text-[30px]">
          Easy English
        </span>
      </Link>

      <MainNav />

      <div className="ml-auto flex items-center gap-2">
        <ThemeSwitcher />

        <button
          type="button"
          className="relative hidden size-[46px] items-center justify-center rounded-full border border-soft-border bg-pill text-on-glass backdrop-blur-[10px] sm:inline-flex"
          aria-label="Notifications, 2 new"
        >
          <Bell className="size-[21px]" aria-hidden />
          <span
            className="bg-notif absolute top-[9px] right-[10px] size-2.5 rounded-full border-2 border-[color:var(--hole)]"
            aria-hidden
          />
        </button>

        <button
          type="button"
          className="hidden size-[46px] items-center justify-center rounded-full border border-soft-border bg-pill text-on-glass backdrop-blur-[10px] md:inline-flex"
          aria-label="Achievements"
        >
          <Trophy className="size-[21px]" aria-hidden />
        </button>

        <Link
          href="/profile"
          aria-label="Your profile"
          className="hidden h-12 items-center gap-2.5 rounded-[var(--radius-pill)] border border-soft-border bg-pill pr-3.5 pl-1.5 text-[15px] font-bold text-on-glass backdrop-blur-[10px] sm:inline-flex"
        >
          <span className="font-hand flex size-[38px] items-center justify-center rounded-full bg-primary-soft text-[22px] text-kick">
            L
          </span>
          Linh
          <ChevronDown className="size-4 opacity-80" aria-hidden />
        </Link>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="absolute top-[calc(100%+10px)] right-0 left-0 z-30 rounded-2xl border border-soft-border bg-glass p-3 shadow-[var(--glass-shadow)] backdrop-blur-[var(--glass-blur)] md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-xl px-3 py-3 text-base font-bold text-on-glass hover:bg-soft"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/profile"
              className="rounded-xl px-3 py-3 text-base font-bold text-on-glass hover:bg-soft"
              onClick={() => setMobileOpen(false)}
            >
              Profile · Linh
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
