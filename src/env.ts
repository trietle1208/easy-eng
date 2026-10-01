import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_URL_TEST: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be ≥16 chars"),
  BETTER_AUTH_URL: z.string().url(),
  /** Off by default for personal use — set `true` to require inbox verification. */
  REQUIRE_EMAIL_VERIFICATION: z.preprocess(
    (v) => v === true || v === "true" || v === "1",
    z.boolean(),
  ).default(false),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default(""),
  STORAGE_DIR: z.string().min(1).default("./storage"),
  APP_TIMEZONE: z.string().min(1).default("Asia/Ho_Chi_Minh"),
  SEED_DEMO_EMAIL: z.string().email().optional().default("linh@example.com"),
  SEED_DEMO_PASSWORD: z.string().min(8).optional().default("password123"),
  /** Phase 9: `pnpm db:seed -- --admin` promotes/creates this account. */
  SEED_ADMIN_EMAIL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().email().optional(),
  ),
  SEED_ADMIN_PASSWORD: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(8).optional(),
  ),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return {
      NODE_ENV:
        (process.env.NODE_ENV as Env["NODE_ENV"] | undefined) ?? "development",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgres://localhost/skip",
      DATABASE_URL_TEST: process.env.DATABASE_URL_TEST,
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ?? "skip-validation-secret",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      REQUIRE_EMAIL_VERIFICATION:
        process.env.REQUIRE_EMAIL_VERIFICATION === "true" ||
        process.env.REQUIRE_EMAIL_VERIFICATION === "1",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
      SMTP_HOST: process.env.SMTP_HOST ?? "",
      SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
      SMTP_USER: process.env.SMTP_USER ?? "",
      SMTP_PASS: process.env.SMTP_PASS ?? "",
      SMTP_FROM: process.env.SMTP_FROM ?? "",
      STORAGE_DIR: process.env.STORAGE_DIR ?? "./storage",
      APP_TIMEZONE: process.env.APP_TIMEZONE ?? "Asia/Ho_Chi_Minh",
      SEED_DEMO_EMAIL: process.env.SEED_DEMO_EMAIL ?? "linh@example.com",
      SEED_DEMO_PASSWORD: process.env.SEED_DEMO_PASSWORD ?? "password123",
      SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
      SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    };
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return parsed.data;
}

export const env = loadEnv();
