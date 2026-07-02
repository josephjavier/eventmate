/**
 * e2e/setup/auth.setup.ts
 * Auth setup project — runs before the `ui` project (declared as its dependency).
 *
 * Seeds ONE confirmed client who already owns an event, logs in through the real
 * UI (so the Supabase SSR auth cookies are genuine), and saves the browser
 * storageState to AUTH_FILE. Authed UI specs reuse that session via
 * `test.use({ storageState: AUTH_FILE })` instead of logging in every test.
 *
 * The seeded user lives in the `e2e+` namespace, so global-teardown's sweep
 * removes it (and its cascaded event data) at the end of the run.
 */

import { test as setup, expect } from "@playwright/test";
import { seedFullEvent } from "../support/seed";
import { weddingEvent, ceremonyLocation, receptionLocation } from "../fixtures/data/events";
import { AUTH_FILE } from "../support/paths";

setup("authenticate a client with a seeded event", async ({ page }) => {
  // 1. Seed a confirmed owner + event so the dashboard has data to render.
  const seeded = await seedFullEvent({
    label: "authed",
    event: weddingEvent,
    locations: [ceremonyLocation, receptionLocation],
  });

  // 2. Log in through the UI so real auth cookies are set.
  await page.goto("/login");
  await page.getByLabel("Email").fill(seeded.owner.email);
  await page.getByLabel("Password").fill(seeded.owner.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");

  // 3. Confirm the authed dashboard rendered before saving the session.
  await expect(page.getByText("days until your wedding")).toBeVisible();

  // 4. Persist the session for the `ui` project's authed specs.
  await page.context().storageState({ path: AUTH_FILE });
});
