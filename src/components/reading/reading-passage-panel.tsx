"use client";

import { Mascot } from "@/components/mascot/mascot";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { ComprehensionQuiz } from "@/components/reading/comprehension-quiz";
import { VocabPopover } from "@/components/reading/vocab-popover";
import { LevelBadge } from "@/components/ui/level-badge";
import { cn } from "@/lib/utils";
import type { ReadingPassage } from "@/types/reading";
import { useState } from "react";

type ReadingPassagePanelProps = {
  passage: ReadingPassage;
};

export function ReadingPassagePanel({ passage }: ReadingPassagePanelProps) {
  const [showVi, setShowVi] = useState(false);
  const vocabMap = Object.fromEntries(
    passage.vocabulary.map((v) => [v.id, v]),
  );

  return (
    <NotebookPage
      withMargin
      withRings
      ringCount={16}
      withRules
      className="relative flex min-w-0 flex-1 flex-col gap-6 rounded-[6px_18px_18px_6px] py-9 pr-6 pl-[100px] md:pr-12"
    >
      <div className="absolute right-14 bottom-full mb-[-4px]">
        <Mascot pose="read" size={72} alt="" />
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-muted">
          <span className="text-kick tracking-[0.14em] uppercase">
            {passage.familyLabel}
          </span>
          <div className="flex-1" />
          <span>{passage.wordCount} words</span>
          <span>·</span>
          <span>{passage.minutes} min read</span>
          <span>·</span>
          <span>{passage.newWordCount} new words</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-hand m-0 text-[clamp(1.75rem,4vw,2.75rem)] leading-none text-ink-2">
            {passage.title}
          </h2>
          <LevelBadge level={passage.level} className="px-2.5 py-1.5 text-sm" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-ink">Vietnamese translation</span>
          <button
            type="button"
            role="switch"
            aria-checked={showVi}
            onClick={() => setShowVi((v) => !v)}
            className={cn(
              "relative h-8 w-[52px] rounded-full border-2 border-line transition-colors",
              showVi ? "bg-primary" : "bg-surface",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-6 rounded-full border-2 border-line bg-paper transition-transform",
                showVi && "translate-x-[22px]",
              )}
            />
            <span className="sr-only">
              {showVi ? "Hide Vietnamese translation" : "Show Vietnamese translation"}
            </span>
          </button>
          <span className="text-sm text-muted">
            {showVi ? "Ẩn bản dịch" : "Hiện bản dịch"}
          </span>
        </div>
      </header>

      <article className="flex flex-col gap-5 text-[17px] leading-[2] text-ink">
        {passage.paragraphs.map((p) => (
          <div key={p.id} className="flex flex-col gap-1">
            <p className="m-0">
              {p.segments.map((seg, i) => {
                if (seg.type === "text") {
                  return <span key={i}>{seg.text}</span>;
                }
                const vocab = vocabMap[seg.vocabId];
                if (!vocab) return null;
                return <VocabPopover key={seg.vocabId} vocab={vocab} />;
              })}
            </p>
            {showVi ? (
              <p className="m-0 text-[15px] leading-relaxed text-muted italic">
                {p.vi}
              </p>
            ) : null}
          </div>
        ))}
      </article>

      <ComprehensionQuiz slug={passage.slug} questions={passage.questions} />
    </NotebookPage>
  );
}
