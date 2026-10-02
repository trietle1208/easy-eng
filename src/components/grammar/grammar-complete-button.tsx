"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setGrammarCompletedAction } from "@/lib/actions/set-grammar-completed";

type GrammarCompleteButtonProps = {
  slug: string;
  completed: boolean;
};

export function GrammarCompleteButton({
  slug,
  completed,
}: GrammarCompleteButtonProps) {
  const [done, setDone] = useState(completed);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !done;
    startTransition(async () => {
      try {
        await setGrammarCompletedAction(slug, next);
        setDone(next);
      } catch {
        /* keep current state */
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={done}
      disabled={pending}
      onClick={toggle}
    >
      <Check className="size-[19px]" strokeWidth={2.6} aria-hidden />
      {done ? "Completed" : "Mark as complete"}
    </Button>
  );
}
