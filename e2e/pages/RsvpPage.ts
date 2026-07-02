/**
 * e2e/pages/RsvpPage.ts — POM for the public /rsvp/[token] page (no auth).
 *
 * Locators use the UI-SPEC locked copy. `Going` is matched exact:true so it
 * doesn't also match `Not Going`. Apostrophes in copy are matched with regex
 * (the markup uses &apos;).
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RsvpPage extends BasePage {
  readonly heading: Locator = this.page.getByRole("heading", { name: /You.re Invited/ });
  readonly searchInput: Locator = this.page.getByLabel("Find your name");
  readonly notFound: Locator = this.page.getByText(/Name not found/);

  readonly goingButton: Locator = this.page.getByRole("button", { name: "Going", exact: true });
  readonly notGoingButton: Locator = this.page.getByRole("button", {
    name: "Not Going",
    exact: true,
  });
  readonly plusOneYes: Locator = this.page.getByRole("button", { name: /Yes, they.re coming/ });
  readonly plusOneNo: Locator = this.page.getByRole("button", { name: "No, just me" });
  readonly plusOneNameInput: Locator = this.page.getByLabel("+1 Name");
  readonly mealPreferenceInput: Locator = this.page.getByLabel("Meal Preference");
  readonly confirmButton: Locator = this.page.getByRole("button", { name: "Confirm RSVP" });
  readonly successGoing: Locator = this.page.getByText(/You.re confirmed! See you on the big day\./);

  async open(token: string): Promise<void> {
    await this.goto(`/rsvp/${token}`);
  }

  /** A guest option in the search-results dropdown, matched by any substring. */
  guestOption(nameFragment: string | RegExp): Locator {
    const re = typeof nameFragment === "string" ? new RegExp(nameFragment) : nameFragment;
    return this.page.getByRole("button", { name: re });
  }

  /** Type a query and click the matching guest result. */
  async searchAndSelect(query: string, optionName: string | RegExp): Promise<void> {
    await this.searchInput.fill(query);
    await this.guestOption(optionName).click();
  }
}
