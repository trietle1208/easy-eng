"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Pencil } from "lucide-react";

import { ContinueSection } from "@/components/home/continue-section";
import { DailyGoalCard } from "@/components/home/daily-goal-card";
import { HomeHero } from "@/components/home/home-hero";
import { WordOfTheDayCard } from "@/components/home/word-of-the-day-card";
import { LevelChips } from "@/components/ui/level-chips";
import type { CefrLevel } from "@/types/cefr";
import type {
  ContinueItem,
  DailyGoal,
  Greeting,
  SectionEntry,
  WordOfTheDay,
} from "@/types/home";

type HomeViewProps = {
  greeting: Greeting;
  goal: DailyGoal;
  word: WordOfTheDay;
  continueItems: ContinueItem[];
  sections: SectionEntry[];
};

export function HomeView({
  greeting,
  goal,
  word,
  continueItems,
  sections,
}: HomeViewProps) {
  const [level, setLevel] = useState<"all" | CefrLevel>("all");

  const filteredContinue = useMemo(() => {
    if (level === "all") return continueItems;
    return continueItems.filter((item) => item.level === level);
  }, [continueItems, level]);

  const filteredSections = useMemo(() => {
    if (level === "all") return sections;
    return sections.map((section) => ({
      ...section,
      subtitle:
        section.id === "grammar"
          ? `Filtered · ${level} · Ngữ pháp`
          : `Filtered · ${level} · Từ vựng`,
    }));
  }, [sections, level]);

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-11">
      <div className="flex min-w-0 flex-1 flex-col gap-10 lg:max-w-[700px] lg:shrink-0 lg:gap-[42px]">
        <HomeHero greeting={greeting} wordsLeft={goal.wordsLeftForGoal} />
        <ContinueSection items={filteredContinue} />

        <section className="flex flex-col gap-[18px]">
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
            <h2 className="font-hand m-0 text-[clamp(1.5rem,3vw,2.05rem)] text-on-glass">
              Pick your level
            </h2>
            <span className="text-sm text-on-glass-2">
              Chọn trình độ phù hợp
            </span>
          </div>

          <LevelChips value={level} onChange={setLevel} />

          <div className="grid gap-[18px] sm:grid-cols-2">
            {filteredSections.map((section) => {
              const Icon = section.id === "grammar" ? Pencil : BookOpen;
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className="flex items-center gap-[18px] rounded-[22px] border border-soft-border bg-soft px-[22px] py-5 text-on-glass"
                >
                  <span
                    className={
                      section.id === "grammar"
                        ? "flex size-[60px] shrink-0 items-center justify-center rounded-[18px] bg-primary text-on-primary"
                        : "flex size-[60px] shrink-0 items-center justify-center rounded-[18px] bg-sticky text-accent"
                    }
                  >
                    <Icon className="size-7" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-hand text-[32px] leading-none">
                      {section.title}
                    </span>
                    <span className="text-sm text-on-glass-2">
                      {section.subtitle}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-[22px] shrink-0"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-10 pt-0 lg:gap-10 lg:pt-2.5">
        <DailyGoalCard goal={goal} />
        <WordOfTheDayCard word={word} />
      </div>
    </div>
  );
}
