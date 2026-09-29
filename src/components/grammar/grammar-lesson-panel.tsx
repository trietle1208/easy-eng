import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Star,
} from "lucide-react";

import { HandUnderline } from "@/components/marks/hand-underline";
import { Highlighter } from "@/components/marks/highlighter";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { HandCircle } from "@/components/marks/hand-circle";
import { cn } from "@/lib/utils";
import type { AdjacentLessons, GrammarLesson } from "@/types/grammar";

type GrammarLessonPanelProps = {
  lesson: GrammarLesson;
  adjacent: AdjacentLessons;
};

export function GrammarLessonPanel({
  lesson,
  adjacent,
}: GrammarLessonPanelProps) {
  return (
    <NotebookPage
      withMargin
      withRings
      ringCount={18}
      withRules
      className="relative flex min-w-0 flex-1 flex-col gap-[30px] rounded-[6px_18px_18px_6px] py-10 pr-8 pl-[100px] md:pr-[52px]"
    >
      <div className="absolute right-[58px] bottom-full mb-[-6px]">
        <Mascot pose="peek" size={78} alt="" />
      </div>

      <header className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-kick text-xs font-extrabold tracking-[0.16em] uppercase">
            {lesson.groupTitle}
          </span>
          <div className="flex-1" />
          <span className="text-[13px] font-bold text-muted">
            Lesson {lesson.groupIndex} of {lesson.groupTotal} · about{" "}
            {lesson.readMinutes} min read
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <h2 className="font-hand m-0 text-[clamp(2rem,4vw,3.5rem)] leading-none text-ink-2">
            {lesson.title}
          </h2>
          <LevelBadge level={lesson.level} className="px-2.5 py-1.5 text-sm" />
          <Star
            aria-hidden
            className="size-10 rotate-12 text-[color:#D9A82A]"
            strokeWidth={2.2}
            fill="none"
          />
        </div>

        <div
          role="tablist"
          aria-label="Lesson view"
          className="flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border-[1.5px] border-line bg-primary-soft px-4 text-sm font-bold text-ink"
          >
            <BookOpen className="size-[17px]" strokeWidth={2} aria-hidden />
            View knowledge
          </button>
          <Link
            href={`/quiz/${lesson.practiceQuizSlug}`}
            role="tab"
            aria-selected={false}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border-[1.5px] border-line bg-surface px-4 text-sm font-bold text-ink"
          >
            <Pencil className="size-[17px]" strokeWidth={2} aria-hidden />
            Practice
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <p className="m-0 text-lg leading-[1.7] text-ink">
          {renderBoldParts(lesson.introEn)}
        </p>
        <p className="font-hand m-0 text-[22px] leading-snug text-link">
          {lesson.introVi}
        </p>
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-xs font-extrabold tracking-[0.16em] text-accent uppercase">
            Use when
          </span>
          <span className="text-base">
            {lesson.useWhenEn}{" "}
            <i className="text-muted">· {lesson.useWhenVi}</i>
          </span>
        </div>
      </div>

      <section className="radius-sketch flex flex-col gap-[18px] border-2 border-line bg-[color-mix(in_srgb,var(--primary-soft)_55%,transparent)] px-7 py-6">
        <h3 className="font-hand m-0 flex items-baseline gap-2.5 text-[27px] tracking-[0.06em] text-ink-2 uppercase">
          Structure{" "}
          <small className="text-[15px] font-semibold tracking-normal text-muted normal-case">
            · Cấu trúc
          </small>
        </h3>
        {lesson.structure.map((item) => (
          <div key={item.formula} className="flex flex-col gap-2">
            <div>
              <Highlighter className="font-mono text-lg font-bold text-ink-2">
                {item.formula}
              </Highlighter>
            </div>
            <div className="text-base leading-relaxed text-accent italic">
              {item.explanation}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-5">
        <h3 className="font-hand m-0 flex items-baseline gap-2.5 text-[27px] tracking-[0.06em] text-ink-2 uppercase">
          <span className="rounded-[6px_12px_4px_10px] bg-[linear-gradient(100deg,transparent_0%,rgba(163,207,132,.8)_4%,rgba(163,207,132,.72)_96%,transparent_100%)] px-3 pt-0.5 pb-px [background:linear-gradient(100deg,transparent_0%,color-mix(in_srgb,var(--hatch-2)_80%,transparent)_4%,color-mix(in_srgb,var(--hatch-2)_72%,transparent)_96%,transparent_100%)]">
            Examples
          </span>
          <small className="text-[15px] font-semibold tracking-normal text-muted normal-case">
            · Ví dụ
          </small>
        </h3>
        <div className="flex flex-col gap-5">
          {lesson.examples.map((ex, i) => (
            <div key={ex.sentence} className="flex gap-3.5">
              <span className="font-hand w-[22px] shrink-0 text-2xl leading-tight text-accent">
                {i + 1}.
              </span>
              <div className="flex flex-col gap-2">
                <HandUnderline
                  color="primary"
                  className="self-start text-xl font-semibold text-ink-2"
                >
                  {ex.sentence}
                </HandUnderline>
                <span className="text-base leading-relaxed text-muted italic">
                  {ex.explanation}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1">
        <h3 className="font-hand m-0 flex items-baseline gap-2.5 text-[27px] tracking-[0.06em] text-ink-2 uppercase">
          <span className="rounded-[6px_12px_4px_10px] bg-[linear-gradient(100deg,transparent_0%,rgba(255,168,150,.75)_4%,rgba(255,168,150,.7)_96%,transparent_100%)] px-3 pt-0.5 pb-px">
            Common mistakes
          </span>
          <small className="text-[15px] font-semibold tracking-normal text-muted normal-case">
            · Lỗi thường gặp
          </small>
        </h3>

        {lesson.mistakes.map((m, i) => (
          <div
            key={`${m.correct}-${i}`}
            className={cn(
              "grid grid-cols-1 items-center gap-4 border-b-[1.5px] border-dashed border-line/20 py-8 md:grid-cols-[minmax(0,1fr)_262px]",
              i === lesson.mistakes.length - 1 && "border-b-0",
            )}
          >
            <div className="text-[21px] leading-snug font-semibold text-ink-2">
              {m.before}
              <span className="relative mx-1 inline-block px-1">
                <span className="font-hand absolute bottom-full left-1/2 mb-2 -translate-x-1/2 -rotate-[4deg] text-[28px] leading-none whitespace-nowrap text-success">
                  {m.correct}
                </span>
                {m.missing ? (
                  <HandCircle color="danger">
                    <span className="inline-block px-1.5 text-danger" aria-hidden>
                      △
                    </span>
                  </HandCircle>
                ) : (
                  <HandCircle color="danger">
                    <span className="text-ink-2">{m.wrong}</span>
                  </HandCircle>
                )}
              </span>
              {m.after}
            </div>
            <div className="flex items-start gap-1.5">
              <svg
                aria-hidden
                width="44"
                height="26"
                viewBox="0 0 44 26"
                className="mt-0.5 shrink-0 text-line"
              >
                <path
                  d="M42 8 C 30 1, 14 3, 4 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 6 L 3 17 L 13 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="font-hand text-[21px] leading-tight text-ink-2">
                {m.noteEn.includes("-s") || m.noteEn.includes("be") ? (
                  <>
                    {m.noteEn.split(/(-s|be)/).map((part, idx) =>
                      part === "-s" || part === "be" ? (
                        <span key={idx} className="text-danger">
                          {part}
                        </span>
                      ) : (
                        <span key={idx}>{part}</span>
                      ),
                    )}
                  </>
                ) : (
                  m.noteEn
                )}
                <div className="text-lg text-muted">{m.noteVi}</div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-auto flex flex-col items-stretch gap-4 border-t-2 border-dashed border-line/25 pt-6 sm:flex-row sm:items-center">
        {adjacent.previous ? (
          <Link
            href={`/grammar/${adjacent.previous.slug}`}
            className="flex w-full items-center gap-2.5 text-ink sm:w-[250px]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface">
              <ChevronLeft className="size-[18px]" strokeWidth={2.4} />
            </span>
            <span>
              <small className="mb-1 block text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">
                Previous
              </small>
              <b className="text-[15px] leading-snug font-extrabold">
                {adjacent.previous.title}
              </b>
            </span>
          </Link>
        ) : (
          <div className="hidden sm:block sm:w-[250px]" />
        )}

        <div className="flex flex-1 flex-col items-center gap-2">
          <Button asChild>
            <Link href={`/quiz/${lesson.practiceQuizSlug}`}>
              <Pencil className="size-[19px]" strokeWidth={2.2} aria-hidden />
              Practice this
            </Link>
          </Button>
          <span className="text-[13px] font-semibold text-muted">
            {lesson.practiceQuestionCount} questions · about{" "}
            {lesson.practiceMinutes} minutes
          </span>
        </div>

        {adjacent.next ? (
          <Link
            href={`/grammar/${adjacent.next.slug}`}
            className="flex w-full items-center justify-end gap-2.5 text-right text-ink sm:w-[250px]"
          >
            <span>
              <small className="mb-1 block text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">
                Next
              </small>
              <b className="text-[15px] leading-snug font-extrabold">
                {adjacent.next.title}
              </b>
            </span>
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface">
              <ChevronRight className="size-[18px]" strokeWidth={2.4} />
            </span>
          </Link>
        ) : (
          <div className="hidden sm:block sm:w-[250px]" />
        )}
      </footer>
    </NotebookPage>
  );
}

function renderBoldParts(text: string) {
  // Light emphasis for phrases wrapped in known bold markers from mock copy
  const pieces = text.split(/\b(who or what|what they do)\b/g);
  return pieces.map((part, i) =>
    part === "who or what" || part === "what they do" ? (
      <b key={i}>{part}</b>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
