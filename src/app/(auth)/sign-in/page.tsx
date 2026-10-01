import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { isGoogleAuthEnabled } from "@/lib/auth/auth";

export default function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back — pick up where you left your notebook."
      footer={
        <p className="m-0">
          New here?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-kick underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <SignInForm googleEnabled={isGoogleAuthEnabled} />
      </Suspense>
    </AuthShell>
  );
}
