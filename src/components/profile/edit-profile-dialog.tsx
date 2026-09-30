"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateProfileAction } from "@/lib/actions/update-profile";
import { CEFR_LEVELS, CEFR_LABELS, type CefrLevel } from "@/types/cefr";
import type { UserProfile } from "@/types/profile";

const TIMEZONES = [
  "Asia/Ho_Chi_Minh",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
] as const;

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  timezone: string;
  goalText: string | null;
};

export function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  timezone,
  goalText,
}: EditProfileDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [level, setLevel] = useState<CefrLevel>(profile.level);
  const [tz, setTz] = useState(timezone);
  const [goal, setGoal] = useState(goalText ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile.displayName);
    setLevel(profile.level);
    setTz(timezone);
    setGoal(goalText ?? "");
    setError(null);
  }, [open, profile, timezone, goalText]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateProfileAction({
          displayName,
          level,
          timezone: tz,
          goalText: goal.trim() || null,
        });
        onOpenChange(false);
        router.refresh();
      } catch {
        setError("Could not save profile. Check your inputs and try again.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your display name, level, and timezone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-extrabold tracking-wide text-kick uppercase">
              Display name
            </span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={80}
              className="h-11 rounded-[10px] border-2 border-line bg-surface px-3 text-[15px] font-bold text-ink"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-extrabold tracking-wide text-kick uppercase">
              Current level
            </span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as CefrLevel)}
              className="h-11 rounded-[10px] border-2 border-line bg-surface px-3 text-[15px] font-bold text-ink"
            >
              {CEFR_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l} — {CEFR_LABELS[l]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-extrabold tracking-wide text-kick uppercase">
              Timezone
            </span>
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="h-11 rounded-[10px] border-2 border-line bg-surface px-3 text-[15px] font-bold text-ink"
            >
              {!TIMEZONES.includes(tz as (typeof TIMEZONES)[number]) ? (
                <option value={tz}>{tz}</option>
              ) : null}
              {TIMEZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-extrabold tracking-wide text-kick uppercase">
              Goal (optional)
            </span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={120}
              placeholder="IELTS 6.5"
              className="h-11 rounded-[10px] border-2 border-line bg-surface px-3 text-[15px] font-bold text-ink"
            />
          </label>

          {error ? (
            <p className="m-0 text-sm font-bold text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
