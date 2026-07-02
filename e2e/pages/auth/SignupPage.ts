/**
 * e2e/pages/auth/SignupPage.ts — POM for /signup (incl. RA 10173 consent).
 */

import type { Locator } from "@playwright/test";
import { BasePage } from "../BasePage";

export class SignupPage extends BasePage {
  // shadcn CardTitle renders a <div>, not a heading element — match by text.
  readonly heading: Locator = this.page.getByText("Create your account");
  readonly emailInput: Locator = this.page.getByLabel("Email");
  readonly passwordInput: Locator = this.page.getByLabel("Password");
  readonly consentCheckbox: Locator = this.page.getByRole("checkbox");
  readonly submitButton: Locator = this.page.getByRole("button", { name: "Create account" });

  async open(): Promise<void> {
    await this.goto("/signup");
  }

  async fill(email: string, password: string, consent: boolean): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (consent) await this.consentCheckbox.check();
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
