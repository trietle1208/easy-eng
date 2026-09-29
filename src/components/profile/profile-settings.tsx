"use client";

import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateSettings } from "@/lib/data/profile";
import { cn } from "@/lib/utils";
import type {
  AppThemeId,
  InterfaceLanguage,
  UpdateSettingsInput,
  UserSettings,
  WeekdayKey,
} from "@/types/profile";

type ProfileSettingsProps = {
  initial: UserSettings;
};

const WEEKDAYS: { key: WeekdayKey; label: string; full: string }[] = [
  { key: "mon", label: "M", full: "Monday" },
  { key: "tue", label: "T", full: "Tuesday" },
  { key: "wed", label: "W", full: "Wednesday" },
  { key: "thu", label: "T", full: "Thursday" },
  { key: "fri", label: "F", full: "Friday" },
  { key: "sat", label: "S", full: "Saturday" },
  { key: "sun", label: "S", full: "Sunday" },
];

const WORD_OPTS = [10, 20, 30, 50] as const;
const GRAMMAR_OPTS = [1, 2, 3] as const;

export function ProfileSettings({ initial }: ProfileSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<UserSettings>(initial);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !theme) return;
    const next = (theme === "blossom" ? "blossom" : "default") as AppThemeId;
    setDraft((d) => (d.theme === next ? d : { ...d, theme: next }));
  }, [theme, mounted]);

  function patch(partial: UpdateSettingsInput) {
    setDraft((d) => ({ ...d, ...partial }));
    if (partial.theme) {
      setTheme(partial.theme);
    }
  }

  function toggleDay(key: WeekdayKey) {
    setDraft((d) => {
      const has = d.reminderDays.includes(key);
      const reminderDays = has
        ? d.reminderDays.filter((k) => k !== key)
        : [...d.reminderDays, key];
      return { ...d, reminderDays };
    });
  }

  function onSave() {
    startTransition(async () => {
      const next = await updateSettings(draft);
      setDraft(next);
      if (next.theme) setTheme(next.theme);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
    });
  }

  const activeTheme: AppThemeId = mounted
    ? theme === "blossom"
      ? "blossom"
      : "default"
    : draft.theme;

  return (
    <section className="flex flex-col gap-[18px] rounded-[10px_16px_12px_8px] bg-paper p-5 text-ink shadow-[var(--paper-shadow)] md:p-7 md:px-[30px]">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h2 className="font-hand m-0 text-[clamp(1.5rem,3vw,2rem)] leading-none">
          Settings
        </h2>
        <span className="text-sm text-muted">· Cài đặt</span>
        <div className="flex-1" />
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="h-11 px-5 text-[15px]"
          onClick={onSave}
          disabled={pending}
        >
          {pending ? "Saving…" : savedFlash ? "Saved!" : "Save changes"}
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-0">
        {/* Daily goal */}
        <div className="flex flex-col gap-3.5 lg:pr-7">
          <div>
            <div className="text-xs font-extrabold tracking-[0.16em] text-kick uppercase">
              Daily goal
            </div>
            <div className="mt-1 text-[13px] text-muted">Mục tiêu mỗi ngày</div>
          </div>

          <fieldset>
            <legend id="lbl-words" className="mb-2 text-[15px] font-bold">
              New words per day
            </legend>
            <SegGroup labelledBy="lbl-words">
              {WORD_OPTS.map((n) => (
                <SegButton
                  key={n}
                  selected={draft.wordsPerDay === n}
                  onClick={() => patch({ wordsPerDay: n })}
                >
                  {n}
                </SegButton>
              ))}
            </SegGroup>
          </fieldset>

          <fieldset>
            <legend id="lbl-gr" className="mb-2 text-[15px] font-bold">
              Grammar lessons per day
            </legend>
            <SegGroup labelledBy="lbl-gr">
              {GRAMMAR_OPTS.map((n) => (
                <SegButton
                  key={n}
                  selected={draft.grammarPerDay === n}
                  onClick={() => patch({ grammarPerDay: n })}
                >
                  {n}
                </SegButton>
              ))}
            </SegGroup>
          </fieldset>
        </div>

        {/* Reminders */}
        <div className="flex flex-col gap-3.5 border-t-2 border-dashed border-line/20 pt-6 lg:border-t-0 lg:border-l-2 lg:px-7 lg:pt-0">
          <div>
            <div className="text-xs font-extrabold tracking-[0.16em] text-kick uppercase">
              Reminders
            </div>
            <div className="mt-1 text-[13px] text-muted">Nhắc nhở học tập</div>
          </div>

          <SwitchRow
            label="Daily study reminder"
            sub="Push + email"
            checked={draft.dailyReminder}
            onChange={(v) => patch({ dailyReminder: v })}
          />

          <div className="flex min-h-11 items-center gap-3">
            <label htmlFor="rtime" className="flex-1 text-[15px] font-bold">
              Remind me at
            </label>
            <input
              id="rtime"
              type="time"
              value={draft.reminderTime}
              onChange={(e) => patch({ reminderTime: e.target.value })}
              className="font-mono h-[42px] rounded-[10px] border-2 border-line bg-surface px-2.5 text-[15px] font-bold text-ink"
            />
          </div>

          <div role="group" aria-label="Reminder days" className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((d) => {
              const on = draft.reminderDays.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-pressed={on}
                  aria-label={d.full}
                  onClick={() => toggleDay(d.key)}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border-2 border-line text-[13px] font-extrabold",
                    on ? "bg-primary-soft" : "bg-surface",
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          <SwitchRow
            label="Streak rescue alert"
            sub="At 21:30 if I haven't studied yet"
            checked={draft.streakRescue}
            onChange={(v) => patch({ streakRescue: v })}
          />
        </div>

        {/* Language */}
        <div className="flex flex-col gap-3.5 border-t-2 border-dashed border-line/20 pt-6 lg:border-t-0 lg:border-l-2 lg:pl-7 lg:pt-0">
          <div>
            <div className="text-xs font-extrabold tracking-[0.16em] text-kick uppercase">
              Interface language
            </div>
            <div className="mt-1 text-[13px] text-muted">Ngôn ngữ giao diện</div>
          </div>

          <SegGroup labelledBy={undefined} ariaLabel="Interface language">
            {(
              [
                ["en", "English"],
                ["vi", "Tiếng Việt"],
              ] as const
            ).map(([code, label]) => (
              <SegButton
                key={code}
                selected={draft.interfaceLanguage === code}
                onClick={() =>
                  patch({ interfaceLanguage: code as InterfaceLanguage })
                }
              >
                {label}
              </SegButton>
            ))}
          </SegGroup>

          <SwitchRow
            label="Show Vietnamese hints"
            sub="Short explanations under lessons"
            checked={draft.showVietnameseHints}
            onChange={(v) => patch({ showVietnameseHints: v })}
          />
          <SwitchRow
            label="Auto-play pronunciation"
            sub="On flashcards"
            checked={draft.autoPlayPronunciation}
            onChange={(v) => patch({ autoPlayPronunciation: v })}
          />
        </div>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-6 border-t-2 border-dashed border-line/20 pt-[22px] md:flex-row md:items-center md:gap-8">
        <div className="w-full shrink-0 md:w-[220px]">
          <div className="text-xs font-extrabold tracking-[0.16em] text-kick uppercase">
            Theme
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-muted">
            Giao diện · changes colours and mascot only — your progress stays
            the same.
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Theme"
          className="flex flex-col gap-4 sm:flex-row sm:gap-[22px]"
        >
          <ThemeCard
            selected={activeTheme === "default"}
            onSelect={() => patch({ theme: "default" })}
            title="Default"
            subtitle="sage & wood"
            mascotNote="Frog mascot"
            kind="default"
          />
          <ThemeCard
            selected={activeTheme === "blossom"}
            onSelect={() => patch({ theme: "blossom" })}
            title="Blossom"
            subtitle="rose & peach"
            mascotNote="Bông the foal"
            kind="blossom"
          />
        </div>
      </div>
    </section>
  );
}

function SegGroup({
  children,
  labelledBy,
  ariaLabel,
}: {
  children: React.ReactNode;
  labelledBy?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      className="inline-flex overflow-hidden rounded-xl border-2 border-line bg-surface"
    >
      {children}
    </div>
  );
}

function SegButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "h-[42px] min-w-[54px] border-r-[1.5px] border-line/30 px-3.5 text-[15px] font-extrabold last:border-r-0",
        selected ? "bg-primary text-on-primary" : "bg-surface text-ink",
      )}
    >
      {children}
    </button>
  );
}

function SwitchRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold">{label}</div>
        <div className="text-[13px] text-muted">{sub}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-8 w-[54px] shrink-0 rounded-full border-2 border-line",
          checked ? "bg-[color:var(--heat-3)]" : "bg-surface",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-5 rounded-full transition-[left]",
            checked
              ? "left-[26px] bg-surface shadow-[0_0_0_2px_var(--line)]"
              : "left-1 bg-line",
          )}
        />
      </button>
    </div>
  );
}

function ThemeCard({
  selected,
  onSelect,
  title,
  subtitle,
  mascotNote,
  kind,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  subtitle: string;
  mascotNote: string;
  kind: AppThemeId;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-2.5 rounded-2xl bg-surface p-2.5 pb-3 text-left",
        selected
          ? "border-[3px] border-line shadow-[0_4px_0_var(--line)]"
          : "border-2 border-line/25",
      )}
    >
      <span
        className={cn(
          "relative block h-[124px] w-full max-w-[230px] overflow-hidden rounded-[10px] sm:w-[230px]",
          kind === "default"
            ? "bg-[linear-gradient(165deg,#553520_0%,#8e5a2e_55%,#e8ae6c_100%)]"
            : "bg-[linear-gradient(165deg,#6b3350_0%,#c77d96_50%,#f7c9b8_100%)]",
        )}
      >
        <span
          className={cn(
            "absolute inset-2.5 rounded-[10px]",
            kind === "default"
              ? "bg-[rgba(50,33,20,.6)]"
              : "bg-[rgba(88,38,58,.7)]",
          )}
        />
        <span
          className={cn(
            "absolute inset-[20px_20px_20px_84px] rounded bg-paper",
            kind === "default"
              ? "bg-[repeating-linear-gradient(transparent_0_9px,rgba(94,128,160,.28)_9px_10px)_#fbf5e6]"
              : "bg-[repeating-linear-gradient(transparent_0_9px,rgba(200,110,140,.3)_9px_10px)_#fff5f1]",
          )}
        />
        <span className="absolute top-8 left-24 h-[7px] w-[66px] rounded bg-line" />
        <span
          className={cn(
            "absolute top-[50px] left-24 h-[7px] w-[90px] rounded",
            kind === "default" ? "bg-sticky" : "bg-sticky-pink",
          )}
        />
        <span
          className={cn(
            "absolute top-[78px] left-24 h-4 w-[52px] rounded-lg border-[1.5px] border-line",
            kind === "default" ? "bg-primary" : "bg-primary",
          )}
        />
        <span className="absolute bottom-[18px] left-[18px]">
          {/* Force preview mascot by theme via image path */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/mascot/${kind === "blossom" ? "foal" : "frog"}/face.svg`}
            alt=""
            width={58}
            height={50}
            className="object-contain"
          />
        </span>
      </span>
      <span className="text-[15px] font-semibold leading-snug">
        <b className="font-extrabold">{title}</b> · {subtitle}
        <br />
        <span className="text-[13px] font-medium text-muted">{mascotNote}</span>
      </span>
      {selected ? (
        <span
          className="absolute -top-3 -right-3 flex size-8 items-center justify-center rounded-full border-[3px] border-surface bg-success text-white"
          aria-hidden
        >
          <Check className="size-4" strokeWidth={3.2} />
        </span>
      ) : null}
    </button>
  );
}
