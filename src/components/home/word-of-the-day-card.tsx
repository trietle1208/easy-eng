"use client";

import { Volume2 } from "lucide-react";

import { Highlighter } from "@/components/marks/highlighter";
import { StickyNote } from "@/components/notebook/sticky-note";
import { LevelBadge } from "@/components/ui/level-badge";
import type { WordOfTheDay } from "@/types/home";

type WordOfTheDayCardProps = {
  word: WordOfTheDay;
};

export function WordOfTheDayCard({ word }: WordOfTheDayCardProps) {
  const parts = word.example.split(word.exampleHighlight);

  function playPronunciation() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(word.word);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <StickyNote color="yellow" rotate={1.6} className="gap-2.5">
      <div className="font-hand text-[19px] tracking-[0.06em] text-accent">
        WORD OF THE DAY · Từ của ngày
      </div>

      <div className="flex items-center gap-3">
        <span className="font-hand text-[clamp(2rem,5vw,3.125rem)] leading-none text-ink-2">
          {word.word}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Play pronunciation"
          onClick={playPronunciation}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface text-ink"
        >
          <Volume2 className="size-5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-line">{word.ipa}</span>
        <span className="rounded-[var(--radius-pill)] border-[1.5px] border-line px-2.5 py-1 text-xs font-bold text-ink">
          {word.partOfSpeech}
        </span>
        <LevelBadge level={word.level} />
      </div>

      <div className="text-lg font-extrabold leading-snug">{word.meaningVi}</div>

      <p className="m-0 text-[15px] leading-relaxed text-line italic">
        “
        {parts[0]}
        <Highlighter>{word.exampleHighlight}</Highlighter>
        {parts.slice(1).join(word.exampleHighlight)}
        ”
      </p>

      <button
        type="button"
        className="font-hand self-start text-[21px] text-kick"
      >
        + Add to my words
      </button>
    </StickyNote>
  );
}
