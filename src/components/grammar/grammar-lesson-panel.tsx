import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Star,
} from "lucide-react";

import { GrammarCompleteButton } from "@/components/grammar/grammar-complete-button";
import { NotebookPage } from "@/components/notebook/notebook-page";
import { StickyNote } from "@/components/notebook/sticky-note";
import { Mascot } from "@/components/mascot/mascot";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/level-badge";
import { cn } from "@/lib/utils";
import type { AdjacentLessons, GrammarLesson } from "@/types/grammar";

type GrammarLessonPanelProps = {
  lesson: GrammarLesson;
  adjacent: AdjacentLessons;
  /** Signed-in only; omit to hide the "Mark as complete" button. */
  completed?: boolean;
};

const mistakeRotates = [-1.4, 1.2, -0.6] as const;

function SectionCard({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 rounded-[18px] border-2 border-line/15 bg-surface p-5 shadow-[0_6px_18px_rgba(25,12,4,.1)] md:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function GrammarLessonPanel({
  lesson,
  adjacent,
  completed,
}: GrammarLessonPanelProps) {
  return (
    <NotebookPage
      withMargin
      withRings
      ringCount={18}
      withRules
      className="relative flex min-w-0 flex-1 flex-col gap-8 rounded-[6px_18px_18px_6px] py-10 pr-8 pl-[100px] md:pr-[52px]"
    >
      <div className="absolute right-[58px] bottom-full mb-[-6px]">
        <Mascot pose="peek" size={78} alt="" />
      </div>

      <header className="flex flex-col gap-4">
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

        <h2 className="m-0 text-[clamp(1.85rem,3.6vw,2.75rem)] leading-[1.1] font-extrabold tracking-tight text-ink-2">
          {lesson.title}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <LevelBadge level={lesson.level} className="px-2.5 py-1.5 text-sm" />
          <Star
            aria-hidden
            className="size-7 rotate-12 text-[color:#D9A82A]"
            strokeWidth={2.2}
            fill="none"
          />
          <div className="flex-1" />
          <div
            role="tablist"
            aria-label="Lesson view"
            className="flex flex-wrap gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border-2 border-primary bg-[color-mix(in_srgb,var(--primary)_18%,var(--surface))] px-4 text-sm font-bold text-ink"
            >
              <BookOpen className="size-[17px]" strokeWidth={2} aria-hidden />
              View knowledge
            </button>
            <Link
              href={`/quiz/${lesson.practiceQuizSlug}`}
              role="tab"
              aria-selected={false}
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] border-2 border-line/35 bg-surface px-4 text-sm font-bold text-ink"
            >
              <Pencil className="size-[17px]" strokeWidth={2} aria-hidden />
              Practice
            </Link>
          </div>
        </div>
      </header>

      <SectionCard>
        <h3 className="m-0 flex flex-wrap items-baseline gap-2.5 text-[15px] font-extrabold tracking-[0.14em] text-ink-2 uppercase">
          <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--primary-soft)_85%,white)] px-3 py-1.5 text-ink-2">
            Knowledge
          </span>
          <small className="text-[14px] font-semibold tracking-normal text-muted normal-case">
            Kiến thức
          </small>
        </h3>

        <div className="flex flex-col gap-3.5">
          <p className="m-0 text-lg leading-[1.7] text-ink">
            {renderBoldParts(lesson.introEn)}
          </p>
          <p className="m-0 rounded-[12px] bg-[color-mix(in_srgb,var(--primary-soft)_72%,white)] px-4 py-3 text-[17px] leading-snug font-semibold text-kick">
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

        <StickyNote
          color="yellow"
          rotate={-0.8}
          className="gap-4 rounded-[4px_4px_18px_4px] px-6 pt-8 pb-6"
        >
          <h3 className="m-0 flex flex-wrap items-baseline gap-2 text-[15px] font-extrabold tracking-[0.14em] text-ink-2 uppercase">
            Structure
            <small className="text-[14px] font-semibold tracking-normal text-muted normal-case">
              Cấu trúc
            </small>
          </h3>
          <div className="flex flex-col gap-3">
            {lesson.structure.map((item) => {
              const { en, vi } = splitEnVi(item.explanation);
              return (
                <div
                  key={item.formula}
                  className="rounded-[10px] border border-line/10 bg-surface px-4 py-3.5 shadow-[0_2px_6px_rgba(25,12,4,.06)]"
                >
                  <div className="font-mono text-base font-bold text-ink-2">
                    {item.formula}
                  </div>
                  <p className="mt-1.5 m-0 text-[15px] leading-relaxed text-ink">
                    {en}
                  </p>
                  {vi ? (
                    <p className="mt-1 m-0 text-[14px] leading-snug text-kick">
                      {vi}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </StickyNote>
      </SectionCard>

      <SectionCard>
        <h3 className="m-0 flex flex-wrap items-baseline gap-2.5 text-[15px] font-extrabold tracking-[0.14em] text-ink-2 uppercase">
          <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--hatch-2)_85%,white)] px-3 py-1.5 text-ink-2">
            Examples
          </span>
          <small className="text-[14px] font-semibold tracking-normal text-muted normal-case">
            Ví dụ
          </small>
        </h3>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {lesson.examples.map((ex, i) => {
            const { en, vi } = splitEnVi(ex.explanation);
            return (
              <article
                key={ex.sentence}
                className="relative flex flex-col gap-2 rounded-[14px] border border-line/12 bg-surface px-4 pt-4 pb-3.5 shadow-[0_4px_12px_rgba(25,12,4,.08)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="m-0 text-[17px] leading-snug font-bold text-ink-2">
                    <span className="mr-1.5 text-kick">#{i + 1}</span>
                    {ex.sentence}
                  </p>
                  <span
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line/20 text-muted"
                    aria-hidden
                  >
                    <ChevronDown className="size-3.5" strokeWidth={2.4} />
                  </span>
                </div>
                <p className="m-0 text-[14px] leading-relaxed text-muted">
                  {en}
                </p>
                {vi ? (
                  <p className="m-0 text-[14px] leading-snug text-kick">{vi}</p>
                ) : null}
              </article>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <h3 className="m-0 flex flex-wrap items-baseline gap-2.5 text-[15px] font-extrabold tracking-[0.14em] text-ink-2 uppercase">
          <span className="rounded-[8px] bg-[color-mix(in_srgb,var(--danger)_22%,white)] px-3 py-1.5 text-[color:var(--danger)]">
            Common mistakes
          </span>
          <small className="text-[14px] font-semibold tracking-normal text-muted normal-case">
            Lỗi thường gặp
          </small>
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {lesson.mistakes.map((m, i) => {
            const wrongPhrase = m.missing
              ? `${m.before}△${m.after}`
              : `${m.before}${m.wrong}${m.after}`;
            const correctPhrase = `${m.before}${m.correct}${m.after}`;
            return (
              <StickyNote
                key={`${m.correct}-${i}`}
                color="pink"
                rotate={mistakeRotates[i % mistakeRotates.length]}
                className="gap-3 rounded-[4px_4px_18px_4px] px-4 pt-7 pb-4"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-extrabold tracking-[0.14em] text-danger uppercase">
                    Instead of
                  </span>
                  <span className="text-[16px] leading-snug font-semibold text-danger line-through decoration-2">
                    {wrongPhrase}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-extrabold tracking-[0.14em] text-success uppercase">
                    Write
                  </span>
                  <span className="text-[16px] leading-snug font-bold text-success">
                    {correctPhrase}
                  </span>
                </div>
                <p className="m-0 text-[13px] leading-snug text-ink">
                  {m.noteEn}
                </p>
                <p className="m-0 text-[13px] leading-snug text-muted">
                  {m.noteVi}
                </p>
              </StickyNote>
            );
          })}
        </div>
      </SectionCard>

      <footer className="mt-auto flex flex-col gap-6">
        <SectionCard
          aria-label="Practice"
          className="flex-row flex-wrap items-center gap-x-3.5 gap-y-3 bg-[color-mix(in_srgb,var(--primary-soft)_72%,var(--surface))]"
        >
          <Button asChild>
            <Link href={`/quiz/${lesson.practiceQuizSlug}`}>
              <Pencil className="size-[19px]" strokeWidth={2.2} aria-hidden />
              Practice this
            </Link>
          </Button>
          {completed !== undefined ? (
            <GrammarCompleteButton
              key={lesson.slug}
              slug={lesson.slug}
              completed={completed}
            />
          ) : null}
          <span className="basis-full text-[13px] font-semibold text-muted">
            {lesson.practiceQuestionCount} questions · about{" "}
            {lesson.practiceMinutes} minutes
          </span>
        </SectionCard>

        <div className="flex items-center justify-between gap-4 px-1">
          {adjacent.previous ? (
            <Link
              href={`/grammar/${adjacent.previous.slug}`}
              aria-label={`Previous: ${adjacent.previous.title}`}
              className="flex min-w-0 max-w-[46%] items-center gap-2.5 text-left text-ink"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-line bg-surface">
                <ChevronLeft className="size-[18px]" strokeWidth={2.4} />
              </span>
              <span className="min-w-0">
                <small className="mb-1 block text-[11px] font-extrabold tracking-[0.14em] text-muted uppercase">
                  Previous
                </small>
                <b className="text-[15px] leading-snug font-extrabold">
                  {adjacent.previous.title}
                </b>
              </span>
            </Link>
          ) : (
            <div />
          )}

          {adjacent.next ? (
            <Link
              href={`/grammar/${adjacent.next.slug}`}
              className="flex min-w-0 max-w-[46%] items-center justify-end gap-2.5 text-right text-ink"
            >
              <span className="min-w-0">
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
            <div />
          )}
        </div>
      </footer>
    </NotebookPage>
  );
}

function renderBoldParts(text: string) {
  const pieces = text.split(/\b(who or what|what they do)\b/g);
  return pieces.map((part, i) =>
    part === "who or what" || part === "what they do" ? (
      <b key={i}>{part}</b>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function splitEnVi(text: string): { en: string; vi?: string } {
  const byMidDot = text.split(/\s·\s/);
  if (byMidDot.length >= 2) {
    return { en: byMidDot[0]!, vi: byMidDot.slice(1).join(" · ") };
  }

  const byEmDash = text.split(/\s—\s/);
  if (byEmDash.length >= 2) {
    const last = byEmDash[byEmDash.length - 1]!;
    if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(last)) {
      return {
        en: byEmDash.slice(0, -1).join(" — "),
        vi: last,
      };
    }
  }

  return { en: text };
}
