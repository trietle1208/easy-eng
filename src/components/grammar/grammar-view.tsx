"use client";

import { useMemo, useState } from "react";

import { GrammarLessonPanel } from "@/components/grammar/grammar-lesson-panel";
import { GrammarSidebar } from "@/components/grammar/grammar-sidebar";
import { GrammarTipBanner } from "@/components/grammar/grammar-tip-banner";
import { MobileCollapsibleAside } from "@/components/layout/mobile-collapsible-aside";
import type { CefrLevel } from "@/types/cefr";
import type {
  AdjacentLessons,
  GrammarLesson,
  GrammarTree,
} from "@/types/grammar";

type GrammarViewProps = {
  tree: GrammarTree;
  lesson: GrammarLesson;
  adjacent: AdjacentLessons;
};

export function GrammarView({ tree, lesson, adjacent }: GrammarViewProps) {
  const [level, setLevel] = useState<CefrLevel | "all">("all");
  const [familyId, setFamilyId] = useState("all");
  const [groupId, setGroupId] = useState("all");

  const filteredTree = useMemo(() => {
    const families = tree.families
      .filter((family) => familyId === "all" || family.id === familyId)
      .map((family) => ({
        ...family,
        groups: family.groups
          .filter((group) => groupId === "all" || group.id === groupId)
          .map((group) => ({
            ...group,
            lessons: group.lessons.filter(
              (l) => level === "all" || l.level === level,
            ),
          }))
          .filter((group) => group.lessons.length > 0),
      }))
      .filter((family) => family.groups.length > 0);

    return { ...tree, families };
  }, [tree, level, familyId, groupId]);

  return (
    <div className="flex flex-col gap-8 lg:gap-[62px]">
      <GrammarTipBanner />
      <div className="flex min-h-0 flex-col gap-8 lg:flex-row lg:gap-8">
        <MobileCollapsibleAside
          title="Browse grammar"
          titleVi="Danh sách bài · tap to expand"
          className="lg:w-[300px]"
        >
          <GrammarSidebar
            tree={filteredTree}
            activeSlug={lesson.slug}
            level={level}
            familyId={familyId}
            groupId={groupId}
            onLevelChange={setLevel}
            onFamilyChange={setFamilyId}
            onGroupChange={setGroupId}
          />
        </MobileCollapsibleAside>
        <GrammarLessonPanel lesson={lesson} adjacent={adjacent} />
      </div>
    </div>
  );
}
