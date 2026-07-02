/**
 * e2e/specs/ui/rsvp.spec.ts — public RSVP page (no auth; token authorizes).
 */

import { test, expect } from "../../fixtures/base";

test.describe("Public RSVP", () => {
  test("guest RSVPs Going with a +1 and meal preference", async ({ rsvpPage, seededEvent }) => {
    await rsvpPage.open(seededEvent.token);
    await expect(rsvpPage.heading).toBeVisible();

    // "Maria Santos (Maria)" is the guest with a +1
    await rsvpPage.searchAndSelect("Maria", /Maria Santos.*\(Maria\)/);
    await rsvpPage.goingButton.click();
    await rsvpPage.plusOneYes.click();
    await rsvpPage.plusOneNameInput.fill("Juan Santos");
    await rsvpPage.mealPreferenceInput.fill("Beef");
    await rsvpPage.confirmButton.click();

    await expect(rsvpPage.successGoing).toBeVisible();
  });

  test("shows the name collision as two disambiguated results (D-05)", async ({
    rsvpPage,
    seededEvent,
  }) => {
    await rsvpPage.open(seededEvent.token);
    await rsvpPage.searchInput.fill("Maria Santos");

    await expect(rsvpPage.guestOption(/Maria Santos.*\(Maria\)/)).toBeVisible();
    await expect(rsvpPage.guestOption(/Maria Santos.*\(Tita Cora\)/)).toBeVisible();
  });

  test("shows a not-found message for an unknown name", async ({ rsvpPage, seededEvent }) => {
    await rsvpPage.open(seededEvent.token);
    await rsvpPage.searchInput.fill("Zxqwerty");

    await expect(rsvpPage.notFound).toBeVisible();
  });
});
