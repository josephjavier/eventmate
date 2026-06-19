/**
 * app/api/rsvp/[token]/respond/route.ts
 * Public RSVP submission handler — no authentication required.
 *
 * AUTH-07: Public route, token is the only authorization.
 * RSVP-04: Guest can submit a Going/Not Going response without an account.
 * RSVP-05: +1 attending and +1 name recorded when has_plus_one is true.
 * RSVP-06: meal_preference recorded ONLY when events.meal_preference_enabled is true.
 *
 * Security (4-step checklist — PATTERNS.md §app/api/rsvp/[token]/respond/route.ts):
 *   1. Validate token → event_id + rsvp_deadline (404 if invalid)
 *   2. isRsvpDeadlinePassed check → 403 "RSVP closed" if deadline passed (T-1-14)
 *   3. Validate guest_id belongs to this event (T-1-13 — no cross-event tampering)
 *   4. UPSERT rsvp_responses with responded_at = now() (D-07)
 *
 * T-1-06: Service client usage narrowly scoped to token lookup + event data.
 * T-1-13: guest_id ownership validated before any write.
 * T-1-14: Deadline gate enforced via isRsvpDeadlinePassed.
 *
 * D-07: responded_at = now() on every upsert.
 * D-08: RSVP notification email hook point — wired in Plan 01-09.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isRsvpDeadlinePassed } from "@/lib/rsvp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params; // Next.js 15: params is async
  const body = await request.json();

  const {
    guest_id,
    status,
    plus_one_attending,
    plus_one_name,
    meal_preference,
  } = body as {
    guest_id: string;
    status: "attending" | "not_attending";
    plus_one_attending?: boolean;
    plus_one_name?: string;
    meal_preference?: string;
  };

  // Input validation
  if (!guest_id || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (status !== "attending" && status !== "not_attending") {
    return NextResponse.json({ error: "Invalid RSVP status" }, { status: 400 });
  }

  // Service client — scoped to token lookup and event data (T-1-06)
  const supabase = createServiceClient();

  // ── Step 1: Validate token → event_id + rsvp_deadline ─────────────────────
  const { data: tokenRow } = await supabase
    .from("rsvp_tokens")
    .select("event_id, events(rsvp_deadline, meal_preference_enabled)")
    .eq("token", token)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });
  }

  const event = tokenRow.events as {
    rsvp_deadline: string | null;
    meal_preference_enabled: boolean;
  } | null;

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // ── Step 2: Deadline gate (T-1-14, D-06) ──────────────────────────────────
  if (isRsvpDeadlinePassed(event.rsvp_deadline)) {
    return NextResponse.json(
      { error: "RSVP has closed" },
      { status: 403 }
    );
  }

  // ── Step 3: Validate guest_id belongs to this event (T-1-13) ──────────────
  const { data: guest } = await supabase
    .from("guests")
    .select("id")
    .eq("id", guest_id)
    .eq("event_id", tokenRow.event_id)
    .single();

  if (!guest) {
    return NextResponse.json(
      { error: "Guest not found on this event" },
      { status: 403 }
    );
  }

  // ── Step 4: UPSERT rsvp_responses (D-07: responded_at = now()) ────────────
  const upsertData: {
    guest_id: string;
    status: string;
    responded_at: string;
    plus_one_attending?: boolean;
    plus_one_name?: string | null;
    meal_preference?: string | null;
  } = {
    guest_id,
    status,
    responded_at: new Date().toISOString(), // D-07: response timestamp
    plus_one_attending: plus_one_attending ?? false,
    plus_one_name: plus_one_name ?? null,
    // RSVP-06: only record meal_preference when the feature is enabled
    meal_preference: event.meal_preference_enabled
      ? (meal_preference ?? null)
      : null,
  };

  const { error: upsertError } = await supabase
    .from("rsvp_responses")
    .upsert(upsertData, { onConflict: "guest_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // D-08: RSVP notification email — implemented in Plan 01-09
  // Hook point: after successful upsert, send notification to event owner
  // import { sendRsvpNotification } from '@/lib/notifications' — Plan 01-09 wires this

  return NextResponse.json({ ok: true });
}
