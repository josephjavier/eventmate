/**
 * e2e/pages/BasePage.ts
 * Shared base for every Page Object. Holds the Playwright `page` and common nav.
 * Page Objects expose intent-revealing methods + locators; specs never touch
 * raw selectors, so a markup change is fixed in one place.
 */

import type { Page } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Navigate to an app-relative path (baseURL comes from the Playwright config). */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
