"use client";

import { Check, X } from "lucide-react";

import { HandCircle } from "@/components/marks/hand-circle";
import { HandUnderline } from "@/components/marks/hand-underline";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { checkReadingAnswersAction } from "@/lib/actions/check-reading-answers";
import { signInUrl } from "@/lib/auth/paths";
import { cn } from "@/lib/utils";
import type {
  AnswerCheckResult,
  ComprehensionQuestion,
} from "@/types/reading";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type ComprehensionQuizProps = {
  slug: string;
  questions: ComprehensionQuestion[];
};

export function ComprehensionQuiz({
  slug,
  questions,
}: ComprehensionQuizProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [results, setResults] = useState<AnswerCheckResult[] | null>(null);
  const [progressSaved, setProgressSaved] = useState(true);
  const [pending, startTransition] = useTransition();

  const answered = Object.values(answers).filter((v) => v !== null && v !== undefined).length;

  function select(qid: string, index: number) {
    if (results) return;
    setAnswers((prev) => ({ ...prev, [qid]: index }));
  }

  function onCheck() {
    startTransition(async () => {
      const res = await checkReadingAnswersAction(slug, answers);
      if (res) {
        setResults(res.results);
        setProgressSaved(res.progressSaved);
        if (res.progressSaved) router.refresh();
      }
    });
  }

  function resultFor(qid: string) {
    return results?.find((r) => r.questionId === qid);
  }

  return (
    <section className="flex flex-col gap-5 border-t-2 border-dashed border-line/25 pt-6">
      <h3 className="font-hand m-0 flex flex-wrap items-baseline gap-2 text-[27px] tracking-[0.04em] text-ink-2 uppercase">
        Check your understanding
        <small className="text-[15px] font-semibold tracking-normal text-muted normal-case">
          · Câu hỏi đọc hiểu
        </small>
      </h3>

      <ol className="m-0 flex list-none flex-col gap-6 p-0">
        {questions.map((q, qi) => {
          const checked = resultFor(q.id);
          return (
            <li key={q.id} className="flex flex-col gap-3">
              <div className="text-base font-extrabold text-ink">
                {qi + 1}. {q.prompt}
              </div>
              <div
                role="radiogroup"
                aria-label={q.prompt}
                className="flex flex-col gap-2"
              >
                {q.choices.map((choice, ci) => {
                  const selected = answers[q.id] === ci;
                  const isCorrectChoice = checked?.correctIndex === ci;
                  const isWrongSelected =
                    checked && selected && !checked.isCorrect;

                  return (
                    <button
                      key={choice}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={Boolean(results)}
                      onClick={() => select(q.id, ci)}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold",
                        selected && !checked
                          ? "border-kick bg-primary-soft/50"
                          : "border-line/25 bg-surface",
                        isCorrectChoice && checked && "border-success",
                        isWrongSelected && "border-danger",
                      )}
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
                        {checked && isCorrectChoice ? (
                          <Check
                            className="size-4 text-success"
                            strokeWidth={3}
                            aria-label="Correct"
                          />
                        ) : null}
                        {isWrongSelected ? (
                          <X
                            className="size-4 text-danger"
                            strokeWidth={3}
                            aria-label="Incorrect"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        {checked && isCorrectChoice ? (
                          <HandUnderline color="success">{choice}</HandUnderline>
                        ) : isWrongSelected ? (
                          <HandCircle color="danger">
                            <span>{choice}</span>
                          </HandCircle>
                        ) : (
                          choice
                        )}
                      </span>
                      {isWrongSelected ? (
                        <span className="font-hand text-success shrink-0 text-base">
                          → {q.choices[checked.correctIndex]}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={pending || Boolean(results)} onClick={onCheck}>
          Check answers
        </Button>
        <span className="text-sm font-semibold text-muted">
          {results
            ? `${results.filter((r) => r.isCorrect).length} / ${results.length} correct`
            : `${answered} of ${questions.length} answered`}
        </span>
        {results ? (
          <button
            type="button"
            className="text-sm font-bold text-link"
            onClick={() => {
              setResults(null);
              setAnswers({});
              setProgressSaved(true);
            }}
          >
            Try again
          </button>
        ) : null}
      </div>
      {results && !progressSaved ? (
        <p className="m-0 text-sm font-semibold text-muted">
          <Link
            href={signInUrl(`/reading/${slug}`)}
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
