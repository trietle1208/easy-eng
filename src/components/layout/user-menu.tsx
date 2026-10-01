"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";

export type HeaderUser = {
  name: string;
  initials: string;
};

type UserMenuProps = {
  user: HeaderUser | null;
};

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  if (!user) {
    return (
      <Button asChild size="sm" variant="ghost" className="text-on-glass">
        <Link href="/sign-in">Sign in</Link>
      </Button>
    );
  }

  async function onSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group hidden h-12 items-center gap-2.5 rounded-[var(--radius-pill)] border border-soft-border bg-pill pr-3.5 pl-1.5 text-[15px] font-bold text-on-glass shadow-[0_6px_16px_rgba(0,0,0,.18)] backdrop-blur-[10px] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--pill)_88%,white)] hover:shadow-[0_10px_22px_rgba(0,0,0,.28)] data-[state=open]:translate-y-0 data-[state=open]:shadow-[0_4px_12px_rgba(0,0,0,.2)] sm:inline-flex"
          aria-label="Account menu"
        >
          <span className="font-hand flex size-[38px] items-center justify-center rounded-full bg-primary-soft text-[22px] text-kick ring-2 ring-surface/40">
            {user.initials.slice(0, 2)}
          </span>
          <span className="max-w-[8rem] truncate">
            {user.name.split(/\s+/)[0]}
          </span>
          <ChevronDown
            className="size-4 opacity-80 transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="mb-1.5 flex items-center gap-3 rounded-xl border border-line/15 bg-primary-soft/45 px-3 py-3">
          <span className="font-hand flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-line/20 bg-surface text-[24px] text-kick shadow-[0_4px_10px_rgba(0,0,0,.12)]">
            {user.initials.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <div className="font-hand truncate text-lg leading-none">
              {user.name}
            </div>
            <div className="mt-1 text-xs font-semibold text-muted">
              Your account
            </div>
          </div>
        </div>
        <DropdownMenuItem asChild className="py-2.5">
          <Link href="/profile">
            <UserRound className="size-4" aria-hidden />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="py-2.5 text-danger focus:bg-danger-bg focus:text-danger"
          onSelect={(e) => {
            e.preventDefault();
            void onSignOut();
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
