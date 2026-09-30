import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";
import { ensureUserDefaults } from "@/lib/auth/ensure-user-defaults";
import {
  resetPasswordEmail,
  verificationEmail,
} from "@/lib/auth/emails";
import { getMailer } from "@/lib/mail";

const googleEnabled =
  Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      cefrLevel: {
        type: "string",
        required: false,
        defaultValue: "A1",
        input: false,
      },
      timezone: {
        type: "string",
        required: false,
        defaultValue: "Asia/Ho_Chi_Minh",
        input: false,
      },
      goalText: {
        type: "string",
        required: false,
        defaultValue: null,
        input: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      const mail = getMailer();
      const content = resetPasswordEmail({ name: user.name, url });
      void mail.send({
        to: user.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const mail = getMailer();
      const content = verificationEmail({ name: user.name, url });
      void mail.send({
        to: user.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
    },
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
      "/forget-password": { window: 60, max: 3 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureUserDefaults(user.id);
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export const isGoogleAuthEnabled = googleEnabled;
