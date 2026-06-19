/**
 * app/rsvp/[token]/page.tsx
 * Public RSVP page — Server Component.
 *
 * AUTH-07: OUTSIDE all auth route groups — no verifySession() called here.
 * Token is the ONLY authorization for this page.
 *
 * This page:
 *   1. Looks up the rsvp_token to find the associated event
 *   2. Fetches event details (title, date, deadline, motif, attire photos, locations)
 *   3. Checks isRsvpDeadlinePassed(event.rsvp_deadline) — D-06
 *   4. Renders RSVPClosedPage if deadline has passed (D-09)
 *   5. Renders RSVPOpenPage if RSVP is still open
 *
 * No app navigation, no authentication UI.
 * Max-width 480px per UI-SPEC §RSVP Public Page layout contract.
 *
 * T-1-06: Service client used narrowly for token lookup + event join only.
 *
 * PATTERNS.md §app/rsvp/[token]/page.tsx — full pattern implemented.
 */

import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { isRsvpDeadlinePassed } from "@/lib/rsvp";
import { RSVPOpenPage } from "@/components/rsvp/RSVPOpenPage";
import { RSVPClosedPage } from "@/components/rsvp/RSVPClosedPage";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventLocation {
  id: string;
  label: string | null;
  role: string | null;
  venue_name: string | null;
  address: string | null;
  location_time: string | null;
}

export interface RsvpEventData {
  title: string | null;
  event_date: string | null;
  rsvp_deadline: string | null;
  color_motif: string | null;
  attire_photo_1_path: string | null;
  attire_photo_2_path: string | null;
  meal_preference_enabled: boolean;
  event_locations: EventLocation[];
  // Signed URLs for attire photos (generated server-side)
  attire_photo_1_url?: string | null;
  attire_photo_2_url?: string | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RSVPPage({
  params,
}: {
  params: Promise<{ token: string }>; // Next.js 15: async params
}) {
  const { token } = await params;

  // T-1-06: Service client — scoped to token lookup + event join
  const supabase = createServiceClient();

  // Look up token → event (with all fields needed for open + closed pages)
  const { data: tokenRow } = await supabase
    .from("rsvp_tokens")
    .select(
      `event_id, events(
        title,
        event_date,
        rsvp_deadline,
        color_motif,
        attire_photo_1_path,
        attire_photo_2_path,
        meal_preference_enabled,
        event_locations(id, label, role, venue_name, address, location_time)
      )`
    )
    .eq("token", token)
    .single();

  if (!tokenRow) {
    notFound();
  }

  const eventRaw = tokenRow.events as {
    title: string | null;
    event_date: string | null;
    rsvp_deadline: string | null;
    color_motif: string | null;
    attire_photo_1_path: string | null;
    attire_photo_2_path: string | null;
    meal_preference_enabled: boolean;
    event_locations: EventLocation[];
  } | null;

  if (!eventRaw) {
    notFound();
  }

  // D-09: Generate signed URLs for attire photos if paths exist
  // These go in the 'event-media' bucket (Storage path convention: event_id/filename)
  let attirePhoto1Url: string | null = null;
  let attirePhoto2Url: string | null = null;

  if (eventRaw.attire_photo_1_path) {
    const { data: url1 } = await supabase.storage
      .from("event-media")
      .createSignedUrl(eventRaw.attire_photo_1_path, 60 * 60); // 1-hour signed URL
    attirePhoto1Url = url1?.signedUrl ?? null;
  }

  if (eventRaw.attire_photo_2_path) {
    const { data: url2 } = await supabase.storage
      .from("event-media")
      .createSignedUrl(eventRaw.attire_photo_2_path, 60 * 60);
    attirePhoto2Url = url2?.signedUrl ?? null;
  }

  const event: RsvpEventData = {
    ...eventRaw,
    attire_photo_1_url: attirePhoto1Url,
    attire_photo_2_url: attirePhoto2Url,
  };

  // D-06: Check if deadline has passed to determine open/closed state
  const deadlinePassed = isRsvpDeadlinePassed(event.rsvp_deadline);

  return (
    /* No app navigation — public page, token-only auth (AUTH-07) */
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[480px] px-4 py-8">
        {/* Minimal logo header */}
        <div className="mb-8 text-center">
          <span className="text-xl font-semibold text-[#BE3C5E]">EventMate</span>
        </div>

        {/* D-06: Deadline gate — show closed or open state */}
        {deadlinePassed ? (
          <RSVPClosedPage event={event} />
        ) : (
          <RSVPOpenPage event={event} token={token} />
        )}
      </div>
    </div>
  );
}
