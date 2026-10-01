import {
  BookOpen,
  Flame,
  Layers,
  Lock,
  Moon,
  Pencil,
  Sun,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Achievement, AchievementIcon } from "@/types/profile";

type AchievementsShelfProps = {
  items: Achievement[];
  earnedCount: number;
  total: number;
};

const iconMap: Record<
  AchievementIcon,
  React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  book: BookOpen,
  flame: Flame,
  cards: Layers,
  pencil: Pencil,
  sun: Sun,
  moon: Moon,
  trophy: Trophy,
};

const colorBg: Record<Achievement["color"], string> = {
  green: "bg-[color:var(--level-a1)]",
  orange: "bg-[color:var(--accent)]",
  blue: "bg-level-a2",
  purple: "bg-level-b1",
  gold: "bg-[color:var(--level-c1)]",
};

export function AchievementsShelf({
  items,
  earnedCount,
  total,
}: AchievementsShelfProps) {
  return (
    <section className="flex flex-col gap-3.5" aria-labelledby="achievements-heading">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2
          id="achievements-heading"
          className="font-hand m-0 text-[clamp(1.6rem,3vw,2.125rem)] leading-none text-on-glass"
        >
          Achievements
        </h2>
        <span className="text-sm text-on-glass-2">
          Huy hiệu · {earnedCount} of {total} earned
        </span>
      </div>

      <div className="overflow-x-clip px-1 md:px-5">
        <div className="relative z-[1] mb-[-8px] grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-8 md:gap-3">
          {items.map((item, i) => {
            const Icon = iconMap[item.icon];
            const rotate = [-6, 5, -3, 7, -5, 3, -4, 6][i] ?? 0;
            return (
              <div
                key={item.id}
                className="mx-auto transition-transform duration-200 ease-out hover:z-[2] hover:scale-110"
              >
                <div
                  className={cn(
                    "stk relative flex size-20 items-center justify-center border-[5px] border-surface text-white shadow-[0_8px_14px_rgba(0,0,0,.35)] transition-shadow duration-200 hover:shadow-[0_14px_24px_rgba(0,0,0,.45)] sm:size-24",
                    item.shape === "round" ? "rounded-full" : "rounded-[26px]",
                    item.earned
                      ? colorBg[item.color]
                      : "bg-[color:var(--muted)] opacity-55 grayscale",
                  )}
                  style={{ transform: `rotate(${rotate}deg)` }}
                  title={
                    item.earned
                      ? `${item.title} · earned`
                      : `${item.title} · locked`
                  }
                >
                  <Icon className="size-9 sm:size-10" aria-hidden />
                  {!item.earned ? (
                    <span
                      className="absolute -right-1.5 -bottom-1 flex size-8 items-center justify-center rounded-full border-2 border-surface bg-line text-on-glass"
                      aria-hidden
                    >
                      <Lock className="size-3.5" />
                    </span>
                  ) : null}
                  <span className="sr-only">
                    {item.earned
                      ? `${item.title}, earned`
                      : `${item.title}, locked`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          aria-hidden
          className="h-[22px] rounded-sm bg-[linear-gradient(var(--accent)_0%,color-mix(in_srgb,var(--accent)_70%,black)_55%,color-mix(in_srgb,var(--hole)_80%,var(--accent))_100%)] shadow-[0_12px_20px_rgba(0,0,0,.35),inset_0_2px_0_rgba(255,255,255,.22)]"
        />

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {items.map((item) => (
            <div
              key={`${item.id}-label`}
              className={cn(
                "flex flex-col gap-0.5 text-center",
                !item.earned && "opacity-75",
              )}
            >
              <b className="font-hand text-[clamp(0.95rem,1.5vw,1.25rem)] leading-tight font-normal text-on-glass">
                {item.title}
              </b>
              <span className="text-xs text-on-glass-2">
                {item.earned
                  ? (item.earnedLabel ?? item.subtitle)
                  : (item.progressLabel ?? item.subtitle)}
                {!item.earned ? " · locked" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
