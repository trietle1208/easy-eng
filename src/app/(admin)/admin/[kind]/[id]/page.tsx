import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage, StatusBadge } from "@/components/admin/admin-page";
import { EntityForm } from "@/components/admin/entity-form";
import { StatusActions } from "@/components/admin/status-actions";
import { fieldsFor } from "@/lib/admin/forms";
import { loadForEdit, loadFormContext } from "@/lib/admin/load";
import { isContentKind, KIND_LABELS } from "@/lib/admin/validate";
import { requireAdmin } from "@/lib/auth/session";

type Props = { params: Promise<{ kind: string; id: string }> };

function learnerHref(kind: string, id: string): string {
  switch (kind) {
    case "grammar":
      return `/grammar/${id}`;
    case "reading":
      return `/reading/${id}`;
    case "listening":
      return `/listening/${id}`;
    case "quiz":
      return `/quiz/${id}`;
    default:
      return "/vocabulary";
  }
}

export default async function AdminEditPage({ params }: Props) {
  await requireAdmin();
  const { kind, id } = await params;
  if (!isContentKind(kind)) notFound();

  const [item, ctx] = await Promise.all([
    loadForEdit(kind, id),
    loadFormContext(kind),
  ]);
  if (!item) notFound();

  return (
    <AdminPage
      title={item.title}
      description={`${KIND_LABELS[kind]} · ${id}`}
      actions={
        <>
          <StatusBadge status={item.status} />
          <Link href={`/admin/${kind}/${id}/preview`} className="text-sm font-bold underline">
            Preview
          </Link>
          {item.status === "published" ? (
            <Link href={learnerHref(kind, id)} className="text-sm font-bold underline">
              View live
            </Link>
          ) : null}
          <Link href={`/admin/${kind}`} className="text-sm font-bold underline">
            ← List
          </Link>
        </>
      }
    >
      <EntityForm
        kind={kind}
        mode="update"
        existingId={item.id}
        fields={fieldsFor(kind, ctx)}
        initialValues={item.values}
        status={item.status}
      />
      <div className="border-line/40 border-t pt-4">
        <StatusActions
          kind={kind}
          id={item.id}
          status={item.status}
          redirectOnDelete={`/admin/${kind}`}
        />
      </div>
    </AdminPage>
  );
}
