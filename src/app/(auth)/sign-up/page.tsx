import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isGoogleAuthEnabled } from "@/lib/auth/auth";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Start a chill English notebook — verify your email after signing up."
      footer={
        <p className="m-0">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-kick underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm googleEnabled={isGoogleAuthEnabled} />
    </AuthShell>
  );
}
