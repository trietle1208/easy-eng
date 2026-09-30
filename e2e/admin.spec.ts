import { expect, test } from "@playwright/test";

import { createVerifiedUser } from "./helpers/db";

/** Sign in via Better Auth HTTP API (avoids flaky client form under turbopack). */
async function signInViaApi(
  request: import("@playwright/test").APIRequestContext,
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  const res = await request.post("/api/auth/sign-in/email", {
    data: { email, password, callbackURL: "/" },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  // Ensure the browser context has the session cookie from the API request.
  const cookies = await request.storageState();
  await page.context().addCookies(cookies.cookies);
  await page.goto("/");
  await expect(page).not.toHaveURL(/sign-in/);
}

test.describe("admin access", () => {
  test("signed-out /admin redirects to sign-in", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/admin");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("normal user gets 404 on /admin", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `e2e.user.${stamp}@example.com`;
    const password = "password123";
    await createVerifiedUser({
      email,
      password,
      name: "Normal User",
      role: "user",
    });
    await signInViaApi(request, page, email, password);

    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/Easy English · Admin/i)).toHaveCount(0);
  });

  test("admin can open dashboard and a content list", async ({
    page,
    request,
  }) => {
    const stamp = Date.now();
    const email = `e2e.admin.${stamp}@example.com`;
    const password = "password123";
    await createVerifiedUser({
      email,
      password,
      name: "Site Admin",
      role: "admin",
    });
    await signInViaApi(request, page, email, password);

    await page.goto("/admin");
    await expect(page.getByText(/Easy English · Admin/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /grammar lessons/i }).first(),
    ).toBeVisible();

    await page.goto("/admin/grammar");
    await expect(
      page.getByRole("heading", { name: /grammar lessons/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /use subject \+ verb clauses/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

