/**
 * e2e/fixtures/base.ts
 * The custom `test` every spec imports instead of `@playwright/test`.
 *
 * It extends Playwright's base test with:
 *   - Page Objects (POM)          — no `new SomePage(page)` boilerplate in specs
 *   - An API client (RsvpApiClient) — typed wrapper over APIRequestContext
 *   - Seeded, self-cleaning data   — `seededClient` / `seededEvent` fixtures
 *
 * Fixture-provided seed data is the ONLY way specs get data: static payloads
 * live in fixtures/data/*, the seeder tags them run-scoped, and each fixture
 * tears itself down (delete the owning user → cascade) after the test.
 */

import { test as base, expect } from "@playwright/test";

import { LoginPage } from "../pages/auth/LoginPage";
import { SignupPage } from "../pages/auth/SignupPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { DashboardPage } from "../pages/DashboardPage";
import { RsvpPage } from "../pages/RsvpPage";
import { RsvpApiClient } from "../api/RsvpApiClient";

import {
  seedClientUser,
  seedFullEvent,
  deleteUser,
  type SeededUser,
  type SeededEvent,
} from "../support/seed";
import { weddingEvent, ceremonyLocation, receptionLocation } from "./data/events";
import { guests } from "./data/guests";

interface Fixtures {
  // Page Objects
  loginPage: LoginPage;
  signupPage: SignupPage;
  onboardingPage: OnboardingPage;
  dashboardPage: DashboardPage;
  rsvpPage: RsvpPage;
  // API
  rsvpApi: RsvpApiClient;
  // Seeded data (self-cleaning)
  seededClient: SeededUser;
  seededEvent: SeededEvent;
}

export const test = base.extend<Fixtures>({
  // ── Page Objects ───────────────────────────────────────────────────────────
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  signupPage: async ({ page }, use) => {
    await use(new SignupPage(page));
  },
  onboardingPage: async ({ page }, use) => {
    await use(new OnboardingPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  rsvpPage: async ({ page }, use) => {
    await use(new RsvpPage(page));
  },

  // ── API client ───────────────────────────────────────────────────────────
  rsvpApi: async ({ request }, use) => {
    await use(new RsvpApiClient(request));
  },

  // ── Seeded data ────────────────────────────────────────────────────────────
  // A confirmed client user with NO event (login / onboarding write-path specs).
  seededClient: async ({}, use) => {
    const user = await seedClientUser("client");
    await use(user);
    await deleteUser(user.userId); // cascade cleanup
  },

  // A confirmed owner + event + ceremony/reception + guests + RSVP token
  // (RSVP UI + API specs). Deleting the owner cascades the whole graph.
  seededEvent: async ({}, use) => {
    const seeded = await seedFullEvent({
      label: "owner",
      event: weddingEvent,
      locations: [ceremonyLocation, receptionLocation],
      guests: [...guests],
    });
    await use(seeded);
    await deleteUser(seeded.owner.userId); // cascade cleanup
  },
});

export { expect };
