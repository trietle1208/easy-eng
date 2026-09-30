import { expect, test } from "@playwright/test";

import { createVerifiedUser, verifyEmailInDb } from "./helpers/db";

test.describe("learner journey", () => {
  test("sign-up API + verify email", async ({ page, request }) => {
    const stamp = Date.now();
    const email = `e2e.signup.${stamp}@example.com`;
    const password = "password123";

    const res = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Signup E2E",
        email,
        password,
        callbackURL: "/",
      },
    });
    expect(res.ok(), await res.text()).toBeTruthy();

    await verifyEmailInDb(email);

    await page.goto("/sign-in");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("quiz → word → review → profile streak", async ({ page }) => {
    test.setTimeout(180_000);
    const stamp = Date.now();
    const email = `e2e.learn.${stamp}@example.com`;
    const password = "password123";
    await createVerifiedUser({
      email,
      password,
      name: "E2E Learner",
    });

    await page.goto("/sign-in");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/quiz/present-perfect-vs-past-simple");
    await page.getByRole("button", { name: /start quiz/i }).click();

    for (let i = 0; i < 14; i++) {
      const done = page.getByText(/quiz complete|keep going|great job/i).first();
      if (await done.isVisible().catch(() => false)) break;

      const skip = page.getByRole("button", { name: /^skip$/i });
      const check = page.getByRole("button", {
        name: /check answer|submit quiz/i,
      });
      try {
        if (await skip.isVisible({ timeout: 800 }).catch(() => false)) {
          await skip.click({ force: true, timeout: 4_000 });
        } else if (await check.isVisible({ timeout: 400 }).catch(() => false)) {
          await check.click({ force: true, timeout: 4_000 });
        } else {
          break;
        }
      } catch {
        // Animations / remounts can detach buttons mid-click.
      }
      await page.waitForTimeout(250);
    }

    await expect(
      page.getByText(/quiz complete|keep going|\/10/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto("/vocabulary/new");
    await page.locator("#word").fill(`apple${stamp}`);
    await page.getByRole("radio", { name: /^noun$/i }).click();
    await page.locator("#meaningVi").fill("quả táo");
    await page.locator("#wordSet").selectOption("__new__");
    await page.getByPlaceholder(/new set title/i).fill(`E2E Set ${stamp}`);
    await page.getByRole("button", { name: /^save word$/i }).click();
    await expect(page.getByText(/saved!/i)).toBeVisible({ timeout: 15_000 });

    await page.goto("/vocabulary");
    await page.getByRole("button", { name: /start set|study set/i }).first().click();
    await page.waitForTimeout(800);
    const flip = page.getByRole("button", { name: /show meaning|show word/i });
    if (await flip.count()) {
      await flip.first().click({ force: true });
    }
    const know = page.getByRole("button", { name: /know it/i });
    if (await know.count()) {
      await know.first().click({ force: true });
    }

    await page.goto("/profile");
    await expect(page.getByText(/streak/i).first()).toBeVisible();
  });
});
