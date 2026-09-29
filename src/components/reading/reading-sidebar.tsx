"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Headphones } from "lucide-react";

import { LevelBadge } from "@/components/ui/level-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";
import type {
  ReadingPassageSummary,
  ReadingTopic,
} from "@/types/reading";
import { READING_TOPICS } from "@/types/reading";

type ReadingSidebarProps = {
  passages: ReadingPassageSummary[];
  activeSlug: string;
  progress: { done: number; total: number };
};

export function ReadingSidebar({
  passages,
  activeSlug,
  progress,
}: ReadingSidebarProps) {
  const [topic, setTopic] = useState<ReadingTopic | "all">("all");
  const [level, setLevel] = useState<CefrLevel | "all">("all");

  const filtered = useMemo(() => {
    return passages.filter((p) => {
      if (topic !== "all" && p.topic !== topic) return false;
      if (level !== "all" && p.level !== level) return false;
      return true;
    });
  }, [passages, topic, level]);

  const pct = Math.round((progress.done / progress.total) * 100);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-[22px] border border-soft-border bg-soft p-5 text-on-glass lg:w-[300px]">
      <div>
        <h1 className="font-hand m-0 text-5xl leading-none">Reading</h1>
        <p className="mt-1 text-[13px] text-on-glass-2">
          Luyện đọc hằng ngày · 64 passages
        </p>
      </div>

      <div>
        <label className="sr-only" htmlFor="reading-topic">
          Topic
        </label>
        <select
          id="reading-topic"
          value={topic}
          onChange={(e) =>
            setTopic(e.target.value as ReadingTopic | "all")
          }
          className="h-10 w-full appearance-none rounded-xl border border-soft-border bg-[rgba(255,240,220,.12)] px-3 text-sm font-bold text-on-glass"
        >
          <option value="all">All topics</option>
          {READING_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div
        role="group"
        aria-label="Filter by level"
        className="flex flex-wrap gap-1.5"
      >
        <Chip pressed={level === "all"} onClick={() => setLevel("all")}>
          All
        </Chip>
        {CEFR_LEVELS.map((lv) => (
          <Chip
            key={lv}
            pressed={level === lv}
            onClick={() => setLevel(lv)}
          >
            <LevelBadge level={lv} />
          </Chip>
        ))}
      </div>

      <nav
        aria-label="Reading passages"
        className="flex max-h-[min(48vh,520px)] flex-col gap-2 overflow-y-auto pr-1"
      >
        {filtered.map((p) => {
          const active = p.slug === activeSlug;
          return (
            <Link
              key={p.slug}
              href={`/reading/${p.slug}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-[14px] border border-transparent bg-paper/95 p-3 text-ink shadow-[var(--paper-shadow)] transition-transform hover:-translate-y-0.5",
                active &&
                  "border-primary shadow-[inset_0_0_0_1.5px_var(--primary)]",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-kick text-[11px] font-extrabold tracking-[0.14em] uppercase">
                  {p.topic}
                </span>
                <div className="flex-1" />
                <LevelBadge level={p.level} />
                {p.completed ? (
                  <Check
                    className="size-4 text-kick"
                    strokeWidth={3}
                    aria-label="Completed"
                  />
                ) : null}
              </div>
              <div className="mt-1 text-[15px] leading-snug font-extrabold">
                {p.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-muted">
                <span>{p.minutes} min read</span>
                {p.inProgress ? (
                  <span className="font-hand text-sm text-accent">
                    Reading…
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[8px_14px_10px_12px] bg-paper p-4 text-ink shadow-[var(--paper-shadow)]">
        <div className="font-hand text-xl">This week</div>
        <div className="mt-1 flex items-baseline text-sm font-bold">
          <span>
            {progress.done} of {progress.total} passages read
          </span>
          <div className="flex-1" />
          <span>{pct}%</span>
        </div>
        <ProgressBar
          className="mt-2"
          value={pct}
          aria-label="Weekly reading progress"
        />
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Headphones className="size-3.5" aria-hidden />
          Listen to this passage
        </div>
      </div>
    </aside>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-[var(--radius-pill)] border px-2.5 text-xs font-bold",
        pressed
          ? "border-primary bg-primary text-on-primary"
          : "border-soft-border bg-[rgba(255,240,220,.1)] text-on-glass",
      )}
    >
      {children}
    </button>
  );
}
