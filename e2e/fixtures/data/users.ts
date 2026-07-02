/**
 * e2e/fixtures/data/users.ts
 * Static user data. Emails are assigned at seed time (run-scoped, see run-context),
 * so only the reusable bits (password, display name) live here.
 */

export const clientUser = {
  password: "E2ePassw0rd!test",
  fullName: "Test Couple",
} as const;

/** Weak password used to assert client-side validation (min 8 chars). */
export const invalidPasswords = {
  tooShort: "short1", // < 8 chars
} as const;
