/**
 * e2e/specs/ui/dashboard.spec.ts
 * Authenticated read path. Reuses the session provisioned by auth.setup.ts
 * (no per-test login) — the storageState pattern.
 */

import { test, expect } from "../../fixtures/base";
import { AUTH_FILE } from "../../support/paths";
import { weddingEvent } from "../../fixtures/data/events";

test.use({ storageState: AUTH_FILE });

test("authenticated client sees their countdown and event title", async ({
  dashboardPage,
  page,
}) => {
  await dashboardPage.open();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(dashboardPage.countdown).toBeVisible();
  await expect(dashboardPage.eventTitle(weddingEvent.title)).toBeVisible();
});
