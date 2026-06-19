// lib/supabase/client.ts
// Used in 'use client' components that need to read Supabase data without a
// Server Action round-trip (e.g., real-time subscriptions, client-side fetches).
// Most data fetching goes through Server Components or Server Actions — use sparingly.
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
