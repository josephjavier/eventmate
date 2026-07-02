/**
 * e2e/specs/ui/auth.spec.ts — login flow (anonymous context).
 */

import { test, expect } from "../../fixtures/base";

test.describe("Authentication", () => {
  test("stays on /login when credentials are empty", async ({ loginPage, page }) => {
    await loginPage.open();
    await loginPage.submitButton.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(loginPage.heading).toBeVisible();
  });

  test("logs a confirmed client in and shows the dashboard empty state", async ({
    loginPage,
    dashboardPage,
    seededClient,
    page,
  }) => {
    await loginPage.login(seededClient.email, seededClient.password);

    await expect(page).toHaveURL(/\/dashboard/);
    // seededClient owns no event yet → empty state (D-01/D-03)
    await expect(dashboardPage.emptyStateHeading).toBeVisible();
    await expect(dashboardPage.createEventCta).toBeVisible();
  });
});
