// lib/supabase/service.ts
//
// Service-role Supabase client — bypasses Row Level Security (RLS).
//
// RESTRICTED USE: This client is ONLY permitted in the three public Route
// Handlers that require RLS bypass for token-based lookups:
//   1. app/api/rsvp/[token]/search/route.ts   — RSVP guest name search
//   2. app/api/rsvp/[token]/respond/route.ts  — RSVP submission
//   3. app/api/invitations/[token]/accept/route.ts — Co-planner invite accept
//
// SECURITY: SUPABASE_SERVICE_ROLE_KEY must NEVER be prefixed with NEXT_PUBLIC_.
// Exposing it to the browser grants full database access to any client.
// Any Server Action with an authenticated user MUST use lib/supabase/server.ts instead.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // NEVER NEXT_PUBLIC_ prefix
  );
}
