"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Headphones,
  Layers,
  Pencil,
} from "lucide-react";
import { LayoutGroup, MotionConfig, motion } from "motion/react";
import { useId } from "react";

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
  const groupId = useId();

  return (
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={groupId}>
        <nav
          aria-label="Main"
          className={cn(
            "hidden items-center gap-1 rounded-[var(--radius-pill)] border border-soft-border bg-pill p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-[10px] md:flex",
            className,
          )}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = icons[item.key];
            const on = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "group relative inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] px-4 text-[15px] font-bold outline-none transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--hole)]",
                  on
                    ? "text-on-primary"
                    : "text-on-glass-2 hover:bg-soft hover:text-on-glass",
                )}
              >
                {on ? (
                  <motion.span
                    layoutId="main-nav-active"
                    className="absolute inset-0 rounded-[var(--radius-pill)] bg-primary shadow-[0_3px_0_var(--primary-shadow),0_8px_18px_rgba(20,40,10,.25)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={cn(
                    "relative size-[18px] transition-transform duration-200",
                    on
                      ? "stroke-[2.5]"
                      : "group-hover:-rotate-6 group-hover:scale-110",
                  )}
                  aria-hidden
                />
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>
    </MotionConfig>
  );
}
