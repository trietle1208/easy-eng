import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="New password"
      subtitle="Choose a password you’ll remember for this notebook."
      footer={
        <p className="m-0">
          <Link
            href="/sign-in"
            className="font-semibold text-kick underline underline-offset-2"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
