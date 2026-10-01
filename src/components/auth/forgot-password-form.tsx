"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { forgotPasswordSchema } from "@/lib/schemas/auth";

type FormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setPending(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: values.email,
        redirectTo: `${window.location.origin}/reset-password`,
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
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}
      {sent ? (
        <AuthAlert tone="success">
          If that email is registered, a reset link is on its way — check your inbox.
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

      <Button
        type="submit"
        disabled={pending || sent}
        className={authSubmitClass}
      >
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
