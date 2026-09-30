import { AdminPage } from "@/components/admin/admin-page";
import { ImportForm } from "@/components/admin/import-form";
import { Button } from "@/components/ui/button";
import {
  CONTENT_KINDS,
  KIND_LABELS,
} from "@/lib/admin/validate";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminImportExportPage() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-6">
      <AdminPage
        title="Export"
        description="Downloads use the exact format of content/*.json, so they can be re-imported here or fed to the seeder. Status is not part of the file."
      >
        <div className="flex flex-wrap gap-3">
          {CONTENT_KINDS.map((k) => (
            <div key={k} className="flex flex-col gap-1">
              <Button asChild size="sm" variant="ink">
                <a href={`/admin/export/${k}`}>{KIND_LABELS[k]}</a>
              </Button>
              <span className="text-muted text-xs">
                <a className="underline" href={`/admin/export/${k}?status=published`}>
                  published only
                </a>
              </span>
            </div>
          ))}
        </div>
      </AdminPage>

      <AdminPage
        title="Import"
        description="Validated with the same Zod schemas as the seeder before anything is written. Re-importing updates items by id; word imports never delete words."
      >
        <ImportForm />
      </AdminPage>
    </div>
  );
}
