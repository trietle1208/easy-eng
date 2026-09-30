import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="We’ll email you a link to choose a new password."
      footer={
        <p className="m-0">
          Remembered it?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-kick underline-offset-2 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
