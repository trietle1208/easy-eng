import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ActionError, parseActionInput } from "@/lib/errors/action";

describe("parseActionInput", () => {
  it("returns parsed data", () => {
    const schema = z.object({ n: z.number().int().positive() });
    expect(parseActionInput(schema, { n: 2 })).toEqual({ n: 2 });
  });

  it("throws ActionError with fieldErrors", () => {
    const schema = z.object({ email: z.string().email() });
    try {
      parseActionInput(schema, { email: "nope" });
      expect.fail("should throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ActionError);
      const ae = err as ActionError;
      expect(ae.code).toBe("VALIDATION");
      expect(ae.fieldErrors.email?.length).toBeGreaterThan(0);
    }
  });
});
