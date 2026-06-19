/**
 * app/api/rsvp/[token]/search/route.ts
 * Public RSVP guest name/nickname search — no authentication required.
 *
 * AUTH-07: Public page, no account needed. Token is the only authorization.
 * RSVP-04: Guests can find their name by searching full name or nickname (D-05).
 *
 * Security (T-1-12 — Information Disclosure — RSVP guest enumeration):
 *   - Minimum 2 characters required before querying (enumeration guard)
 *   - Returns at most 5 results (.limit(5))
 *   - Returns ONLY id, full_name, nickname, has_plus_one — no contact info exposed
 *   - Uses service client for RLS bypass (token lookup only)
 *
 * UI-SPEC §Interaction Contracts: RSVP Name Search:
 *   - Minimum 2 characters before query
 *   - Results format: "Full Name (Nickname)" when nickname exists
 *   - Limit 5 results (server enforced here)
 *
 * PATTERNS.md §app/api/rsvp/[token]/search/route.ts — exact pattern implemented.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params; // Next.js 15: params is async
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  // T-1-12: Enumeration guard — require at least 2 characters
  if (!q || q.length < 2) {
    return NextResponse.json({ guests: [] });
  }

  // Service client bypasses RLS for token lookup (T-1-06: scoped narrowly)
  const supabase = createServiceClient();

  // Look up rsvp_tokens by token to get event_id
  const { data: tokenRow } = await supabase
    .from("rsvp_tokens")
    .select("event_id")
    .eq("token", token)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  // D-05: Search by both full_name and nickname (Filipino nickname-first convention)
  // T-1-12: Return ONLY minimal fields — no contact info
  const { data: guests } = await supabase
    .from("guests")
    .select("id, full_name, nickname, has_plus_one")
    .eq("event_id", tokenRow.event_id)
    .or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%`)
    .limit(5); // T-1-12: Enforce result cap server-side

  return NextResponse.json({ guests: guests ?? [] });
}
