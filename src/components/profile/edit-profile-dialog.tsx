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
import { LevelBadge } from "@/components/ui/level-badge";
import { SelectField } from "@/components/ui/select-field";
import { updateProfileAction } from "@/lib/actions/update-profile";
import { CEFR_LEVELS, CEFR_LABELS, type CefrLevel } from "@/types/cefr";
import type { UserProfile } from "@/types/profile";

const TZ_META: Record<string, string> = {
  "Asia/Ho_Chi_Minh": "Vietnam (UTC+7)",
  "Asia/Bangkok": "Thailand (UTC+7)",
  "Asia/Singapore": "Singapore (UTC+8)",
  "Asia/Tokyo": "Japan (UTC+9)",
  "Asia/Shanghai": "China (UTC+8)",
  UTC: "Coordinated Universal Time",
  "Europe/London": "UK (UTC+0/+1)",
  "Europe/Paris": "Central Europe",
  "America/New_York": "US Eastern",
  "America/Los_Angeles": "US Pacific",
  "Australia/Sydney": "Australia East",
};

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
              className="h-11 rounded-[12px] border-2 border-line bg-surface px-3 text-[15px] font-bold text-ink shadow-[0_2px_0_color-mix(in_srgb,var(--line)_35%,transparent)] transition-[box-shadow,background-color] duration-150 focus:bg-primary-soft/25"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-extrabold tracking-wide text-kick uppercase">
              Current level
            </span>
            <SelectField
              id="edit-level"
              aria-label="Current level"
              value={level}
              onValueChange={(v) => setLevel(v)}
              options={CEFR_LEVELS.map((l) => ({
                value: l,
                label: CEFR_LABELS[l],
                description:
                  l === profile.level
                    ? "Your current level"
                    : `CEFR ${l}`,
                leading: <LevelBadge level={l} className="px-2 py-1 text-[12px]" />,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-extrabold tracking-wide text-kick uppercase">
              Timezone
            </span>
            <SelectField
              id="edit-tz"
              aria-label="Timezone"
              value={tz}
              onValueChange={setTz}
              options={[
                ...(!TIMEZONES.includes(tz as (typeof TIMEZONES)[number])
                  ? [
                      {
                        value: tz,
                        label: tz,
                        description: "Saved timezone",
                      },
                    ]
                  : []),
                ...TIMEZONES.map((z) => ({
                  value: z as string,
                  label: z,
                  description: TZ_META[z],
                })),
              ]}
            />
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-extrabold tracking-wide text-kick uppercase">
              Goal (optional)
            </span>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={120}
              placeholder="IELTS 6.5"
              className="h-11 rounded-[12px] border-2 border-line bg-surface px-3 text-[15px] font-bold text-ink shadow-[0_2px_0_color-mix(in_srgb,var(--line)_35%,transparent)] transition-[box-shadow,background-color] duration-150 focus:bg-primary-soft/25"
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
