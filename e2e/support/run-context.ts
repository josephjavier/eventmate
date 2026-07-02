/**
 * e2e/support/run-context.ts
 * Run-scoped identity + the E2E email namespace.
 *
 * Data-isolation strategy (run-scoped seed + teardown):
 *   - Every seeded auth user is created under the `e2e+` email namespace.
 *   - Emails embed a per-run id so parallel/repeat runs never collide.
 *   - global-teardown sweeps the whole `e2e+` namespace, so even a crashed
 *     run leaves nothing behind in the shared cloud Supabase project.
 *
 * Because auth.users → profiles → events → (locations/guests/tokens/responses)
 * all cascade on delete, removing the seeded auth user removes everything it owns.
 */

import { customAlphabet } from "nanoid";

// URL/DB-safe short id for run tagging.
const shortId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

/** Stable within a single `playwright test` invocation (shared across workers via env). */
export const RUN_ID: string =
  process.env.E2E_RUN_ID ?? `${Date.now().toString(36)}-${shortId()}`;

// Ensure every worker process shares the same run id.
process.env.E2E_RUN_ID = RUN_ID;

/** All E2E-owned users live under this prefix. Never use it for real accounts. */
export const E2E_EMAIL_PREFIX = "e2e+";

/** Domain reserved for throwaway E2E accounts. */
export const E2E_EMAIL_DOMAIN = "eventmate.test";

/**
 * Build a run-scoped, namespace-tagged email.
 * @example e2eEmail("owner") -> "e2e+lz3k9-owner@eventmate.test"
 */
export function e2eEmail(label: string): string {
  return `${E2E_EMAIL_PREFIX}${RUN_ID}-${label}@${E2E_EMAIL_DOMAIN}`;
}

/** True for any address in the E2E namespace — the teardown sweep predicate. */
export function isE2EEmail(email: string | undefined | null): boolean {
  return !!email && email.startsWith(E2E_EMAIL_PREFIX);
}
