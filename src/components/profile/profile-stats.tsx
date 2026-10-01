import { BookOpen, Clock, Flame, Pencil } from "lucide-react";

import { StickyNote } from "@/components/notebook/sticky-note";
import type { UserStats } from "@/types/profile";

type ProfileStatsProps = {
  stats: UserStats;
};

const cards = [
  {
    key: "streak",
    color: "yellow" as const,
    rotate: -1.6,
    icon: Flame,
    iconClass: "text-[color:var(--accent)]",
    value: (s: UserStats) => `${s.streakDays} days`,
    label: "Current streak",
    sub: (s: UserStats) => `Chuỗi ngày học · best ${s.bestStreakDays}`,
  },
  {
    key: "words",
    color: "green" as const,
    rotate: 1.2,
    icon: BookOpen,
    iconClass: "text-on-primary",
    value: (s: UserStats) => s.wordsLearned.toLocaleString("en-US"),
    label: "Words learned",
    sub: (s: UserStats) => `Từ đã thuộc · +${s.wordsThisWeek} this week`,
  },
  {
    key: "grammar",
    color: "pink" as const,
    rotate: -0.8,
    icon: Pencil,
    iconClass: "text-danger",
    value: (s: UserStats) => String(s.grammarLessonsDone),
    label: "Grammar lessons done",
    sub: (s: UserStats) => `Bài ngữ pháp · of ${s.grammarLessonsTotal}`,
  },
  {
    key: "hours",
    color: "blue" as const,
    rotate: 1.8,
    icon: Clock,
    iconClass: "text-level-a2",
    value: (s: UserStats) => `${s.studyHours} h`,
    label: "Study hours",
    sub: (s: UserStats) => `Giờ học · ${s.studyHoursThisWeekLabel}`,
  },
];

export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <section
      aria-label="Stats"
      className="grid grid-cols-1 gap-5 pt-1 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="group/stat transition-transform duration-200 ease-out hover:-translate-y-1.5"
          >
            <StickyNote
              color={card.color}
              rotate={card.rotate}
              className="gap-1 rounded-[2px_2px_18px_2px] px-[22px] pt-[26px] pb-5 text-ink shadow-[var(--sticky-shadow)] transition-[box-shadow,filter] duration-200 group-hover/stat:shadow-[0_20px_34px_rgba(25,12,4,.45),0_6px_12px_rgba(25,12,4,.2)] group-hover/stat:brightness-[1.03]"
            >
              <div
                className={`flex size-10 items-center justify-center rounded-full border-2 border-line bg-white/55 ${card.iconClass}`}
              >
                <Icon className="size-[22px]" aria-hidden strokeWidth={2} />
              </div>
              <div className="font-hand mt-2 text-[clamp(2.25rem,4vw,3.625rem)] leading-[0.95] text-ink-2">
                {card.value(stats)}
              </div>
              <div className="text-base leading-tight font-extrabold">
                {card.label}
              </div>
              <div className="text-[13px] text-[color:var(--muted)]">
                {card.sub(stats)}
              </div>
            </StickyNote>
          </div>
        );
      })}
    </section>
  );
}
