/**
 * e2e/support/env.ts
 * Loads and validates the environment the E2E suite needs.
 *
 * Env comes from the SAME `.env.local` the app uses (local-first: tests run
 * against `next dev` + the existing cloud Supabase). We load it via @next/env
 * (already a Next dependency) so there is a single source of truth — no separate
 * test env file to keep in sync.
 */

import { loadEnvConfig } from "@next/env";

// Load .env.local / .env into process.env (idempotent).
loadEnvConfig(process.cwd(), /* dev */ true);

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[e2e] Missing required env var ${name}. Add it to .env.local ` +
        `(same values the app uses). E2E runs against your cloud Supabase.`,
    );
  }
  return value;
}

/** Base URL of the app under test. Playwright's webServer boots `next dev` here. */
export const BASE_URL: string = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/** Supabase project URL (public). */
export const SUPABASE_URL: string = required("NEXT_PUBLIC_SUPABASE_URL");

/** Supabase anon (public) key — used to build clients authenticated AS a user (RLS-enforced). */
export const SUPABASE_ANON_KEY: string = required("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Service-role key — used ONLY by the test seeder to create confirmed users and
 * seed/teardown event data (mirrors lib/supabase/service.ts). Never NEXT_PUBLIC_.
 */
export const SUPABASE_SERVICE_ROLE_KEY: string = required(
  "SUPABASE_SERVICE_ROLE_KEY",
);
