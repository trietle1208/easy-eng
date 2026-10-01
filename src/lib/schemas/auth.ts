import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Please enter at least 2 characters"),
  email: z.email("Please enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Those passwords don’t match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Those passwords don’t match",
  path: ["confirmPassword"],
});

export const resendVerificationSchema = z.object({
  email: z.email("Please enter a valid email"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
