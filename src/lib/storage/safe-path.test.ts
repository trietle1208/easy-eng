import path from "node:path";

import { describe, expect, it } from "vitest";

import { safeResolveKey } from "@/lib/storage/safe-path";

describe("safeResolveKey", () => {
  const root = path.resolve("/tmp/easy-storage-test");

  it("resolves keys under root", () => {
    expect(safeResolveKey(root, ["listening", "ok.wav"])).toBe(
      path.resolve(root, "listening/ok.wav"),
    );
  });

  it("rejects path traversal and null bytes", () => {
    expect(safeResolveKey(root, ["..", "etc", "passwd"])).toBeNull();
    expect(safeResolveKey(root, ["listening", "..", "..", "etc"])).toBeNull();
    expect(safeResolveKey(root, ["foo\0bar"])).toBeNull();
    expect(safeResolveKey(root, [])).toBeNull();
  });
});
