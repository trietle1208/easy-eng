import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/session";
import {
  CONTENT_KINDS,
  KIND_LABELS,
} from "@/lib/admin/validate";

export const metadata: Metadata = {
  title: "Admin · Easy English",
  robots: { index: false, follow: false },
};

const navLink =
  "rounded-[var(--radius-pill)] border border-soft-border bg-pill px-3.5 py-1.5 text-sm font-bold text-on-glass hover:bg-soft";

/**
 * Every admin page is gated here AND in each Server Action (`requireAdmin`):
 * signed-out → sign-in, non-admin → 404.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="bg-page min-h-dvh text-ink">
      <header className="bg-glass sticky top-0 z-20 border-b border-soft-border backdrop-blur-[10px]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/admin" className="font-hand text-on-glass mr-2 text-2xl">
            Easy English · Admin
          </Link>
          <nav aria-label="Admin" className="flex flex-1 flex-wrap gap-2">
            {CONTENT_KINDS.map((k) => (
              <Link key={k} href={`/admin/${k}`} className={navLink}>
                {KIND_LABELS[k]}
              </Link>
            ))}
            <Link href="/admin/import-export" className={navLink}>
              Import / export
            </Link>
            <Link href="/admin/audit" className={navLink}>
              Audit log
            </Link>
          </nav>
          <div className="text-on-glass flex items-center gap-3 text-sm">
            <span className="max-w-[12rem] truncate">{admin.email}</span>
            <Link href="/" className="font-bold underline">
              Back to app
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6">{children}</main>
    </div>
  );
}
