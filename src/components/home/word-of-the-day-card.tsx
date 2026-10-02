"use client";

import { useState, useTransition } from "react";
import { Volume2 } from "lucide-react";

import { Highlighter } from "@/components/marks/highlighter";
import { StickyNote } from "@/components/notebook/sticky-note";
import { LevelBadge } from "@/components/ui/level-badge";
import { createWordAction } from "@/lib/actions/create-word";
import type { WordOfTheDay } from "@/types/home";
import type { PartOfSpeech } from "@/types/vocabulary";

type WordOfTheDayCardProps = {
  word: WordOfTheDay;
};

function mapPos(raw: string): PartOfSpeech {
  const s = raw.toLowerCase();
  if (s.startsWith("adj")) return "adjective";
  if (s.startsWith("adv")) return "adverb";
  if (s.startsWith("verb")) return "verb";
  if (s.startsWith("phrase")) return "phrase";
  if (s.startsWith("prep")) return "preposition";
  if (s.startsWith("conj")) return "conjunction";
  if (s.startsWith("interj")) return "interjection";
  return "noun";
}

export function WordOfTheDayCard({ word }: WordOfTheDayCardProps) {
  const parts = word.example.split(word.exampleHighlight);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function playPronunciation() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(word.word);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  function addToWords() {
    setError(null);
    startTransition(async () => {
      try {
        await createWordAction({
          word: word.word,
          ipa: word.ipa,
          partOfSpeech: mapPos(word.partOfSpeech),
          level: word.level,
          meaningVi: word.meaningVi,
          definitionEn: "",
          examples: [word.example],
          newWordSetTitle: "Word of the day",
          notes: "From Word of the day",
        });
        setAdded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not add word");
      }
    });
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
        disabled={pending || added}
        onClick={addToWords}
        className="font-hand self-start text-[21px] text-kick disabled:opacity-60"
      >
        {added ? "Added!" : "+ Add to my words"}
      </button>
      {error ? (
        <p className="m-0 text-xs font-semibold text-danger">{error}</p>
      ) : null}
    </StickyNote>
  );
}
