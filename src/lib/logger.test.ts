import { afterEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redacts secret-like keys and truncates long strings", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("test_event", {
      password: "hunter2",
      BETTER_AUTH_SECRET: "abc",
      note: "x".repeat(250),
      nested: { token: "t", ok: true },
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const line = String(spy.mock.calls[0]![0]);
    const parsed = JSON.parse(line) as {
      msg: string;
      fields: Record<string, unknown>;
    };
    expect(parsed.msg).toBe("test_event");
    expect(parsed.fields.password).toBe("[redacted]");
    expect(parsed.fields.BETTER_AUTH_SECRET).toBe("[redacted]");
    expect(String(parsed.fields.note).endsWith("…")).toBe(true);
    expect(
      (parsed.fields.nested as Record<string, unknown>).token,
    ).toBe("[redacted]");
    expect((parsed.fields.nested as Record<string, unknown>).ok).toBe(true);
  });
});
