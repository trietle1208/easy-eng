"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Headphones,
  Layers,
  Pencil,
} from "lucide-react";

import { NAV_ITEMS, type NavKey } from "@/lib/nav";
import { cn } from "@/lib/utils";

const icons = {
  grammar: Pencil,
  vocabulary: Layers,
  reading: BookOpen,
  listening: Headphones,
} as const;

type MainNavProps = {
  className?: string;
};

function activeKey(pathname: string): NavKey | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/profile")) return "profile";
  const hit = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
  return hit?.key ?? null;
}

export function MainNav({ className }: MainNavProps) {
  const pathname = usePathname();
  const active = activeKey(pathname);

  return (
    <nav
      aria-label="Main"
      className={cn("hidden items-center gap-2 md:flex", className)}
    >
      {NAV_ITEMS.map((item) => {
        const Icon = icons[item.key];
        const on = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-[var(--radius-pill)] border px-[18px] text-[15px] font-bold backdrop-blur-[10px] transition-colors",
              on
                ? "border-primary bg-primary text-on-primary"
                : "border-soft-border bg-pill text-on-glass hover:text-white",
            )}
            aria-current={on ? "page" : undefined}
          >
            <Icon className="size-[18px]" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
