/**
 * e2e/pages/auth/LoginPage.ts — POM for /login.
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "../BasePage";

export class LoginPage extends BasePage {
  // NOTE: the auth card title is a shadcn CardTitle (<div>), not a heading element,
  // so this is matched by text, not role=heading.
  readonly heading: Locator = this.page.getByText("Welcome back");
  readonly emailInput: Locator = this.page.getByLabel("Email");
  readonly passwordInput: Locator = this.page.getByLabel("Password");
  readonly submitButton: Locator = this.page.getByRole("button", { name: "Sign in" });
  readonly serverError: Locator = this.page.locator("p.text-destructive");

  async open(): Promise<void> {
    await this.goto("/login");
  }

  /** Fill + submit without waiting for navigation (for validation assertions). */
  async submitCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Full happy-path login: open, submit, wait until the dashboard is reached. */
  async login(email: string, password: string): Promise<void> {
    await this.open();
    await this.submitCredentials(email, password);
    await this.page.waitForURL("**/dashboard");
  }
}
