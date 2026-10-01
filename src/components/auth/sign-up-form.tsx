"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { signUpSchema, type SignUpInput } from "@/lib/schemas/auth";

type SignUpFormProps = {
  googleEnabled: boolean;
  emailVerificationRequired?: boolean;
};

export function SignUpForm({
  googleEnabled,
  emailVerificationRequired = false,
}: SignUpFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignUpInput) {
    setFormError(null);
    setPending(true);
    try {
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/",
      });
      if (error) {
        setFormError(
          mapAuthError(
            error,
            "We couldn’t create your account. Please try again.",
          ),
        );
        return;
      }
      if (emailVerificationRequired) {
        router.push(
          `/verify-email?email=${encodeURIComponent(values.email)}`,
        );
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setFormError("Something went wrong — please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setPending(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch {
      setFormError("Google sign-in didn’t work. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}

      <AuthField id="name" label="Display name" error={errors.name?.message}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="What should we call you?"
          className={authInputClass}
          {...register("name")}
        />
      </AuthField>

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

      <Button type="submit" disabled={pending} className={authSubmitClass}>
        {pending ? "Creating…" : "Create account"}
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
