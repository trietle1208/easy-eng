import "server-only";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth/auth";
import { signInUrl } from "@/lib/auth/paths";
import { initialsFromName } from "@/lib/data/mappers/profile";

export type UserRole = "user" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  cefrLevel: string;
  timezone: string;
  goalText: string | null;
  role: UserRole;
  initials: string;
  /** First name / first token for casual greetings */
  firstName: string;
};

function toCurrentUser(user: {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  cefrLevel?: string | null;
  timezone?: string | null;
  goalText?: string | null;
  role?: string | null;
}): CurrentUser {
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const role: UserRole = user.role === "admin" ? "admin" : "user";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image ?? null,
    cefrLevel: user.cefrLevel ?? "A1",
    timezone: user.timezone ?? "Asia/Ho_Chi_Minh",
    goalText: user.goalText ?? null,
    role,
    initials: initialsFromName(user.name),
    firstName,
  };
}

/** Session user for this request, or null. Cached via React `cache`. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return null;
  return toCurrentUser(session.user as Parameters<typeof toCurrentUser>[0]);
});

/**
 * Require a signed-in user. Redirects to sign-in (with callback) when missing.
 * Cached per request — safe to call from pages and Server Actions.
 */
export const requireUser = cache(async (callbackUrl?: string): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) {
    redirect(signInUrl(callbackUrl));
  }
  return user;
});

/**
 * Require an admin. Signed-out → sign-in; signed-in non-admin → 404
 * (do not leak that `/admin` exists).
 */
export const requireAdmin = cache(async (callbackUrl = "/admin"): Promise<CurrentUser> => {
  const user = await requireUser(callbackUrl);
  if (user.role !== "admin") {
    notFound();
  }
  return user;
});
