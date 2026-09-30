import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const redirectMock = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
  notFound: () => notFoundMock(),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
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

function sessionFor(role?: string) {
  return {
    user: {
      id: "u-role-test",
      name: "Role Tester",
      email: "role@example.com",
      emailVerified: true,
      image: null,
      cefrLevel: "B1",
      timezone: "Asia/Ho_Chi_Minh",
      goalText: null,
      ...(role === undefined ? {} : { role }),
    },
  };
}

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    notFoundMock.mockClear();
    getSessionMock.mockReset();
  });

  it("redirects signed-out callers to sign-in with an /admin callback", async () => {
    getSessionMock.mockResolvedValue(null);
    const { requireAdmin } = await import("@/lib/auth/session");

    await expect(requireAdmin()).rejects.toThrow(
      "NEXT_REDIRECT:/sign-in?callbackUrl=%2Fadmin",
    );
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("404s a signed-in normal user (role=user)", async () => {
    getSessionMock.mockResolvedValue(sessionFor("user"));
    const { requireAdmin } = await import("@/lib/auth/session");

    await expect(requireAdmin()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("404s users whose role is missing or unknown (fail closed)", async () => {
    for (const role of [undefined, "", "superuser", "ADMIN"]) {
      vi.resetModules();
      notFoundMock.mockClear();
      getSessionMock.mockResolvedValue(sessionFor(role));
      const { requireAdmin } = await import("@/lib/auth/session");
      await expect(requireAdmin()).rejects.toThrow("NEXT_NOT_FOUND");
      expect(notFoundMock).toHaveBeenCalledTimes(1);
    }
  });

  it("returns the user when role=admin", async () => {
    getSessionMock.mockResolvedValue(sessionFor("admin"));
    const { requireAdmin } = await import("@/lib/auth/session");

    const user = await requireAdmin();
    expect(user.id).toBe("u-role-test");
    expect(user.role).toBe("admin");
    expect(notFoundMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("keeps requireUser unchanged: admins and users both pass", async () => {
    getSessionMock.mockResolvedValue(sessionFor("user"));
    const { requireUser } = await import("@/lib/auth/session");
    const user = await requireUser("/profile");
    expect(user.role).toBe("user");
  });
});

describe("admin Server Actions are gated by requireAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    notFoundMock.mockClear();
    getSessionMock.mockReset();
  });

  const cases: [string, () => Promise<unknown>][] = [
    [
      "saveContentAction",
      async () => {
        const { saveContentAction } = await import("@/lib/actions/admin-content");
        return saveContentAction({
          kind: "grammar",
          mode: "create",
          values: {},
          intent: "save",
        });
      },
    ],
    [
      "setContentStatusAction",
      async () => {
        const { setContentStatusAction } = await import(
          "@/lib/actions/admin-content"
        );
        return setContentStatusAction({
          kind: "quiz",
          id: "x",
          status: "published",
        });
      },
    ],
    [
      "deleteContentAction",
      async () => {
        const { deleteContentAction } = await import("@/lib/actions/admin-content");
        return deleteContentAction({ kind: "reading", id: "x" });
      },
    ],
    [
      "importContentAction",
      async () => {
        const { importContentAction } = await import("@/lib/actions/admin-import");
        return importContentAction({
          kind: "grammar",
          json: "{}",
          status: "keep",
        });
      },
    ],
    [
      "saveGrammarFamilyAction",
      async () => {
        const { saveGrammarFamilyAction } = await import(
          "@/lib/actions/admin-taxonomy"
        );
        return saveGrammarFamilyAction({ id: "x", title: "X", sortOrder: 1 });
      },
    ],
    [
      "uploadListeningAudioAction",
      async () => {
        const { uploadListeningAudioAction } = await import(
          "@/lib/actions/admin-upload"
        );
        return uploadListeningAudioAction(new FormData());
      },
    ],
  ];

  for (const [name, call] of cases) {
    it(`${name}: signed-out → redirect, normal user → 404`, async () => {
      getSessionMock.mockResolvedValue(null);
      await expect(call()).rejects.toThrow("NEXT_REDIRECT:/sign-in");

      vi.resetModules();
      getSessionMock.mockResolvedValue(sessionFor("user"));
      await expect(call()).rejects.toThrow("NEXT_NOT_FOUND");
    });
  }
});
