"use server";

/**
 * app/actions/guests.ts
 * Server Actions for the guest list and RSVP management feature.
 *
 * DUAL AUTH LAYER (CLAUDE.md §Architecture Decisions #5):
 * Every action calls verifySession() independently — never rely on middleware alone.
 *
 * Requirements covered:
 * RSVP-01: addGuest — full name + nickname + +1
 * RSVP-02: +1 name stored on guest row (has_plus_one + plus_one_name)
 * RSVP-03: generateRsvpLink — creates rsvp_tokens row, returns shareable URL
 * RSVP-06: setMealPreferenceEnabled — toggles events.meal_preference_enabled
 * RSVP-07: RsvpSummaryBar counts come from data fetched in the page (not an action)
 * RSVP-08: overrideRsvp — upserts rsvp_responses with responded_at=now()
 * D-05: nickname field included in addGuest / updateGuest
 * D-06: setRsvpDeadline — stores events.rsvp_deadline
 * D-07: overrideRsvp stores responded_at = new Date().toISOString()
 * T-1-01: verifySession() on every action (cross-event access via RLS + DAL)
 */

import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { generateRsvpToken } from "@/lib/rsvp";
import { revalidatePath } from "next/cache";
import {
  addGuestSchema,
  updateGuestSchema,
  overrideRsvpSchema,
  rsvpDeadlineSchema,
} from "@/lib/schemas/guest";

// ─── addGuest ─────────────────────────────────────────────────────────────────

/**
 * addGuest — inserts a new guest record for the authenticated client's event.
 *
 * RSVP-01: full name + optional nickname (D-05) + +1 flag (RSVP-02)
 */
export async function addGuest(
  eventId: string,
  data: {
    full_name: string;
    nickname?: string;
    has_plus_one?: boolean;
    plus_one_name?: string;
  }
) {
  const user = await verifySession();
  const supabase = await createClient();

  const parsed = addGuestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid guest data" };
  }

  // Belt-and-suspenders: confirm event belongs to this user (RLS also enforces)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!event) {
    return { error: "Event not found" };
  }

  const { error } = await supabase.from("guests").insert({
    event_id: eventId,
    full_name: parsed.data.full_name,
    nickname: parsed.data.nickname ?? null,
    has_plus_one: parsed.data.has_plus_one,
    plus_one_name: parsed.data.plus_one_name ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/guests");
  return { success: true };
}

// ─── updateGuest ──────────────────────────────────────────────────────────────

/**
 * updateGuest — updates an existing guest record.
 */
export async function updateGuest(
  guestId: string,
  data: {
    full_name: string;
    nickname?: string;
    has_plus_one?: boolean;
    plus_one_name?: string;
  }
) {
  await verifySession();
  const supabase = await createClient();

  const parsed = updateGuestSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid guest data" };
  }

  // RLS on guests table enforces event ownership
  const { error } = await supabase
    .from("guests")
    .update({
      full_name: parsed.data.full_name,
      nickname: parsed.data.nickname ?? null,
      has_plus_one: parsed.data.has_plus_one,
      plus_one_name: parsed.data.plus_one_name ?? null,
    })
    .eq("id", guestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/guests");
  return { success: true };
}

// ─── deleteGuest ──────────────────────────────────────────────────────────────

/**
 * deleteGuest — permanently removes a guest and their RSVP response
 * (ON DELETE CASCADE on rsvp_responses.guest_id FK handles response cleanup).
 */
export async function deleteGuest(guestId: string) {
  await verifySession();
  const supabase = await createClient();

  // RLS on guests enforces event ownership
  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/guests");
  return { success: true };
}

// ─── overrideRsvp ────────────────────────────────────────────────────────────

/**
 * overrideRsvp — couple manually overrides a guest's RSVP status.
 *
 * RSVP-08: Upserts rsvp_responses with the chosen status and records responded_at.
 * D-07: responded_at = now() (current UTC timestamp).
 *
 * When status is 'pending', deletes the rsvp_response row to reset to pending state.
 */
export async function overrideRsvp(
  guestId: string,
  status: "attending" | "not_attending" | "pending"
) {
  await verifySession();
  const supabase = await createClient();

  const parsed = overrideRsvpSchema.safeParse({ status });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status" };
  }

  if (parsed.data.status === "pending") {
    // Reset to pending: remove the rsvp_response row entirely
    const { error } = await supabase
      .from("rsvp_responses")
      .delete()
      .eq("guest_id", guestId);

    if (error) {
      return { error: error.message };
    }
  } else {
    // D-07: upsert with responded_at = now()
    const { error } = await supabase
      .from("rsvp_responses")
      .upsert(
        {
          guest_id: guestId,
          status: parsed.data.status,
          responded_at: new Date().toISOString(),
        },
        { onConflict: "guest_id" }
      );

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/event/guests");
  return { success: true };
}

// ─── generateRsvpLink ────────────────────────────────────────────────────────

/**
 * generateRsvpLink — generates (or retrieves existing) RSVP token for an event.
 *
 * RSVP-03: Returns the shareable URL ${NEXT_PUBLIC_SITE_URL}/rsvp/${token}.
 * Uses generateRsvpToken() from lib/rsvp.ts (nanoid(20)) if no token exists.
 * Idempotent: returns the existing token if one already exists for this event.
 */
export async function generateRsvpLink(eventId: string) {
  const user = await verifySession();
  const supabase = await createClient();

  // Belt-and-suspenders: confirm event belongs to this user
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (!event) {
    return { error: "Event not found" };
  }

  // Check for existing token first (idempotent)
  const { data: existing } = await supabase
    .from("rsvp_tokens")
    .select("token")
    .eq("event_id", eventId)
    .maybeSingle();

  if (existing?.token) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return { url: `${siteUrl}/rsvp/${existing.token}` };
  }

  // Create a new token
  const token = generateRsvpToken();

  const { error } = await supabase.from("rsvp_tokens").insert({
    event_id: eventId,
    token,
  });

  if (error) {
    return { error: error.message };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return { url: `${siteUrl}/rsvp/${token}` };
}

// ─── setRsvpDeadline ─────────────────────────────────────────────────────────

/**
 * setRsvpDeadline — sets or clears the RSVP deadline on the event.
 *
 * D-06: After this date, isRsvpDeadlinePassed() returns true and the RSVP page locks.
 * Accepts a YYYY-MM-DD date string or null to clear the deadline.
 */
export async function setRsvpDeadline(eventId: string, date: string | null) {
  const user = await verifySession();
  const supabase = await createClient();

  if (date !== null) {
    const parsed = rsvpDeadlineSchema.safeParse({ date });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid date" };
    }
  }

  const { error } = await supabase
    .from("events")
    .update({ rsvp_deadline: date })
    .eq("id", eventId)
    .eq("client_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/guests");
  return { success: true };
}

// ─── setMealPreferenceEnabled ─────────────────────────────────────────────────

/**
 * setMealPreferenceEnabled — toggles whether guests are asked for meal preference.
 *
 * RSVP-06: When enabled, the RSVP form shows a meal preference field.
 *          The respond route only records meal_preference when this is true.
 */
export async function setMealPreferenceEnabled(
  eventId: string,
  enabled: boolean
) {
  const user = await verifySession();
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ meal_preference_enabled: enabled })
    .eq("id", eventId)
    .eq("client_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/guests");
  return { success: true };
}
