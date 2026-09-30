import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/admin/admin-page";
import { EntityForm } from "@/components/admin/entity-form";
import { defaultValues, fieldsFor } from "@/lib/admin/forms";
import { loadFormContext } from "@/lib/admin/load";
import { isContentKind, KIND_LABELS } from "@/lib/admin/validate";
import { requireAdmin } from "@/lib/auth/session";

type Props = { params: Promise<{ kind: string }> };

export default async function AdminNewPage({ params }: Props) {
  await requireAdmin();
  const { kind } = await params;
  if (!isContentKind(kind)) notFound();

  const ctx = await loadFormContext(kind);
  const values = defaultValues(kind);
  if (kind === "grammar" && ctx.groups[0]) values.groupId = ctx.groups[0].id;

  return (
    <AdminPage
      title={`New — ${KIND_LABELS[kind]}`}
      description="Created as a draft. Publish when it looks right."
      actions={
        <Link href={`/admin/${kind}`} className="text-sm font-bold underline">
          ← Back to list
        </Link>
      }
    >
      <EntityForm
        kind={kind}
        mode="create"
        fields={fieldsFor(kind, ctx)}
        initialValues={values}
        status={null}
      />
    </AdminPage>
  );
}
