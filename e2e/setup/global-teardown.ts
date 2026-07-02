/**
 * e2e/setup/global-teardown.ts
 * Runs once after the whole suite. Safety-net cleanup: sweep every user in the
 * `e2e+` namespace (fixtures already self-clean; this catches the auth.setup
 * user and any straggler from a crashed run). Deleting each user cascades to all
 * of its event data.
 */

import { sweepE2EUsers } from "../support/seed";

async function globalTeardown(): Promise<void> {
  const deleted = await sweepE2EUsers();
  console.log(`[e2e] global-teardown: swept ${deleted} E2E user(s).`);
}

export default globalTeardown;
