import { ListeningLessonPanel } from "@/components/listening/listening-lesson-panel";
import { ListeningSidebar } from "@/components/listening/listening-sidebar";
import { ListeningTipBanner } from "@/components/listening/listening-tip-banner";
import { MobileCollapsibleAside } from "@/components/layout/mobile-collapsible-aside";
import type {
  ListeningLesson,
  ListeningLessonSummary,
} from "@/types/listening";

type ListeningViewProps = {
  lessons: ListeningLessonSummary[];
  lesson: ListeningLesson;
  nextSlug?: string | null;
};

export function ListeningView({
  lessons,
  lesson,
  nextSlug,
}: ListeningViewProps) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <ListeningTipBanner />
      <div className="flex min-h-0 flex-col gap-6 lg:flex-row lg:gap-8">
        <MobileCollapsibleAside
          title="Browse listening"
          titleVi="Danh sách bài · tap to expand"
          className="lg:w-[300px]"
        >
          <ListeningSidebar lessons={lessons} activeSlug={lesson.slug} />
        </MobileCollapsibleAside>
        <ListeningLessonPanel lesson={lesson} nextSlug={nextSlug} />
      </div>
    </div>
  );
}
