"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthAlert } from "@/components/auth/auth-alert";
import {
  AuthField,
  authInputClass,
  authSubmitClass,
} from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { mapAuthError } from "@/lib/auth/map-auth-error";
import { resendVerificationSchema } from "@/lib/schemas/auth";

type FormValues = z.infer<typeof resendVerificationSchema>;

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const presetEmail = searchParams.get("email") ?? "";
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: presetEmail },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setPending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: values.email,
        callbackURL: "/",
      });
      if (error) {
        setFormError(
          mapAuthError(
            error,
            "We couldn’t send that email. Please try again.",
          ),
        );
        return;
      }
      setSent(true);
    } catch {
      setFormError("Something went wrong — please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <AuthAlert tone="info">
        We sent a verification link when you signed up — check your inbox (and spam, just in case).
      </AuthAlert>
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}
      {sent ? (
        <AuthAlert tone="success">
          Verification email sent — check your inbox.
        </AuthAlert>
      ) : null}

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

      <Button type="submit" disabled={pending} className={authSubmitClass}>
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}
