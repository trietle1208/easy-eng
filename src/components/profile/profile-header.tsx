"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { Mascot } from "@/components/mascot/mascot";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import type { UserProfile } from "@/types/profile";

type ProfileHeaderProps = {
  profile: UserProfile;
  timezone: string;
  goalText: string | null;
};

export function ProfileHeader({
  profile,
  timezone,
  goalText,
}: ProfileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-[30px]">
      <div className="relative size-[120px] shrink-0">
        <div
          className="flex size-[120px] items-center justify-center rounded-full border-[5px] border-surface bg-primary-soft shadow-[0_10px_24px_rgba(0,0,0,.3)]"
          aria-hidden
        >
          <span className="font-hand text-[54px] leading-none text-on-primary">
            {profile.initials}
          </span>
        </div>
        <Mascot
          pose="face"
          size={54}
          className="pointer-events-none absolute -right-[22px] -bottom-2 rotate-[10deg] drop-shadow-[0_4px_6px_rgba(0,0,0,.3)]"
          alt=""
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <h1 className="font-hand m-0 text-[clamp(2rem,5vw,3.5rem)] leading-none text-on-glass">
          {profile.displayName}
        </h1>
        <div className="flex flex-wrap items-center gap-2.5 text-[15px] text-on-glass-2">
          <LevelBadge level={profile.level} className="px-2.5 py-1.5 text-[13px]" />
          <span className="font-extrabold text-on-glass">{profile.levelLabel}</span>
          <span aria-hidden>·</span>
          <span>{profile.memberSinceLabel}</span>
          <span aria-hidden>·</span>
          <span>{profile.goalLabel}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="shrink-0 self-start sm:self-center"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-[18px]" aria-hidden />
        Edit profile
      </Button>

      <EditProfileDialog
        open={open}
        onOpenChange={setOpen}
        profile={profile}
        timezone={timezone}
        goalText={goalText}
      />
    </section>
  );
}
