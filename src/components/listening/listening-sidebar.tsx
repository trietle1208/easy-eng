"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { formatTime } from "@/components/listening/audio-player";
import { LevelBadge } from "@/components/ui/level-badge";
import { SelectField } from "@/components/ui/select-field";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";
import type {
  ListeningLessonSummary,
  ListeningTopic,
} from "@/types/listening";
import { LISTENING_TOPICS } from "@/types/listening";

type ListeningSidebarProps = {
  lessons: ListeningLessonSummary[];
  activeSlug: string;
};

export function ListeningSidebar({
  lessons,
  activeSlug,
}: ListeningSidebarProps) {
  const [topic, setTopic] = useState<ListeningTopic | "all">("all");
  const [level, setLevel] = useState<CefrLevel | "all">("all");

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      if (topic !== "all" && l.topic !== topic) return false;
      if (level !== "all" && l.level !== level) return false;
      return true;
    });
  }, [lessons, topic, level]);

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-[22px] border border-soft-border bg-soft p-5 text-on-glass lg:w-[300px]">
      <div>
        <h1 className="font-hand m-0 text-5xl leading-none">Listening</h1>
        <p className="mt-1 text-[13px] text-on-glass-2">
          Luyện nghe mỗi ngày · 48 lessons
        </p>
      </div>

      <SelectField
        id="listening-topic"
        aria-label="Topic"
        variant="soft"
        value={topic}
        onValueChange={(next) => setTopic(next as ListeningTopic | "all")}
        options={[
          { value: "all", label: "All topics" },
          ...LISTENING_TOPICS.map((t) => ({ value: t, label: t })),
        ]}
      />

      <div
        role="group"
        aria-label="Filter by level"
        className="flex flex-wrap gap-1.5"
      >
        <Chip pressed={level === "all"} onClick={() => setLevel("all")}>
          All
        </Chip>
        {CEFR_LEVELS.map((lv) => (
          <Chip key={lv} pressed={level === lv} onClick={() => setLevel(lv)}>
            <LevelBadge level={lv} />
          </Chip>
        ))}
      </div>

      <nav
        aria-label="Listening lessons"
        className="flex max-h-[min(56vh,640px)] flex-col gap-2 overflow-y-auto pr-1"
      >
        {filtered.map((lesson) => {
          const active = lesson.slug === activeSlug;
          return (
            <Link
              key={lesson.slug}
              href={`/listening/${lesson.slug}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-[14px] border border-transparent bg-paper/95 p-3 text-ink shadow-[var(--paper-shadow)] transition-transform hover:-translate-y-0.5",
                active &&
                  "border-primary shadow-[inset_0_0_0_1.5px_var(--primary)]",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-kick text-[11px] font-extrabold tracking-[0.14em] uppercase">
                  {lesson.topic}
                </span>
                <div className="flex-1" />
                <LevelBadge level={lesson.level} />
                {lesson.completed ? (
                  <Check
                    className="size-4 text-kick"
                    strokeWidth={3}
                    aria-label="Completed"
                  />
                ) : null}
              </div>
              <div className="mt-1 text-[15px] leading-snug font-extrabold">
                {lesson.title}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold text-muted">
                <span>{formatTime(lesson.durationSeconds)}</span>
                {lesson.inProgress ? (
                  <span className="font-hand text-sm text-accent">
                    In progress
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>
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
