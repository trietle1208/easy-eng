import { ReadingPassagePanel } from "@/components/reading/reading-passage-panel";
import { ReadingSidebar } from "@/components/reading/reading-sidebar";
import { ReadingTipBanner } from "@/components/reading/reading-tip-banner";
import { MobileCollapsibleAside } from "@/components/layout/mobile-collapsible-aside";
import type {
  ReadingPassage,
  ReadingPassageSummary,
} from "@/types/reading";

type ReadingViewProps = {
  passages: ReadingPassageSummary[];
  passage: ReadingPassage;
  progress: { done: number; total: number };
};

export function ReadingView({
  passages,
  passage,
  progress,
}: ReadingViewProps) {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <ReadingTipBanner />
      <div className="flex min-h-0 flex-col gap-6 lg:flex-row lg:gap-8">
        <MobileCollapsibleAside
          title="Browse reading"
          titleVi="Danh sách bài · tap to expand"
          className="lg:w-[300px]"
        >
          <ReadingSidebar
            passages={passages}
            activeSlug={passage.slug}
            progress={progress}
          />
        </MobileCollapsibleAside>
        <ReadingPassagePanel passage={passage} />
      </div>
    </div>
  );
}
