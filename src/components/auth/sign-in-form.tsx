"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthAlert } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import {
  UnderlineField,
  underlineInputClass,
} from "@/components/vocabulary/underline-field";
import { authClient } from "@/lib/auth/client";
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
            "Please verify your email first — check your inbox (or the server console in development).",
          );
        } else {
          setFormError(error.message || "Couldn’t sign in. Check your email and password.");
        }
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
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
      setFormError("Google sign-in failed. Try again.");
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

      <UnderlineField id="email" label="Email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={underlineInputClass}
          {...register("email")}
        />
      </UnderlineField>

      <UnderlineField
        id="password"
        label="Password"
        error={errors.password?.message}
      >
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className={underlineInputClass}
          {...register("password")}
        />
      </UnderlineField>

      <div className="-mt-2 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-kick underline-offset-2 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      {googleEnabled ? (
        <>
          <p className="font-hand m-0 text-center text-lg text-muted">or</p>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="w-full"
            onClick={onGoogle}
          >
            Continue with Google
          </Button>
        </>
      ) : null}
    </form>
  );
}
