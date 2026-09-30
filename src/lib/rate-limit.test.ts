import { afterEach, describe, expect, it } from "vitest";

import {
  checkRateLimit,
  resetRateLimitBuckets,
} from "@/lib/rate-limit";

afterEach(() => {
  resetRateLimitBuckets();
});

describe("checkRateLimit", () => {
  it("allows up to max requests in a window", () => {
    const opts = { windowMs: 60_000, max: 3 };
    expect(checkRateLimit("t1", opts).ok).toBe(true);
    expect(checkRateLimit("t1", opts).ok).toBe(true);
    expect(checkRateLimit("t1", opts).ok).toBe(true);
    const blocked = checkRateLimit("t1", opts);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates keys", () => {
    const opts = { windowMs: 60_000, max: 1 };
    expect(checkRateLimit("a", opts).ok).toBe(true);
    expect(checkRateLimit("b", opts).ok).toBe(true);
    expect(checkRateLimit("a", opts).ok).toBe(false);
  });
});
