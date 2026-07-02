/**
 * e2e/pages/OnboardingPage.ts — POM for the /onboarding two-step wizard.
 *
 * Step 2 venue/address inputs have no labels (placeholder-only) and the ceremony
 * and reception rows share placeholders, so those locators are resolved by DOM
 * order (.first() = ceremony). Only ceremony is filled in the happy path.
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OnboardingPage extends BasePage {
  readonly stepIndicator: Locator = this.page.getByText(/Step \d of 2/);

  // Step 1
  readonly weddingDateInput: Locator = this.page.getByLabel("Wedding date");
  readonly startTimeInput: Locator = this.page.getByLabel("Start time");
  readonly continueButton: Locator = this.page.getByRole("button", {
    name: "Continue to Location",
  });

  // Step 2 (placeholder + DOM order; ceremony is first)
  readonly ceremonyVenueInput: Locator = this.page
    .getByPlaceholder("e.g., Saint Peter Parish Church")
    .first();
  readonly ceremonyAddressInput: Locator = this.page.getByPlaceholder("Full address").first();
  readonly startPlanningButton: Locator = this.page.getByRole("button", {
    name: "Start Planning",
  });

  async open(): Promise<void> {
    await this.goto("/onboarding");
  }

  async completeStepOne(date: string, time?: string): Promise<void> {
    await this.weddingDateInput.fill(date);
    if (time) await this.startTimeInput.fill(time);
    await this.continueButton.click();
  }

  async completeStepTwo(venue: string, address: string): Promise<void> {
    await this.ceremonyVenueInput.fill(venue);
    await this.ceremonyAddressInput.fill(address);
    await this.startPlanningButton.click();
  }

  /** Run the whole wizard and wait for the resulting dashboard. */
  async createEvent(input: {
    date: string;
    time?: string;
    venue: string;
    address: string;
  }): Promise<void> {
    await this.completeStepOne(input.date, input.time);
    await this.completeStepTwo(input.venue, input.address);
    await this.page.waitForURL("**/dashboard");
  }
}
