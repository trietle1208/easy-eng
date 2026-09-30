import { AdminPage } from "@/components/admin/admin-page";
import { listAuditLog } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminAuditPage() {
  await requireAdmin();
  const rows = await listAuditLog(200);
  return (
    <AdminPage title="Audit log" description="Latest 200 admin changes.">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-line border-b-2">
              <th className="py-2 pr-4">When (UTC)</th>
              <th className="py-2 pr-4">Who</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Entity</th>
              <th className="py-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-line/30 border-b align-top">
                <td className="py-2 pr-4 whitespace-nowrap">
                  {r.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                </td>
                <td className="py-2 pr-4">{r.actorName ?? r.actorEmail ?? "—"}</td>
                <td className="py-2 pr-4 font-bold">{r.action}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  {r.entityType}:{r.entityId}
                </td>
                <td className="py-2">{r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPage>
  );
}
