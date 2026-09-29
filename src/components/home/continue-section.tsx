import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { LevelBadge } from "@/components/ui/level-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import type { ContinueItem } from "@/types/home";

type ContinueSectionProps = {
  items: ContinueItem[];
};

const rotations = ["-rotate-[0.8deg]", "rotate-[0.6deg]", "-rotate-[0.4deg]"];

export function ContinueSection({ items }: ContinueSectionProps) {
  return (
    <section className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h2 className="font-hand m-0 text-[clamp(1.5rem,3vw,2.05rem)] text-on-glass">
          Continue where you left off
        </h2>
        <span className="text-sm text-on-glass-2">Học tiếp bài đang dở</span>
        <div className="hidden flex-1 sm:block" />
        <Link
          href="/grammar"
          className="text-sm font-extrabold text-headline hover:brightness-110"
        >
          See all
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing in progress"
          description="Chưa có bài đang học. Pick a lesson to start."
          className="py-8"
        />
      ) : (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {items.map((item, i) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex w-[250px] shrink-0 flex-col gap-2.5 rounded-[6px_14px_8px_12px] bg-paper p-[18px_18px_16px] text-ink shadow-[var(--paper-shadow)] transition-transform hover:-translate-y-0.5 md:w-auto",
                rotations[i % rotations.length],
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-kick text-xs font-extrabold tracking-[0.16em] uppercase">
                  {item.kind === "grammar" ? "Grammar" : "Vocabulary"}
                </span>
                <div className="flex-1" />
                <LevelBadge level={item.level} />
              </div>
              <div className="text-lg leading-snug font-extrabold">
                {item.title}
              </div>
              <div className="text-[13px] text-muted">{item.subtitle}</div>
              <ProgressBar
                value={item.progress}
                aria-label={`${item.title} progress`}
              />
              <div className="flex items-center text-[13px] font-extrabold">
                <span>{item.progress}%</span>
                <div className="flex-1" />
                <span className="font-hand text-[21px] text-link">Resume</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
