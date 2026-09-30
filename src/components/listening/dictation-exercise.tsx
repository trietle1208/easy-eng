"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import { HandCircle } from "@/components/marks/hand-circle";
import { HandUnderline } from "@/components/marks/hand-underline";
import { Button } from "@/components/ui/button";
import { checkDictationAction } from "@/lib/actions/check-dictation";
import { signInUrl } from "@/lib/auth/paths";
import { cn } from "@/lib/utils";
import type {
  DictationBlank,
  DictationCheckItem,
} from "@/types/listening";

type DictationExerciseProps = {
  slug: string;
  blanks: DictationBlank[];
  nextSlug?: string | null;
};

export function DictationExercise({
  slug,
  blanks,
  nextSlug,
}: DictationExerciseProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<DictationCheckItem[] | null>(null);
  const [progressSaved, setProgressSaved] = useState(true);
  const [pending, startTransition] = useTransition();

  const filled = Object.values(answers).filter((v) => v.trim()).length;

  function resultFor(id: string) {
    return results?.find((r) => r.blankId === id);
  }

  function onCheck() {
    startTransition(async () => {
      const res = await checkDictationAction(slug, answers);
      if (res) {
        setResults(res.results);
        setProgressSaved(res.progressSaved);
        if (res.progressSaved) router.refresh();
      }
    });
  }

  function reset() {
    setResults(null);
    setAnswers({});
    setProgressSaved(true);
  }

  return (
    <section className="flex flex-col gap-4 border-t-2 border-dashed border-line/25 pt-6">
      <h3 className="font-hand m-0 flex flex-wrap items-baseline gap-2 text-[27px] tracking-[0.04em] text-ink-2 uppercase">
        Dictation
        <small className="text-[15px] font-semibold tracking-normal text-muted normal-case">
          · Nghe và điền từ còn thiếu
        </small>
      </h3>
      <p className="m-0 text-sm text-muted">
        Listen to each sentence and write the missing word on the line.
      </p>

      <ol className="m-0 flex list-none flex-col gap-4 p-0">
        {blanks.map((blank, i) => {
          const checked = resultFor(blank.id);
          const value = answers[blank.id] ?? "";
          return (
            <li key={blank.id} className="text-[17px] leading-relaxed text-ink">
              <span className="font-hand mr-2 text-accent">{i + 1}.</span>
              <span>{blank.promptBefore}</span>
              {checked ? (
                checked.isCorrect ? (
                  <span className="mx-1 inline-flex items-center gap-1">
                    <HandUnderline color="success" className="font-hand text-xl">
                      {checked.given || checked.answer}
                    </HandUnderline>
                    <Check
                      className="size-4 text-success"
                      strokeWidth={3}
                      aria-label="Correct"
                    />
                  </span>
                ) : (
                  <span className="relative mx-1 inline-flex flex-col items-center">
                    <span className="font-hand absolute -top-5 text-lg leading-none text-success">
                      {checked.answer}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HandCircle color="danger">
                        <span className="font-hand text-xl line-through">
                          {checked.given || "___"}
                        </span>
                      </HandCircle>
                      <X
                        className="size-4 text-danger"
                        strokeWidth={3}
                        aria-label="Incorrect"
                      />
                    </span>
                  </span>
                )
              ) : (
                <input
                  aria-label={`Blank ${i + 1}`}
                  value={value}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [blank.id]: e.target.value,
                    }))
                  }
                  className={cn(
                    "mx-1 w-[7.5rem] border-0 border-b-2 border-line bg-transparent px-1 py-0.5 text-center font-hand text-xl outline-none focus-visible:border-kick",
                  )}
                />
              )}
              <span>{blank.promptAfter}</span>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        {!results ? (
          <>
            <Button type="button" disabled={pending} onClick={onCheck}>
              Check answers
            </Button>
            <span className="text-sm font-semibold text-muted">
              {filled} of {blanks.length} filled in
            </span>
          </>
        ) : (
          <>
            <span className="font-hand text-xl text-ink">
              {results.filter((r) => r.isCorrect).length} / {results.length}
            </span>
            <span className="text-sm font-semibold text-muted">
              Nice ears! Check the red ones.
            </span>
            <Button type="button" variant="outline" onClick={reset}>
              Try again
            </Button>
            {nextSlug ? (
              <Button asChild>
                <Link href={`/listening/${nextSlug}`}>Next lesson</Link>
              </Button>
            ) : null}
          </>
        )}
      </div>
      {results && !progressSaved ? (
        <p className="m-0 text-sm font-semibold text-muted">
          <Link
            href={signInUrl(`/listening/${slug}`)}
            className="font-bold text-link underline-offset-2 hover:underline"
          >
            Sign in
          </Link>{" "}
          to save your progress.
        </p>
      ) : null}
    </section>
  );
}
