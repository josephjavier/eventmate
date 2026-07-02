/**
 * playwright.config.ts
 * E2E + API test configuration for EventMate.
 *
 * Local-first: `webServer` boots `next dev` and tests run against localhost
 * using the existing cloud Supabase (env loaded from .env.local via e2e/support/env).
 *
 * Projects:
 *   - setup : provisions an authenticated storageState (auth.setup.ts)
 *   - api   : API/Route-Handler tests (no browser session needed)
 *   - ui    : browser E2E; depends on `setup` so authed specs can reuse the session
 */

import { defineConfig, devices } from "@playwright/test";
import { BASE_URL } from "./e2e/support/env";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "e2e/.report", open: "never" }],
    ["list"],
  ],
  globalTeardown: "./e2e/setup/global-teardown.ts",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "api",
      testDir: "./e2e/specs/api",
      use: { baseURL: BASE_URL },
    },
    {
      name: "ui",
      testDir: "./e2e/specs/ui",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], baseURL: BASE_URL },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
