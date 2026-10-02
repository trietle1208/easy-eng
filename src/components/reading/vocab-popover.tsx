"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Highlighter } from "@/components/marks/highlighter";
import { createWordAction } from "@/lib/actions/create-word";
import type { VocabHighlight } from "@/types/reading";
import type { PartOfSpeech } from "@/types/vocabulary";

type VocabPopoverProps = {
  vocab: VocabHighlight;
};

function mapPos(raw: string): PartOfSpeech {
  if (raw.startsWith("adj")) return "adjective";
  if (raw.startsWith("adv")) return "adverb";
  if (raw.startsWith("verb")) return "verb";
  if (raw.startsWith("phrase")) return "phrase";
  if (raw.startsWith("prep")) return "preposition";
  if (raw.startsWith("conj")) return "conjunction";
  if (raw.startsWith("interj")) return "interjection";
  return "noun";
}

export function VocabPopover({ vocab }: VocabPopoverProps) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function addToVocabulary() {
    startTransition(async () => {
      try {
        await createWordAction({
          word: vocab.word,
          ipa: vocab.ipa,
          partOfSpeech: mapPos(vocab.partOfSpeech),
          level: vocab.level,
          meaningVi: vocab.meaningVi,
          definitionEn: "",
          examples: [],
          wordSetId: "at-the-airport",
          notes: "From reading passage",
        });
        setAdded(true);
      } catch {
        try {
          await createWordAction({
            word: vocab.word,
            ipa: vocab.ipa,
            partOfSpeech: mapPos(vocab.partOfSpeech),
            level: vocab.level,
            meaningVi: vocab.meaningVi,
            examples: [],
            newWordSetTitle: "From reading",
            notes: "From reading passage",
          });
          setAdded(true);
        } catch {
          /* keep Add label */
        }
      }
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
