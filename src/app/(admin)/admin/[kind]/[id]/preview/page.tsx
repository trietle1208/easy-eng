import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/admin/admin-page";
import { GrammarView } from "@/components/grammar/grammar-view";
import { ListeningView } from "@/components/listening/listening-view";
import { QuizView } from "@/components/quiz/quiz-view";
import { ReadingView } from "@/components/reading/reading-view";
import { StatusActions } from "@/components/admin/status-actions";
import { Button } from "@/components/ui/button";
import {
  previewGrammar,
  previewListening,
  previewQuiz,
  previewReading,
} from "@/lib/admin/preview";
import { getWordSetBundle } from "@/lib/admin/vocabulary";
import { isContentKind, type ContentKind } from "@/lib/admin/validate";
import { requireAdmin } from "@/lib/auth/session";

type Props = { params: Promise<{ kind: string; id: string }> };

function Banner({
  kind,
  id,
  status,
}: {
  kind: ContentKind;
  id: string;
  status: "draft" | "published";
}) {
  return (
    <div className="border-line bg-sticky mb-4 flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 text-ink">
      <StatusBadge status={status} />
      <p className="m-0 flex-1 text-sm font-bold">
        Admin preview — learners {status === "published" ? "can" : "cannot yet"} see this.
        Checking answers works only once published.
      </p>
      <Button asChild size="sm" variant="ink">
        <Link href={`/admin/${kind}/${id}`}>Back to editor</Link>
      </Button>
      <StatusActions kind={kind} id={id} status={status} />
    </div>
  );
}

export default async function AdminPreviewPage({ params }: Props) {
  await requireAdmin();
  const { kind, id } = await params;
  if (!isContentKind(kind)) notFound();

  if (kind === "grammar") {
    const p = await previewGrammar(id);
    if (!p) notFound();
    return (
      <>
        <Banner kind={kind} id={id} status={p.status} />
        <GrammarView tree={p.tree} lesson={p.lesson} adjacent={p.adjacent} />
      </>
    );
  }
  if (kind === "reading") {
    const p = await previewReading(id);
    if (!p) notFound();
    return (
      <>
        <Banner kind={kind} id={id} status={p.status} />
        <ReadingView passages={p.passages} passage={p.passage} progress={p.progress} />
      </>
    );
  }
  if (kind === "listening") {
    const p = await previewListening(id);
    if (!p) notFound();
    return (
      <>
        <Banner kind={kind} id={id} status={p.status} />
        <ListeningView lessons={p.lessons} lesson={p.lesson} nextSlug={p.nextSlug} />
      </>
    );
  }
  if (kind === "quiz") {
    const p = await previewQuiz(id);
    if (!p) notFound();
    return (
      <>
        <Banner kind={kind} id={id} status={p.status} />
        <QuizView quiz={p.quiz} lastAttempt={null} />
      </>
    );
  }

  const hit = await getWordSetBundle(id);
  if (!hit) notFound();
  return (
    <>
      <Banner kind={kind} id={id} status={hit.status} />
      <div className="bg-paper rounded-xl p-6 shadow-[var(--paper-shadow)]">
        <h1 className="font-hand m-0 text-3xl">{hit.bundle.set.title}</h1>
        <p className="text-muted m-0 mb-4 text-sm">
          {hit.bundle.set.titleVi} · {hit.bundle.set.topic} · {hit.bundle.set.level}
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {hit.bundle.words.map((w) => (
            <li key={w.id} className="border-line/30 border-b pb-2">
              <b>{w.word}</b>{" "}
              <span className="text-muted font-mono text-xs">{w.ipa}</span>{" "}
              <i>{w.partOfSpeech}</i> — {w.meaningVi}
              {w.examples[0] ? (
                <div className="text-muted text-sm">{w.examples[0].en}</div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
