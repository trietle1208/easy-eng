import { describe, expect, it } from "vitest";

import { mapAuthError } from "@/lib/auth/map-auth-error";

describe("mapAuthError", () => {
  it("maps Invalid origin to a friendly fallback-style message", () => {
    expect(mapAuthError({ message: "Invalid origin" }, "fallback")).toBe(
      "Something went wrong on our side. Please refresh and try again.",
    );
  });

  it("maps duplicate account messages", () => {
    expect(
      mapAuthError({ message: "User already exists" }, "fallback"),
    ).toMatch(/already exists/i);
  });

  it("hides short technical Title Case labels", () => {
    expect(mapAuthError({ message: "Unauthorized" }, "Try again")).toBe(
      "Try again",
    );
  });

  it("keeps clear user-facing sentences", () => {
    const msg = "Please check your inbox for the next step.";
    expect(mapAuthError({ message: msg }, "fallback")).toBe(msg);
  });

  it("uses fallback when message is empty", () => {
    expect(mapAuthError({ message: "" }, "fallback")).toBe("fallback");
    expect(mapAuthError(null, "fallback")).toBe("fallback");
  });
});
