"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Headphones,
  Home,
  Layers,
  Pencil,
} from "lucide-react";

import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

const mobileItems = [
  { key: "home", href: "/", label: "Home", Icon: Home },
  ...NAV_ITEMS.map((item) => ({
    key: item.key,
    href: item.href,
    label: item.mobileLabel,
    Icon:
      item.key === "grammar"
        ? Pencil
        : item.key === "vocabulary"
          ? Layers
          : item.key === "reading"
            ? BookOpen
            : Headphones,
  })),
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-soft-border bg-[color-mix(in_srgb,var(--glass)_92%,transparent)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {mobileItems.map((item) => {
          const on =
            item.key === "home"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.Icon;
          return (
            <li key={item.key} className="flex-1">
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-bold",
                  on ? "text-primary" : "text-on-glass-2",
                )}
              >
                <Icon
                  className={cn("size-5", on && "stroke-[2.5]")}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
