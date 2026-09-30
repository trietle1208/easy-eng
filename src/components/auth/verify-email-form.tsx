"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
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
        setFormError(error.message || "Couldn’t send verification email.");
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
      <AuthAlert tone="info">
        We sent a verification link after you signed up. In development it is also printed in the server console.
      </AuthAlert>
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}
      {sent ? (
        <AuthAlert tone="success">
          Verification email sent — check your inbox or the console.
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

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}
