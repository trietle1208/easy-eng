import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import {
  isEmailVerificationRequired,
  isGoogleAuthEnabled,
} from "@/lib/auth/auth";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle={
        isEmailVerificationRequired
          ? "Start a chill English notebook — verify your email after signing up."
          : "Start a chill English notebook — you’re in after creating an account."
      }
      footer={
        <p className="m-0">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-kick underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm
        googleEnabled={isGoogleAuthEnabled}
        emailVerificationRequired={isEmailVerificationRequired}
      />
    </AuthShell>
  );
}
