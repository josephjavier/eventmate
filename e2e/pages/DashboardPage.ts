/**
 * e2e/pages/DashboardPage.ts — POM for /dashboard (empty state + populated state).
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class DashboardPage extends BasePage {
  // Empty state (no event yet — D-01/D-03)
  readonly emptyStateHeading: Locator = this.page.getByRole("heading", {
    name: "Your wedding adventure starts here",
  });
  readonly createEventCta: Locator = this.page.getByRole("link", {
    name: "Create Your Event",
  });

  // Populated state
  readonly countdown: Locator = this.page.getByText("days until your wedding");

  async open(): Promise<void> {
    await this.goto("/dashboard");
  }

  /** The event title heading rendered for a client who has an event. */
  eventTitle(title: string): Locator {
    return this.page.getByRole("heading", { name: title });
  }
}
