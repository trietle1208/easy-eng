import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const getSessionMock = vi.fn();

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => getSessionMock(...args),
    },
  },
  isGoogleAuthEnabled: false,
}));

describe("requireUser", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    getSessionMock.mockReset();
  });

  it("redirects anonymous callers to sign-in with callback", async () => {
    getSessionMock.mockResolvedValue(null);
    const { requireUser } = await import("@/lib/auth/session");

    await expect(requireUser("/profile")).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?callbackUrl=%2Fprofile",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/sign-in?callbackUrl=%2Fprofile",
    );
  });

  it("returns the current user when a session exists", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        id: "u1",
        name: "Linh Trần",
        email: "linh@example.com",
        emailVerified: true,
        image: null,
        cefrLevel: "B1",
        timezone: "Asia/Ho_Chi_Minh",
        goalText: "IELTS 6.5",
      },
    });
    const { requireUser } = await import("@/lib/auth/session");
    const user = await requireUser("/profile");
    expect(user.id).toBe("u1");
    expect(user.firstName).toBe("Linh");
    expect(user.initials).toBe("LT");
    expect(user.role).toBe("user");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("createWordAction auth gate", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    getSessionMock.mockReset();
  });

  it("rejects anonymous calls via requireUser redirect", async () => {
    getSessionMock.mockResolvedValue(null);
    const { createWordAction } = await import("@/lib/actions/create-word");

    await expect(
      createWordAction({
        word: "test",
        partOfSpeech: "noun",
        level: "A1",
        meaningVi: "kiểm tra",
        examples: [],
        wordSetId: "at-the-airport",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/sign-in?callbackUrl=");
  });
});
