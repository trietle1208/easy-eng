import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { Button } from "@/components/ui/button";
import { listAuditLog } from "@/lib/admin/audit";
import { listByKind } from "@/lib/admin/load";
import {
  CONTENT_KINDS,
  KIND_LABELS,
} from "@/lib/admin/validate";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [lists, audit] = await Promise.all([
    Promise.all(CONTENT_KINDS.map((k) => listByKind(k))),
    listAuditLog(8),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPage
        title="Content dashboard"
        description="Draft content is invisible to learners until you publish it."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-line border-b-2">
                <th className="py-2 pr-4">Content</th>
                <th className="py-2 pr-4">Published</th>
                <th className="py-2 pr-4">Draft</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {CONTENT_KINDS.map((k, i) => {
                const rows = lists[i]!;
                const published = rows.filter((r) => r.status === "published").length;
                return (
                  <tr key={k} className="border-line/30 border-b">
                    <td className="py-2 pr-4 font-bold">{KIND_LABELS[k]}</td>
                    <td className="py-2 pr-4">{published}</td>
                    <td className="py-2 pr-4">{rows.length - published}</td>
                    <td className="py-2 text-right">
                      <Button asChild size="sm" variant="ink">
                        <Link href={`/admin/${k}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminPage>

      <AdminPage title="Recent activity">
        {audit.length === 0 ? (
          <p className="text-muted m-0 text-sm">No admin changes yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
            {audit.map((a) => (
              <li key={a.id}>
                <span className="text-muted">
                  {a.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>{" "}
                · {a.actorName ?? a.actorEmail ?? "?"} · {a.summary || a.action}
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/audit" className="text-link text-sm font-bold underline">
          Full audit log →
        </Link>
      </AdminPage>
    </div>
  );
}
