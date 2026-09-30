"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthAlert } from "@/components/auth/auth-alert";
import { Button } from "@/components/ui/button";
import {
  UnderlineField,
  underlineInputClass,
} from "@/components/vocabulary/underline-field";
import { authClient } from "@/lib/auth/client";
import { signUpSchema, type SignUpInput } from "@/lib/schemas/auth";

type SignUpFormProps = {
  googleEnabled: boolean;
};

export function SignUpForm({ googleEnabled }: SignUpFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
        setFormError(error.message || "Couldn’t create your account.");
        return;
      }
      setSuccess(true);
      router.push(
        `/verify-email?email=${encodeURIComponent(values.email)}`,
      );
    } catch {
      setFormError("Something went wrong. Please try again.");
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
      setFormError("Google sign-in failed. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {formError ? <AuthAlert>{formError}</AuthAlert> : null}
      {success ? (
        <AuthAlert tone="success">
          Check your email for a verification link (printed in the server console in development).
        </AuthAlert>
      ) : null}

      <UnderlineField id="name" label="Display name" error={errors.name?.message}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className={underlineInputClass}
          {...register("name")}
        />
      </UnderlineField>

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

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create account"}
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
