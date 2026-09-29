"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AddWordForm } from "@/components/vocabulary/add-word-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Word, WordSet } from "@/types/vocabulary";

type AddWordModalProps = {
  wordSets: WordSet[];
  savedCount: number;
  addedToday: Word[];
};

export function AddWordModal({
  wordSets,
  savedCount,
  addedToday,
}: AddWordModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const dismiss = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-h-[92vh] w-[min(96vw,1100px)] overflow-y-auto border-2 border-line bg-paper p-5 md:p-8">
        <DialogTitle className="sr-only">Add a new word</DialogTitle>
        <DialogDescription className="sr-only">
          Create a vocabulary entry with meaning, examples, and word set.
        </DialogDescription>
        <AddWordForm
          wordSets={wordSets}
          savedCount={savedCount}
          initialAddedToday={addedToday}
          mode="modal"
          onClose={dismiss}
        />
      </DialogContent>
    </Dialog>
  );
}
