"use client";

import { Highlighter } from "@/components/marks/highlighter";
import { StickyNote } from "@/components/notebook/sticky-note";
import { LevelBadge } from "@/components/ui/level-badge";
import type { CefrLevel } from "@/types/cefr";
import type { PartOfSpeech } from "@/types/vocabulary";

type LivePreviewProps = {
  word: string;
  ipa: string;
  partOfSpeech: PartOfSpeech;
  level: CefrLevel;
  meaningVi: string;
  example: string;
  setTitle: string;
};

export function LivePreview({
  word,
  ipa,
  partOfSpeech,
  level,
  meaningVi,
  example,
  setTitle,
}: LivePreviewProps) {
  const displayWord = word.trim() || "your word";
  const displayMeaning =
    meaningVi.trim() || "Vietnamese meaning goes here…";
  const sample =
    example.trim() ||
    (word.trim()
      ? `Could you email me the ${word.trim()} for our trip?`
      : "Could you email me the itinerary for our trip?");

  return (
    <div className="flex flex-col gap-3">
      <div className="font-hand text-lg text-muted">Live preview · Xem trước</div>
      <StickyNote color="yellow" rotate={1.2} className="gap-2.5 text-ink">
        <div className="font-hand text-[36px] leading-none text-ink-2">
          {displayWord}
        </div>
        {ipa ? (
          <div className="font-mono text-sm text-line">{ipa}</div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[var(--radius-pill)] border-[1.5px] border-line px-2.5 py-1 text-xs font-bold">
            {partOfSpeech}
          </span>
          <LevelBadge level={level} />
        </div>
        <div className="text-base font-extrabold">{displayMeaning}</div>
        <p className="m-0 text-sm leading-relaxed italic">
          {highlight(sample, displayWord === "your word" ? "itinerary" : displayWord)}
        </p>
        <div className="text-xs font-bold text-muted">
          Will be added to: {setTitle || "—"}
        </div>
      </StickyNote>
    </div>
  );
}

function highlight(sentence: string, word: string) {
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx < 0) return <>“{sentence}”</>;
  return (
    <>
      “
      {sentence.slice(0, idx)}
      <Highlighter>{sentence.slice(idx, idx + word.length)}</Highlighter>
      {sentence.slice(idx + word.length)}
      ”
    </>
  );
}
