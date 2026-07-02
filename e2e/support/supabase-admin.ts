/**
 * e2e/support/supabase-admin.ts
 * Service-role Supabase client for the E2E seeder — bypasses RLS.
 *
 * This is the TEST-SIDE mirror of lib/supabase/service.ts. It is only ever
 * imported by e2e/ code (seeding, setup, teardown) to provision confirmed
 * users and event data. It must NEVER be imported by application code.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./env";

let cached: SupabaseClient<Database> | null = null;

/** Singleton service-role client for the current test process. */
export function admin(): SupabaseClient<Database> {
  if (!cached) {
    cached = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return cached;
}
