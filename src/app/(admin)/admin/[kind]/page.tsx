import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage, StatusBadge } from "@/components/admin/admin-page";
import { StatusActions } from "@/components/admin/status-actions";
import { TaxonomyForms } from "@/components/admin/taxonomy-forms";
import { VocabListFilters } from "@/components/admin/vocab-list-filters";
import { Button } from "@/components/ui/button";
import { getGrammarTaxonomy } from "@/lib/admin/grammar";
import { listByKind } from "@/lib/admin/load";
import {
  CONTENT_STATUSES,
  isContentKind,
  KIND_LABELS,
  type ContentStatus,
} from "@/lib/admin/validate";
import { requireAdmin } from "@/lib/auth/session";

type Props = {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ status?: string; topic?: string }>;
};

export default async function AdminKindListPage({
  params,
  searchParams,
}: Props) {
  await requireAdmin();
  const { kind } = await params;
  const sp = await searchParams;
  if (!isContentKind(kind)) notFound();

  const statusFilter =
    kind === "vocabulary" &&
    sp.status &&
    (CONTENT_STATUSES as readonly string[]).includes(sp.status)
      ? (sp.status as ContentStatus)
      : "all";
  const topicFilter =
    kind === "vocabulary" && sp.topic?.trim() ? sp.topic.trim() : "all";

  const [rows, taxonomy] = await Promise.all([
    listByKind(
      kind,
      kind === "vocabulary"
        ? { status: statusFilter, topic: topicFilter }
        : undefined,
    ),
    kind === "grammar" ? getGrammarTaxonomy() : Promise.resolve(null),
  ]);

  return (
    <AdminPage
      title={KIND_LABELS[kind]}
      description={`${rows.length} item${rows.length === 1 ? "" : "s"}`}
      actions={
        <>
          <Button asChild size="sm" variant="outline">
            <a href={`/admin/export/${kind}`}>Export JSON</a>
          </Button>
          <Button asChild size="sm">
            <Link href={`/admin/${kind}/new`}>New</Link>
          </Button>
        </>
      }
    >
      {kind === "vocabulary" ? (
        <VocabListFilters status={statusFilter} topic={topicFilter} />
      ) : null}
      {taxonomy ? <TaxonomyForms families={taxonomy.families} /> : null}

      {rows.length === 0 ? (
        <p className="text-muted m-0 text-sm">Nothing here yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-line border-b-2">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Level</th>
                <th className="py-2 pr-4">Info</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Updated</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-line/30 border-b align-top">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/${kind}/${r.id}`}
                      className="text-link font-bold underline"
                    >
                      {r.title}
                    </Link>
                    <div className="text-muted font-mono text-xs">{r.slug}</div>
                  </td>
                  <td className="py-2 pr-4">{r.level}</td>
                  <td className="text-muted py-2 pr-4">{r.meta}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-muted py-2 pr-4 whitespace-nowrap">
                    {r.updatedAt?.toISOString().slice(0, 10) ?? "—"}
                  </td>
                  <td className="py-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-3 text-sm font-bold">
                        <Link href={`/admin/${kind}/${r.id}`} className="underline">
                          Edit
                        </Link>
                        <Link
                          href={`/admin/${kind}/${r.id}/preview`}
                          className="underline"
                        >
                          Preview
                        </Link>
                      </div>
                      <StatusActions kind={kind} id={r.id} status={r.status} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
