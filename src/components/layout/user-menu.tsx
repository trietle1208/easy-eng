"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
          className="hidden h-12 items-center gap-2.5 rounded-[var(--radius-pill)] border border-soft-border bg-pill pr-3.5 pl-1.5 text-[15px] font-bold text-on-glass backdrop-blur-[10px] sm:inline-flex"
          aria-label="Account menu"
        >
          <span className="font-hand flex size-[38px] items-center justify-center rounded-full bg-primary-soft text-[22px] text-kick">
            {user.initials.slice(0, 2)}
          </span>
          <span className="max-w-[8rem] truncate">{user.name.split(/\s+/)[0]}</span>
          <ChevronDown className="size-4 opacity-80" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound className="size-4" aria-hidden />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
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
