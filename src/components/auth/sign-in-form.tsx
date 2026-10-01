"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthAlert } from "@/components/auth/auth-alert";
import {
  AuthField,
  authInputClass,
  authSubmitClass,
} from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { signInSchema, type SignInInput } from "@/lib/schemas/auth";

type SignInFormProps = {
  googleEnabled: boolean;
};

export function SignInForm({ googleEnabled }: SignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const resetOk = searchParams.get("reset") === "1";
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    setFormError(null);
    setPending(true);
    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: callbackUrl,
      });
      if (error) {
        if (error.status === 403) {
          setFormError(
            "Please verify your email first — open the link we sent to your inbox.",
          );
        } else {
          setFormError(
            mapAuthError(
              error,
              "That email or password doesn’t look right. Try again?",
            ),
          );
        }
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Something went wrong — please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setFormError(null);
    setPending(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch {
      setFormError("Google sign-in didn’t work. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {resetOk ? (
        <AuthAlert tone="success">
          Password updated — sign in with your new password.
        </AuthAlert>
      ) : null}
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}

      <AuthField id="email" label="Email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={authInputClass}
          {...register("email")}
        />
      </AuthField>

      <AuthField
        id="password"
        label="Password"
        error={errors.password?.message}
      >
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          className={authInputClass}
          {...register("password")}
        />
      </AuthField>

      <div className="-mt-2 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-kick underline underline-offset-2"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" disabled={pending} className={authSubmitClass}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      {googleEnabled ? (
        <>
          <p className="m-0 text-center text-sm text-muted">or</p>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="h-[52px] w-full rounded-2xl border-[3px] border-line shadow-[3px_3px_0_var(--line)]"
            onClick={onGoogle}
          >
            Continue with Google
          </Button>
        </>
      ) : null}
    </form>
  );
}
