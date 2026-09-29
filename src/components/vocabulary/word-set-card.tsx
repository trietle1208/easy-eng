import { LevelBadge } from "@/components/ui/level-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { WordSet } from "@/types/vocabulary";

type WordSetCardProps = {
  set: WordSet;
};

export function WordSetCard({ set }: WordSetCardProps) {
  const pct =
    set.wordCount === 0
      ? 0
      : Math.round((set.learnedCount / set.wordCount) * 100);

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-[6px_14px_8px_12px] bg-paper p-4 text-ink shadow-[var(--paper-shadow)]",
        set.status === "done" && "opacity-95",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
          {set.topic}
        </span>
        <div className="flex-1" />
        <LevelBadge level={set.level} />
      </div>
      <h3 className="m-0 text-lg leading-snug font-extrabold">{set.title}</h3>
      <p className="m-0 text-sm text-muted">{set.titleVi}</p>
      <div className="flex items-baseline text-sm font-bold">
        <span>{set.wordCount}</span>
        <span className="ml-1 font-semibold text-muted">words</span>
        <div className="flex-1" />
        {set.status === "done" ? (
          <span className="font-hand text-lg text-kick">Done!</span>
        ) : set.status === "new" ? (
          <span className="font-hand text-lg text-accent">New</span>
        ) : (
          <span>
            {set.learnedCount}/{set.wordCount}
          </span>
        )}
      </div>
      <ProgressBar value={pct} aria-label={`${set.title} progress`} />
    </article>
  );
}
