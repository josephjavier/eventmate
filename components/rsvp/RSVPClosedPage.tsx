/**
 * components/rsvp/RSVPClosedPage.tsx
 * RSVP closed state — shown after the RSVP deadline has passed.
 *
 * D-09: After the deadline, the RSVP page shows:
 *   - "RSVP has closed" message
 *   - Event location(s) and schedule
 *   - Color motif (text)
 *   - Attire reference photos (up to 2)
 *
 * UI-SPEC §RSVP Public Page — Closed State copy (all locked strings):
 *   - Heading: "RSVP has closed"
 *   - Body: "Thank you to everyone who responded. We look forward to seeing you!"
 *   - Event details section heading: "Event Details"
 *   - Attire section heading: "Dress Code & Motif"
 *
 * Layout: same max-w-480px container as open state (set in parent page).
 * No auth UI, no app navigation.
 *
 * PATTERNS.md §components/rsvp/RSVPClosedPage.tsx — exact pattern implemented.
 */

import { MapPin, Clock } from "lucide-react";
import type { RsvpEventData } from "@/app/rsvp/[token]/page";

interface RSVPClosedPageProps {
  event: RsvpEventData;
}

export function RSVPClosedPage({ event }: RSVPClosedPageProps) {
  const locations = event.event_locations ?? [];
  const hasLocations = locations.length > 0;
  const hasMotif = !!(event.color_motif || event.attire_photo_1_url || event.attire_photo_2_url);

  return (
    <div className="space-y-6">
      {/* ── Closed message card ────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        {/* UI-SPEC: "RSVP has closed" heading */}
        <h1 className="text-3xl font-semibold text-foreground">
          RSVP has closed
        </h1>
        {/* UI-SPEC: body copy */}
        <p className="text-base font-normal text-muted-foreground">
          Thank you to everyone who responded. We look forward to seeing you!
        </p>
      </div>

      {/* ── Event title + date ─────────────────────────────────────────── */}
      {(event.title || event.event_date) && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-1">
          {event.title && (
            <h2 className="text-xl font-semibold text-foreground">{event.title}</h2>
          )}
          {event.event_date && (
            <p className="text-base font-normal text-muted-foreground">
              {new Date(event.event_date).toLocaleDateString("en-PH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </div>
      )}

      {/* ── Event Details section (D-09: locations list with role labels) ─ */}
      {hasLocations && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            {/* UI-SPEC: "Event Details" section heading */}
            <h2 className="text-xl font-semibold text-foreground">
              Event Details
            </h2>
          </div>
          <div className="divide-y divide-border">
            {locations.map((loc) => (
              <div key={loc.id} className="px-5 py-4 space-y-1">
                {/* Role label (e.g., "Church", "Reception Hall") */}
                {loc.role && (
                  <p className="text-sm font-semibold text-[#BE3C5E]">
                    {loc.role}
                  </p>
                )}
                {/* Label / venue name */}
                {(loc.label || loc.venue_name) && (
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-base font-normal text-foreground">
                      {loc.venue_name ?? loc.label}
                    </p>
                  </div>
                )}
                {/* Address */}
                {loc.address && (
                  <p className="text-sm font-normal text-muted-foreground pl-6">
                    {loc.address}
                  </p>
                )}
                {/* Time */}
                {loc.location_time && (
                  <div className="flex items-center gap-2 pl-6">
                    <Clock
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-normal text-muted-foreground">
                      {loc.location_time}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Dress Code & Motif section (D-09) ─────────────────────────── */}
      {hasMotif && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            {/* UI-SPEC: "Dress Code & Motif" section heading */}
            <h2 className="text-xl font-semibold text-foreground">
              Dress Code &amp; Motif
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Color motif text (D-09) */}
            {event.color_motif && (
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: event.color_motif }}
                  aria-hidden="true"
                />
                <p className="text-base font-normal text-foreground">
                  {event.color_motif}
                </p>
              </div>
            )}

            {/* Attire reference photos — up to 2 (D-09) */}
            {(event.attire_photo_1_url || event.attire_photo_2_url) && (
              <div className="grid grid-cols-2 gap-3">
                {event.attire_photo_1_url && (
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.attire_photo_1_url}
                      alt="Attire reference 1"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {event.attire_photo_2_url && (
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.attire_photo_2_url}
                      alt="Attire reference 2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
