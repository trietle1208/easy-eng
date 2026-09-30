"use client";

import Link from "next/link";
import {
  Bell,
  Menu,
  Trophy,
  X,
} from "lucide-react";
import { useState } from "react";

import { MainNav } from "@/components/layout/main-nav";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import {
  UserMenu,
  type HeaderUser,
} from "@/components/layout/user-menu";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type HeaderProps = {
  className?: string;
  user: HeaderUser | null;
};

export function Header({ className, user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

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

        {user ? (
          <>
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
          </>
        ) : null}

        <UserMenu user={user} />

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
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="rounded-xl px-3 py-3 text-base font-bold text-on-glass hover:bg-soft"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile · {user.name.split(/\s+/)[0]}
                </Link>
                <button
                  type="button"
                  className="rounded-xl px-3 py-3 text-left text-base font-bold text-on-glass hover:bg-soft"
                  onClick={() => void onSignOut()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/sign-in"
                className="rounded-xl px-3 py-3 text-base font-bold text-on-glass hover:bg-soft"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
