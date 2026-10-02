"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Plus, Search } from "lucide-react";

import { Flashcard } from "@/components/vocabulary/flashcard";
import { WordSetCard } from "@/components/vocabulary/word-set-card";
import { StickyNote } from "@/components/notebook/sticky-note";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { SelectField } from "@/components/ui/select-field";
import { startWordSetAction } from "@/lib/actions/vocabulary";
import { foldSearch } from "@/lib/fold-search";
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

const PAGE_SIZE = 24;
const TOPIC_PREVIEW = 8;

type VocabularyViewProps = {
  sets: WordSet[];
  review: ReviewDue | null;
};

export function VocabularyView({
  sets,
  review: initialReview,
}: VocabularyViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [topic, setTopic] = useState<WordSetTopic | "all">("all");
  const [hideEmpty, setHideEmpty] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [review, setReview] = useState<ReviewDue | null>(initialReview);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setReview(initialReview);
  }, [initialReview]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, level, topic, hideEmpty]);

  const matchesQuery = useMemo(() => {
    const q = foldSearch(query);
    return (set: WordSet) => {
      if (!q) return true;
      if (
        foldSearch(set.title).includes(q) ||
        foldSearch(set.titleVi).includes(q) ||
        foldSearch(set.topic).includes(q)
      ) {
        return true;
      }
      return (set.wordHeads ?? []).some((w) => foldSearch(w).includes(q));
    };
  }, [query]);

  // Each facet's counts ignore its own filter so the other options stay useful.
  const visible = useMemo(
    () =>
      sets.filter((s) => matchesQuery(s) && (!hideEmpty || s.wordCount > 0)),
    [sets, matchesQuery, hideEmpty],
  );

  const levelCounts = useMemo(() => {
    const counts = Object.fromEntries(CEFR_LEVELS.map((lv) => [lv, 0])) as Record<
      CefrLevel,
      number
    >;
    for (const s of visible) {
      if (topic === "all" || s.topic === topic) counts[s.level] += 1;
    }
    return counts;
  }, [visible, topic]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      WORD_SET_TOPICS.map((t) => [t, 0]),
    );
    let all = 0;
    for (const s of visible) {
      if (level !== "all" && s.level !== level) continue;
      counts[s.topic] = (counts[s.topic] ?? 0) + 1;
      all += 1;
    }
    return { all, ...counts } as { all: number } & Record<string, number>;
  }, [visible, level]);

  const filtered = useMemo(
    () =>
      visible.filter(
        (s) =>
          (level === "all" || s.level === level) &&
          (topic === "all" || s.topic === topic),
      ),
    [visible, level, topic],
  );

  const paged = filtered.slice(0, visibleCount);
  const hasMoreSets = filtered.length > paged.length;

  const desktopTopics = showAllTopics
    ? WORD_SET_TOPICS
    : WORD_SET_TOPICS.slice(0, TOPIC_PREVIEW);
  const selectedHidden =
    topic !== "all" &&
    !showAllTopics &&
    !desktopTopics.includes(topic);

  function refresh() {
    router.refresh();
  }

  function onGraded(next: ReviewDue | null) {
    setReview(next);
    refresh();
  }

  function startFirstSet() {
    const target =
      filtered.find((s) => s.wordCount > 0) ??
      sets.find((s) => s.wordCount > 0);
    if (!target) return;
    startTransition(async () => {
      await startWordSetAction(target.id);
      refresh();
    });
  }

  function onEditWord(word: Word) {
    router.push(`/vocabulary/new?edit=${encodeURIComponent(word.id)}`);
  }

  const hasStartableSet = sets.some((s) => s.wordCount > 0);

  // Below lg both wrappers are `display: contents`, so their children share one
  // column and are ordered with `order-*`; from lg up they become the sidebar
  // and main column.
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <div className="contents lg:order-2 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-6">
        <div className="order-1 flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-hand m-0 text-[clamp(2.5rem,6vw,3.5rem)] leading-none text-on-glass">
              Vocabulary
            </h1>
            <p className="mt-1.5 text-sm text-on-glass-2">
              Từ vựng theo chủ đề · {sets.length} sets
            </p>
          </div>
          <Button asChild className="hidden shrink-0 md:inline-flex">
            <Link href="/vocabulary/new">
              <Plus className="size-4" aria-hidden />
              Add word
            </Link>
          </Button>
          <Button
            asChild
            size="icon"
            className="shrink-0 md:hidden"
            aria-label="Add word"
          >
            <Link href="/vocabulary/new">
              <Plus className="size-6" aria-hidden />
            </Link>
          </Button>
        </div>

        <label className="relative order-2 block">
          <span className="sr-only">Search vocabulary</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-on-glass-2"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sets or words"
            className="h-14 w-full rounded-full border border-soft-border bg-soft pr-4 pl-12 text-base font-semibold text-on-glass placeholder:text-on-glass-2/70"
          />
        </label>

        {review ? (
          <div
            id="review-flashcard"
            className="order-5 w-full max-w-xl scroll-mt-6"
          >
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
        ) : null}

        <div className="order-6 flex flex-col gap-4 lg:gap-5">
          <div className="flex items-baseline gap-3">
            <h2 className="font-hand m-0 text-[28px] leading-none text-on-glass lg:text-[32px]">
              Word sets
            </h2>
            <span className="text-sm text-on-glass-2">
              <span className="lg:hidden">Bộ từ</span>
              <span className="hidden lg:inline">Bộ từ · sorted by title</span>
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {paged.map((set) => (
              <WordSetCard key={set.id} set={set} onChanged={refresh} />
            ))}
            {filtered.length === 0 ? (
              <p className="col-span-full text-on-glass-2">
                No word sets match these filters.
              </p>
            ) : null}
          </div>
          {hasMoreSets ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Load more ({filtered.length - paged.length} left)
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="contents lg:order-1 lg:flex lg:w-[252px] lg:shrink-0 lg:flex-col lg:gap-7 lg:pt-3">
        {/* Mobile filters */}
        <div className="order-3 flex flex-col gap-4 lg:hidden">
          <div
            role="group"
            aria-label="Filter by level"
            className="flex flex-wrap gap-2"
          >
            <LevelChip
              pressed={level === "all"}
              onClick={() => setLevel("all")}
            >
              All
            </LevelChip>
            {CEFR_LEVELS.map((lv) => (
              <LevelChip
                key={lv}
                pressed={level === lv}
                onClick={() => setLevel(lv)}
                aria-label={`Level ${lv}`}
              >
                <LevelBadge level={lv} />
              </LevelChip>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <SelectField
              variant="soft"
              aria-label="Filter by topic"
              className="h-[42px] !w-auto min-w-[150px] text-sm"
              value={topic}
              onValueChange={setTopic}
              options={[
                { value: "all", label: `Topic: All (${topicCounts.all})` },
                ...WORD_SET_TOPICS.map((t) => ({
                  value: t,
                  label: `${t} (${topicCounts[t]})`,
                })),
              ]}
            />
            <HideEmptyToggle checked={hideEmpty} onChange={setHideEmpty} />
          </div>
        </div>

        {/* Desktop filters */}
        <div className="order-3 hidden flex-col gap-7 lg:flex">
          <section aria-labelledby="vocab-level-label" className="flex flex-col gap-3">
            <SidebarLabel id="vocab-level-label">Level</SidebarLabel>
            <div
              role="group"
              aria-labelledby="vocab-level-label"
              className="flex flex-wrap gap-2"
            >
              <LevelChip
                pressed={level === "all"}
                onClick={() => setLevel("all")}
              >
                All
              </LevelChip>
              {CEFR_LEVELS.map((lv) => (
                <LevelChip
                  key={lv}
                  pressed={level === lv}
                  onClick={() => setLevel(lv)}
                  aria-label={`Level ${lv}, ${levelCounts[lv]} sets`}
                >
                  <LevelBadge level={lv} />
                  <span className="font-bold">{levelCounts[lv]}</span>
                </LevelChip>
              ))}
            </div>
          </section>

          <section aria-labelledby="vocab-topic-label" className="flex flex-col gap-3">
            <SidebarLabel id="vocab-topic-label">Topic</SidebarLabel>
            <div
              role="group"
              aria-labelledby="vocab-topic-label"
              className="flex max-h-[min(52vh,420px)] flex-col gap-1.5 overflow-y-auto pr-1"
            >
              <TopicRow
                pressed={topic === "all"}
                onClick={() => setTopic("all")}
                label="All topics"
                count={topicCounts.all}
              />
              {selectedHidden ? (
                <TopicRow
                  pressed
                  onClick={() => setTopic(topic)}
                  label={topic}
                  count={topicCounts[topic]}
                />
              ) : null}
              {desktopTopics.map((t) => (
                <TopicRow
                  key={t}
                  pressed={topic === t}
                  onClick={() => setTopic(t)}
                  label={t}
                  count={topicCounts[t]}
                />
              ))}
            </div>
            {WORD_SET_TOPICS.length > TOPIC_PREVIEW ? (
              <button
                type="button"
                onClick={() => setShowAllTopics((v) => !v)}
                className="inline-flex items-center gap-1 self-start text-sm font-bold text-on-glass-2 hover:text-on-glass"
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    showAllTopics && "rotate-180",
                  )}
                  aria-hidden
                />
                {showAllTopics
                  ? "Fewer topics"
                  : `More topics (${WORD_SET_TOPICS.length - TOPIC_PREVIEW})`}
              </button>
            ) : null}
          </section>

          <HideEmptyToggle checked={hideEmpty} onChange={setHideEmpty} />
        </div>

        <StickyNote
          color="yellow"
          rotate={-2}
          className="order-4 gap-2 px-6 pt-7 pb-6 text-ink lg:mt-2"
        >
          <div className="text-xs font-extrabold tracking-[0.08em] whitespace-nowrap text-muted uppercase">
            Review due today · Ôn lại
          </div>
          <div className="text-[28px] leading-tight font-extrabold">
            {review?.count ?? 0} words
          </div>
          <p className="m-0 text-[15px] leading-relaxed text-muted">
            {review
              ? "Spaced repetition: review before you forget."
              : "Nothing due right now. Start a word set to create review cards."}
          </p>
          <button
            type="button"
            disabled={pending || (!review && !hasStartableSet)}
            onClick={() => {
              if (review) {
                document
                  .getElementById("review-flashcard")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }
              startFirstSet();
            }}
            className="bg-kick mt-2 h-12 w-full rounded-full text-base font-extrabold text-white shadow-[0_3px_0_rgba(0,0,0,.25)] transition-transform hover:-translate-y-px active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            {review ? "Review now" : "Start a set"}
          </button>
        </StickyNote>
      </div>
    </div>
  );
}

function SidebarLabel({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="m-0 text-xs font-extrabold tracking-[0.14em] text-on-glass uppercase"
    >
      {children}
    </h2>
  );
}

const pressedClass = "border-primary bg-primary text-on-primary";

function LevelChip({
  pressed,
  onClick,
  children,
  "aria-label": ariaLabel,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        "inline-flex h-[38px] items-center gap-1.5 rounded-full border px-3 text-sm font-extrabold",
        pressed
          ? pressedClass
          : "border-soft-border bg-transparent text-on-glass hover:bg-soft",
      )}
    >
      {children}
    </button>
  );
}

function TopicRow({
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
  const unavailable = count === 0 && !pressed;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={unavailable}
      onClick={onClick}
      className={cn(
        "flex h-[35px] w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-extrabold",
        pressed
          ? "bg-primary text-on-primary"
          : "text-on-glass hover:bg-soft",
        unavailable && "text-on-glass-2/60 hover:bg-transparent",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className={cn("text-sm", !pressed && "text-on-glass-2")}>
        {count}
      </span>
    </button>
  );
}

function HideEmptyToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-on-glass">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-md border-2 border-soft-border text-on-primary peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <Check className="size-4" strokeWidth={3.5} />
      </span>
      Hide empty sets
    </label>
  );
}
