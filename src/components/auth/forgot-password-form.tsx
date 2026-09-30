"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AuthAlert } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import {
  UnderlineField,
  underlineInputClass,
} from "@/components/vocabulary/underline-field";
import { authClient } from "@/lib/auth/client";
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
        setFormError(error.message || "Couldn’t send reset email.");
        return;
      }
      setSent(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}
      {sent ? (
        <AuthAlert tone="success">
          If that email is registered, a reset link is on its way (check the server console in development).
        </AuthAlert>
      ) : null}

      <UnderlineField id="email" label="Email" error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={underlineInputClass}
          {...register("email")}
        />
      </UnderlineField>

      <Button type="submit" disabled={pending || sent} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
