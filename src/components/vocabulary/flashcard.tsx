"use client";

import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";

import { Highlighter } from "@/components/marks/highlighter";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { LevelBadge } from "@/components/ui/level-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Word } from "@/types/vocabulary";

type FlashcardProps = {
  word: Word;
  setTitle: string;
  cardIndex: number;
  cardTotal: number;
};

export function Flashcard({
  word,
  setTitle,
  cardIndex,
  cardTotal,
}: FlashcardProps) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setFlipped((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function speak(lang: "en-GB" | "en-US") {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(word.word);
    utter.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  return (
    <NotebookPage
      withRules
      className="flex flex-col gap-4 rounded-[8px_16px_12px_10px] p-5"
    >
      <div className="flex items-center gap-2 text-[13px] font-bold text-muted">
        <span>{setTitle}</span>
        <div className="flex-1" />
        <span>
          Card {cardIndex} of {cardTotal}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="radius-sketch relative min-h-[220px] border-2 border-line bg-surface p-5 text-left"
        aria-label={flipped ? "Show word" : "Show meaning"}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-[var(--radius-pill)] border-[1.5px] border-line px-2.5 py-1 text-xs font-bold">
            {word.partOfSpeech}
          </span>
          <LevelBadge level={word.level} />
          <div className="flex-1" />
          <span className="font-hand text-sm text-muted">tap card to flip</span>
        </div>

        {!flipped ? (
          <div className="flex flex-col gap-3">
            <div className="font-hand text-[42px] leading-none text-ink-2">
              {word.word}
            </div>
            <div className="font-mono text-sm text-line">{word.ipa}</div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Play UK pronunciation"
                onClick={(e) => {
                  e.stopPropagation();
                  speak("en-GB");
                }}
                className="inline-flex items-center gap-1 rounded-full border-2 border-line bg-paper px-3 py-1 text-xs font-bold"
              >
                <Volume2 className="size-3.5" aria-hidden />
                UK
              </button>
              <button
                type="button"
                aria-label="Play US pronunciation"
                onClick={(e) => {
                  e.stopPropagation();
                  speak("en-US");
                }}
                className="inline-flex items-center gap-1 rounded-full border-2 border-line bg-paper px-3 py-1 text-xs font-bold"
              >
                <Volume2 className="size-3.5" aria-hidden />
                US
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
              Nghĩa tiếng Việt
            </div>
            <div className="text-xl font-extrabold">{word.meaningVi}</div>
            {word.definitionEn ? (
              <p className="m-0 text-sm leading-relaxed text-muted italic">
                {word.definitionEn}
              </p>
            ) : null}
            <div className="text-kick text-xs font-extrabold tracking-[0.14em] uppercase">
              Examples
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {word.examples.map((ex) => (
                <li key={ex.en} className="text-sm leading-relaxed">
                  <span>{highlightWord(ex.en, word.word)}</span>
                  {ex.vi ? (
                    <div className="mt-0.5 text-muted italic">{ex.vi}</div>
                  ) : null}
                </li>
              ))}
            </ul>
            {word.collocations?.length ? (
              <p className="m-0 text-xs text-muted">
                Often with: {word.collocations.join(" · ")}
              </p>
            ) : null}
          </div>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFlipped(true)}
        >
          Still learning
        </Button>
        <Button type="button" size="sm" onClick={() => setFlipped(false)}>
          Know it
        </Button>
      </div>
      <p className="m-0 text-center text-[11px] font-semibold text-muted">
        Shortcuts: 1 still learning · 2 know it · Space flip
      </p>
    </NotebookPage>
  );
}

function highlightWord(sentence: string, word: string) {
  const idx = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (idx < 0) return sentence;
  const before = sentence.slice(0, idx);
  const match = sentence.slice(idx, idx + word.length);
  const after = sentence.slice(idx + word.length);
  return (
    <>
      {before}
      <Highlighter className={cn("font-semibold")}>{match}</Highlighter>
      {after}
    </>
  );
}
