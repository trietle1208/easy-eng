"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resetPasswordSchema } from "@/lib/schemas/auth";

type FormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const [formError, setFormError] = useState<string | null>(
    errorParam ? "This reset link is invalid or has expired." : null,
  );
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!token) {
      setFormError("Missing reset token. Request a new link.");
      return;
    }
    setFormError(null);
    setPending(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: values.password,
        token,
      });
      if (error) {
        setFormError(error.message || "Couldn’t reset password.");
        return;
      }
      router.push("/sign-in?reset=1");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!token && !errorParam) {
    return (
      <AuthAlert>
        Open the link from your email to choose a new password.
      </AuthAlert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}

      <UnderlineField
        id="password"
        label="New password"
        error={errors.password?.message}
        hint="At least 8 characters"
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={underlineInputClass}
          {...register("password")}
        />
      </UnderlineField>

      <UnderlineField
        id="confirmPassword"
        label="Confirm password"
        error={errors.confirmPassword?.message}
      >
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          className={underlineInputClass}
          {...register("confirmPassword")}
        />
      </UnderlineField>

      <Button type="submit" disabled={pending || !token} className="w-full">
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
