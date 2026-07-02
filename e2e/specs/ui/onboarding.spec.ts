/**
 * e2e/specs/ui/onboarding.spec.ts
 * Full authed write-path journey: empty dashboard → onboarding → countdown.
 *
 * REGRESSION GUARD: this test caught a real event-creation bug — createEvent
 * chained `.select()` on the insert (INSERT ... RETURNING), which re-read the new
 * row under the events SELECT policy `user_can_access_event(id)`; that STABLE
 * SECURITY DEFINER helper can't see the just-inserted row, so RETURNING was denied
 * with "violates row-level security policy". Fixed in app/actions/events.ts
 * (bare insert + separate id read). If event creation regresses, the countdown
 * never renders and this test fails.
 */

import { test, expect } from "../../fixtures/base";
import { futureDate } from "../../fixtures/data/events";

test("client creates their event via onboarding and sees the countdown", async ({
  loginPage,
  dashboardPage,
  onboardingPage,
  seededClient,
  page,
}) => {
  await loginPage.login(seededClient.email, seededClient.password);

  // Empty state → CTA into the wizard
  await expect(dashboardPage.createEventCta).toBeVisible();
  await dashboardPage.createEventCta.click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Complete both steps (ceremony only — reception is optional)
  await onboardingPage.createEvent({
    date: futureDate(200),
    time: "15:00",
    venue: "Manila Cathedral",
    address: "Cabildo St, Intramuros, Manila",
  });

  // Back on the dashboard with a live countdown
  await expect(dashboardPage.countdown).toBeVisible();
});
