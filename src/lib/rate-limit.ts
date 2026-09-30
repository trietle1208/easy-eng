import "server-only";

import { headers } from "next/headers";

import { ActionError } from "@/lib/errors/action";
import { logger } from "@/lib/logger";

/**
 * In-memory fixed-window rate limiter.
 *
 * Limitation: per-process only. With a single Docker container this is enough;
 * multi-replica deploys need a shared store (Redis / Postgres).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const DEFAULTS = {
  mutations: { windowMs: 60_000, max: 60 },
  uploads: { windowMs: 60_000, max: 20 },
  learning: { windowMs: 60_000, max: 120 },
} as const;

export type RateLimitBucket = keyof typeof DEFAULTS;

function prune(now: number) {
  if (buckets.size < 2_000) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  opts: { windowMs: number; max: number },
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true };
  }
  if (existing.count >= opts.max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return { ok: true };
}

async function clientKey(prefix: string, userId?: string | null): Promise<string> {
  if (userId) return `${prefix}:u:${userId}`;
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || h.get("x-real-ip") || "anon";
  return `${prefix}:ip:${ip}`;
}

/** Throw ActionError when the bucket is exhausted. */
export async function enforceRateLimit(
  bucket: RateLimitBucket,
  userId?: string | null,
): Promise<void> {
  const opts = DEFAULTS[bucket];
  const key = await clientKey(bucket, userId);
  const result = checkRateLimit(key, opts);
  if (!result.ok) {
    logger.warn("rate_limit_exceeded", { bucket, retryAfterSec: result.retryAfterSec });
    throw new ActionError(
      `Too many requests. Try again in ${result.retryAfterSec}s.`,
      { code: "RATE_LIMIT" },
    );
  }
}

/** Test helper — clear buckets between unit tests. */
export function resetRateLimitBuckets() {
  buckets.clear();
}
