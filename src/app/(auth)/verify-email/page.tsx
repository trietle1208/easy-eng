import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify email"
      subtitle="One click from your inbox and you’re in."
      footer={
        <p className="m-0">
          Ready to continue?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-kick underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <VerifyEmailForm />
      </Suspense>
    </AuthShell>
  );
}
