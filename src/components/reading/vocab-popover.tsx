"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Highlighter } from "@/components/marks/highlighter";
import { createWord } from "@/lib/data/vocabulary";
import type { VocabHighlight } from "@/types/reading";

type VocabPopoverProps = {
  vocab: VocabHighlight;
};

export function VocabPopover({ vocab }: VocabPopoverProps) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function addToVocabulary() {
    startTransition(async () => {
      await createWord({
        word: vocab.word,
        ipa: vocab.ipa,
        partOfSpeech: vocab.partOfSpeech.startsWith("adj")
          ? "adjective"
          : vocab.partOfSpeech.startsWith("adv")
            ? "adverb"
            : vocab.partOfSpeech.startsWith("verb")
              ? "verb"
              : "noun",
        level: vocab.level,
        meaningVi: vocab.meaningVi,
        definitionEn: "",
        examples: [],
        wordSetId: "at-the-airport",
        notes: "From reading passage",
      });
      setAdded(true);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="font-semibold text-ink underline decoration-transparent outline-none focus-visible:rounded-sm"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Vocabulary: ${vocab.word}`}
        >
          <Highlighter className="cursor-pointer">{vocab.word}</Highlighter>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[260px] rotate-[-1.2deg] border-0 bg-sticky p-4 shadow-[var(--sticky-shadow)]"
        onEscapeKeyDown={() => setOpen(false)}
      >
        <div className="font-hand text-[28px] leading-none text-ink-2">
          {vocab.word}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-[var(--radius-pill)] border-[1.5px] border-line px-2 py-0.5 text-xs font-bold">
            {vocab.partOfSpeech}
          </span>
          <span className="font-mono text-line">{vocab.ipa}</span>
        </div>
        <div className="mt-2 text-base font-extrabold">{vocab.meaningVi}</div>
        <button
          type="button"
          disabled={pending || added}
          onClick={addToVocabulary}
          className="font-hand mt-3 inline-flex items-center gap-1 text-lg text-kick disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden />
          {added ? "Added!" : "Add to my vocabulary"}
        </button>
      </PopoverContent>
    </Popover>
  );
}
