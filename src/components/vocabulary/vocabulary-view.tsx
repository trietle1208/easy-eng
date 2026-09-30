"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Flashcard } from "@/components/vocabulary/flashcard";
import { WordSetCard } from "@/components/vocabulary/word-set-card";
import { StickyNote } from "@/components/notebook/sticky-note";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { startWordSetAction } from "@/lib/actions/vocabulary";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";
import type {
  ReviewDue,
  Word,
  WordSet,
  WordSetTopic,
} from "@/types/vocabulary";
import { WORD_SET_TOPICS } from "@/types/vocabulary";

type VocabularyViewProps = {
  sets: WordSet[];
  topicCounts: Record<WordSetTopic | "all", number>;
  review: ReviewDue | null;
};

export function VocabularyView({
  sets,
  topicCounts,
  review: initialReview,
}: VocabularyViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [topic, setTopic] = useState<WordSetTopic | "all">("all");
  const [review, setReview] = useState<ReviewDue | null>(initialReview);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setReview(initialReview);
  }, [initialReview]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sets.filter((set) => {
      if (level !== "all" && set.level !== level) return false;
      if (topic !== "all" && set.topic !== topic) return false;
      if (!q) return true;
      return (
        set.title.toLowerCase().includes(q) ||
        set.titleVi.toLowerCase().includes(q) ||
        set.topic.toLowerCase().includes(q)
      );
    });
  }, [sets, query, level, topic]);

  function refresh() {
    router.refresh();
  }

  function onGraded(next: ReviewDue | null) {
    setReview(next);
    refresh();
  }

  function startFirstSet() {
    const target = filtered[0] ?? sets[0];
    if (!target) return;
    startTransition(async () => {
      await startWordSetAction(target.id);
      refresh();
    });
  }

  function onEditWord(word: Word) {
    router.push(`/vocabulary/new?edit=${encodeURIComponent(word.id)}`);
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-hand m-0 text-[clamp(2.5rem,6vw,3rem)] leading-none text-on-glass">
              Vocabulary
            </h1>
            <p className="mt-1 text-sm text-on-glass-2">
              Từ vựng theo chủ đề · {topicCounts.all} sets
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/vocabulary/new">
              <Plus className="size-4" aria-hidden />
              Add word
            </Link>
          </Button>
        </div>

        <label className="relative block">
          <span className="sr-only">Search vocabulary</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-glass-2"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vocabulary"
            className="h-12 w-full rounded-[var(--radius-pill)] border border-soft-border bg-soft pr-4 pl-12 text-base font-semibold text-on-glass placeholder:text-on-glass-2/70"
          />
        </label>

        <div
          role="group"
          aria-label="Filter by level"
          className="flex flex-wrap gap-2"
        >
          <FilterChip
            pressed={level === "all"}
            onClick={() => setLevel("all")}
            label="All"
          />
          {CEFR_LEVELS.map((lv) => (
            <FilterChip
              key={lv}
              pressed={level === lv}
              onClick={() => setLevel(lv)}
              label={<LevelBadge level={lv} />}
            />
          ))}
        </div>

        <div
          role="group"
          aria-label="Filter by topic"
          className="flex flex-wrap gap-2"
        >
          <TopicChip
            pressed={topic === "all"}
            onClick={() => setTopic("all")}
            label="All topics"
            count={topicCounts.all}
          />
          {WORD_SET_TOPICS.map((t) => (
            <TopicChip
              key={t}
              pressed={topic === t}
              onClick={() => setTopic(t)}
              label={t}
              count={topicCounts[t]}
            />
          ))}
        </div>

        <div className="flex items-baseline gap-3">
          <h2 className="font-hand m-0 text-[28px] text-on-glass">Word sets</h2>
          <span className="text-sm text-on-glass-2">
            Bộ từ · sorted by title
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((set) => (
            <WordSetCard key={set.id} set={set} onChanged={refresh} />
          ))}
          {filtered.length === 0 ? (
            <p className="col-span-full text-on-glass-2">
              No word sets match these filters.
            </p>
          ) : null}
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[340px]">
        <StickyNote color="yellow" rotate={-1.2} className="gap-3 text-ink">
          <div className="font-hand text-[22px] leading-tight">
            Review due today
          </div>
          <p className="m-0 text-sm text-muted">
            Ôn lại trước khi quên · spaced repetition
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-hand text-4xl leading-none">
              {review?.count ?? 0}
            </span>
            <span className="text-sm font-bold">words</span>
            <div className="flex-1" />
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (review) {
                  document
                    .getElementById("review-flashcard")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
                startFirstSet();
              }}
              className="font-hand text-xl text-kick disabled:opacity-50"
            >
              Review
            </button>
          </div>
        </StickyNote>

        {review ? (
          <div id="review-flashcard">
            <Flashcard
              word={review.word}
              setTitle={review.setTitle}
              cardIndex={review.cardIndex}
              cardTotal={review.cardTotal}
              cardId={review.cardId}
              onGraded={onGraded}
              onDeleted={refresh}
              onEdit={onEditWord}
            />
          </div>
        ) : (
          <StickyNote color="pink" rotate={1} className="gap-2 text-ink">
            <div className="font-hand text-xl">Nothing due right now</div>
            <p className="m-0 text-sm text-muted">
              Start a word set to create review cards, or come back when
              something is due.
            </p>
            <Button
              type="button"
              size="sm"
              disabled={pending || sets.length === 0}
              onClick={startFirstSet}
            >
              Start a set
            </Button>
          </StickyNote>
        )}
      </aside>
    </div>
  );
}

function FilterChip({
  pressed,
  onClick,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  label: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 text-sm font-bold",
        pressed
          ? "border-primary bg-primary text-on-primary"
          : "border-soft-border bg-[rgba(255,240,220,.1)] text-on-glass",
      )}
    >
      {label}
    </button>
  );
}

function TopicChip({
  pressed,
  onClick,
  label,
  count,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] border px-3 text-sm font-bold",
        pressed
          ? "border-primary bg-primary text-on-primary"
          : "border-soft-border bg-[rgba(255,240,220,.1)] text-on-glass",
      )}
    >
      {label}
      <span className="opacity-80">{count}</span>
    </button>
  );
}
