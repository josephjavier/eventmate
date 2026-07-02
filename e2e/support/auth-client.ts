/**
 * e2e/support/auth-client.ts
 * Build a Supabase client authenticated AS a seeded user (a real user JWT), for
 * API-level tests that must exercise Row Level Security as that user.
 *
 * Contrast with support/supabase-admin.ts (service role), which BYPASSES RLS — a
 * service-role client would hide any RLS bug. Use this when the thing under test
 * is the policy behavior itself (e.g. the events RETURNING/SELECT-policy regression).
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

/** Anon-key client signed in as the given user; its .from() calls run under that user's RLS. */
export async function signInAsUser(
  email: string,
  password: string,
): Promise<SupabaseClient<Database>> {
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`[e2e] signInAsUser failed for ${email}: ${error.message}`);
  }
  return supabase;
}
