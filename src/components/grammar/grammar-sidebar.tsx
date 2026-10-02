"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { LevelBadge } from "@/components/ui/level-badge";
import { SelectField } from "@/components/ui/select-field";
import { StickyNote } from "@/components/notebook/sticky-note";
import { cn } from "@/lib/utils";
import type { CefrLevel } from "@/types/cefr";
import { CEFR_LEVELS } from "@/types/cefr";
import type { GrammarTree } from "@/types/grammar";

type GrammarSidebarProps = {
  tree: GrammarTree;
  activeSlug: string;
  level: CefrLevel | "all";
  familyId: string;
  groupId: string;
  onLevelChange: (level: CefrLevel | "all") => void;
  onFamilyChange: (familyId: string) => void;
  onGroupChange: (groupId: string) => void;
};

export function GrammarSidebar({
  tree,
  activeSlug,
  level,
  familyId,
  groupId,
  onLevelChange,
  onFamilyChange,
  onGroupChange,
}: GrammarSidebarProps) {
  const [openFamilies, setOpenFamilies] = useState<Record<string, boolean>>(
    () => Object.fromEntries(tree.families.map((f, i) => [f.id, i === 0])),
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const first = tree.families[0];
    if (!first) return {};
    return Object.fromEntries(
      first.groups.map((g, i) => [g.id, i < 2]),
    );
  });

  const groupOptions = useMemo(() => {
    if (familyId === "all") return tree.groupOptions;
    return tree.groupOptions.filter((g) => g.familyId === familyId);
  }, [tree.groupOptions, familyId]);

  function toggleFamily(id: string) {
    setOpenFamilies((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const progressPct = Math.round(
    (tree.progress.done / tree.progress.total) * 100,
  );

  return (
    <aside className="flex w-full shrink-0 flex-col gap-4 rounded-[22px] border border-soft-border bg-soft p-[24px_18px_22px] text-on-glass lg:w-[300px]">
      <div className="px-1.5">
        <h1 className="font-hand m-0 text-5xl leading-none">Grammar</h1>
        <div className="mt-1 text-[13px] text-on-glass-2">
          {tree.levelCounts.all} lessons · Ngữ pháp theo CEFR
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <SelectField
          id="grammar-family"
          aria-label="Grammar family"
          variant="soft"
          value={familyId}
          onValueChange={(next) => {
            onFamilyChange(next);
            onGroupChange("all");
          }}
          options={[
            { value: "all", label: "All families" },
            ...tree.familyOptions.map((f) => ({
              value: f.id,
              label: f.title,
            })),
          ]}
        />

        <SelectField
          id="grammar-point"
          aria-label="Grammar point"
          variant="soft"
          value={groupId}
          onValueChange={onGroupChange}
          options={[
            { value: "all", label: "All grammar" },
            ...groupOptions.map((g) => ({
              value: g.id,
              label: g.title,
            })),
          ]}
        />
      </div>

      <div
        role="group"
        aria-label="Filter by level"
        className="flex flex-wrap gap-[7px]"
      >
        <LevelCountChip
          pressed={level === "all"}
          onClick={() => onLevelChange("all")}
          label="All"
          count={tree.levelCounts.all}
        />
        {CEFR_LEVELS.map((lv) => (
          <LevelCountChip
            key={lv}
            pressed={level === lv}
            onClick={() => onLevelChange(lv)}
            label={lv}
            count={tree.levelCounts[lv]}
            dotClass={
              {
                A1: "bg-level-a1",
                A2: "bg-level-a2",
                B1: "bg-level-b1",
                B2: "bg-level-b2",
                C1: "bg-level-c1",
              }[lv]
            }
          />
        ))}
      </div>

      <div className="h-px bg-[rgba(255,236,210,.18)]" />

      <nav
        aria-label="Grammar topics"
        className="flex max-h-[min(52vh,560px)] flex-col gap-0.5 overflow-y-auto pr-1"
        onKeyDown={(e) => {
          const links = Array.from(
            e.currentTarget.querySelectorAll<HTMLAnchorElement>("a[href]"),
          );
          if (links.length === 0) return;
          const current = document.activeElement as HTMLElement | null;
          const index = links.findIndex((el) => el === current);
          if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = links[index < 0 ? 0 : Math.min(index + 1, links.length - 1)];
            next?.focus();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev = links[index < 0 ? 0 : Math.max(index - 1, 0)];
            prev?.focus();
          } else if (e.key === "Home") {
            e.preventDefault();
            links[0]?.focus();
          } else if (e.key === "End") {
            e.preventDefault();
            links[links.length - 1]?.focus();
          }
        }}
      >
        {tree.families.map((family) => {
          const familyOpen = openFamilies[family.id] ?? false;
          return (
            <div key={family.id}>
              <button
                type="button"
                aria-expanded={familyOpen}
                onClick={() => toggleFamily(family.id)}
                className="flex min-h-[42px] w-full items-center gap-2 rounded-[10px] px-2 text-left text-base font-extrabold leading-snug text-on-glass"
              >
                {familyOpen ? (
                  <ChevronDown className="size-4 shrink-0" strokeWidth={2.6} />
                ) : (
                  <ChevronRight className="size-4 shrink-0" strokeWidth={2.6} />
                )}
                <span className="min-w-0 flex-1">{family.title}</span>
                <span className="rounded-[var(--radius-pill)] bg-[rgba(255,240,220,.1)] px-2 py-1 text-xs font-bold text-on-glass-2">
                  {family.lessonCount}
                </span>
              </button>

              {familyOpen
                ? family.groups.map((group) => {
                    const groupOpen = openGroups[group.id] ?? false;
                    return (
                      <div key={group.id}>
                        <button
                          type="button"
                          aria-expanded={groupOpen}
                          onClick={() => toggleGroup(group.id)}
                          className="flex min-h-[38px] w-full items-center gap-2 rounded-[10px] py-0 pr-2 pl-[22px] text-left text-sm font-bold leading-snug text-on-glass-2"
                        >
                          {groupOpen ? (
                            <ChevronDown
                              className="size-3.5 shrink-0"
                              strokeWidth={2.6}
                            />
                          ) : (
                            <ChevronRight
                              className="size-3.5 shrink-0"
                              strokeWidth={2.6}
                            />
                          )}
                          <span className="min-w-0 flex-1">{group.title}</span>
                          {!groupOpen ? (
                            <span className="rounded-[var(--radius-pill)] bg-[rgba(255,240,220,.1)] px-2 py-1 text-xs font-bold text-on-glass-2">
                              {group.lessons.length}
                            </span>
                          ) : null}
                        </button>

                        {groupOpen
                          ? group.lessons.map((lesson) => {
                              const active = lesson.slug === activeSlug;
                              return (
                                <Link
                                  key={lesson.slug}
                                  href={`/grammar/${lesson.slug}`}
                                  aria-current={active ? "page" : undefined}
                                  className={cn(
                                    "flex items-start gap-2 rounded-[10px] py-2 pr-2.5 pl-[46px] text-sm font-semibold leading-snug text-on-glass-2 hover:bg-[rgba(255,240,220,.06)] hover:text-white",
                                    active &&
                                      "bg-[rgba(181,217,154,.24)] font-extrabold text-white shadow-[inset_0_0_0_1.5px_rgba(181,217,154,.6)]",
                                  )}
                                >
                                  <span className="min-w-0 flex-1">
                                    {lesson.title}
                                  </span>
                                  <LevelBadge level={lesson.level} />
                                  {lesson.completed ? (
                                    <Check
                                      className="mt-0.5 size-4 shrink-0 text-primary"
                                      strokeWidth={3}
                                      aria-label="Completed"
                                    />
                                  ) : lesson.inProgress ? (
                                    <span
                                      className="mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-on-glass-2"
                                      role="img"
                                      aria-label="In progress"
                                    />
                                  ) : null}
                                </Link>
                              );
                            })
                          : null}
                      </div>
                    );
                  })
                : null}
            </div>
          );
        })}
      </nav>

      <StickyNote
        color="yellow"
        rotate={-1.5}
        className="mt-auto gap-2 !bg-[color:var(--primary-soft)] !px-[18px] !pt-5 !pb-4 text-ink"
      >
        <div className="font-hand text-[22px] leading-tight">
          {tree.progress.familyTitle}
        </div>
        <div className="flex items-baseline text-[13px] font-bold text-kick">
          <span>
            {tree.progress.done} of {tree.progress.total} lessons done
          </span>
          <div className="flex-1" />
          <span>{progressPct}%</span>
        </div>
        <ProgressBar
          value={progressPct}
          className="h-3"
          aria-label="Family progress"
        />
      </StickyNote>
    </aside>
  );
}

function LevelCountChip({
  pressed,
  onClick,
  label,
  count,
  dotClass,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dotClass?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-[34px] items-center gap-1.5 rounded-[var(--radius-pill)] border px-[11px] text-[13px] font-bold",
        pressed
          ? "border-primary bg-primary text-on-primary"
          : "border-soft-border bg-[rgba(255,240,220,.1)] text-on-glass",
      )}
    >
      {dotClass ? (
        <span
          className={cn(
            "size-2 rounded-full border-[1.5px] border-white/70",
            dotClass,
          )}
          aria-hidden
        />
      ) : null}
      {label}{" "}
      <span className="font-semibold opacity-80">{count}</span>
    </button>
  );
}
