"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
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
import { resetPasswordSchema } from "@/lib/schemas/auth";

type FormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");
  const [formError, setFormError] = useState<string | null>(
    errorParam
      ? "This reset link isn’t valid anymore. Request a new one from Forgot password."
      : null,
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
      setFormError("That reset link is incomplete. Request a new one from Forgot password.");
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
        setFormError(
          mapAuthError(
            error,
            "We couldn’t update your password. Please try again.",
          ),
        );
        return;
      }
      router.push("/sign-in?reset=1");
      router.refresh();
    } catch {
      setFormError("Something went wrong — please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  if (!token && !errorParam) {
    return (
      <AuthAlert tone="info">
        Open the link from your email to choose a new password.
      </AuthAlert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}

      <AuthField
        id="password"
        label="New password"
        error={errors.password?.message}
        hint="At least 8 characters"
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={authInputClass}
          {...register("password")}
        />
      </AuthField>

      <AuthField
        id="confirmPassword"
        label="Confirm password"
        error={errors.confirmPassword?.message}
      >
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          className={authInputClass}
          {...register("confirmPassword")}
        />
      </AuthField>

      <Button
        type="submit"
        disabled={pending || !token}
        className={authSubmitClass}
      >
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
