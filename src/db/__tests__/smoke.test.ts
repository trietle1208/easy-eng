import { describe, expect, it } from "vitest";

import { withTestClient } from "@/db/test-utils";

describe("database smoke", () => {
  it("connects and runs SELECT 1", async () => {
    const value = await withTestClient(async (client) => {
      const result = await client.query<{ ok: number }>("SELECT 1::int AS ok");
      return result.rows[0]?.ok;
    });
    expect(value).toBe(1);
  });
});
