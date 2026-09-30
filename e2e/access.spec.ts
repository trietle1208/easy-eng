import { expect, test } from "@playwright/test";

test.describe("signed-out access rules", () => {
  test("public learning routes stay open", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading").first()).toBeVisible();

    await page.goto("/grammar/use-subject-verb-clauses");
    await expect(page).not.toHaveURL(/sign-in/);

    await page.goto("/quiz/present-perfect-vs-past-simple");
    await expect(page).not.toHaveURL(/sign-in/);
  });

  test("profile and vocabulary redirect to sign-in", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/profile");
    await expect(page).toHaveURL(/sign-in/);

    await page.goto("/vocabulary");
    await expect(page).toHaveURL(/sign-in/);
  });
});
