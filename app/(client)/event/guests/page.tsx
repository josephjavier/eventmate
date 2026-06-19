/**
 * app/(client)/event/guests/page.tsx
 * Guest list page — Server Component.
 *
 * AUTH: assertRole('client') — redirects to /login if unauthenticated or wrong role.
 * DUAL AUTH LAYER: assertRole() calls verifySession() internally per CLAUDE.md §5.
 *
 * Loads: guests + rsvp_responses (for status join) + event.rsvp_deadline
 * Renders: RsvpSummaryBar + GenerateLinkButton + AddGuestTrigger + RsvpDeadlineField + GuestTable
 *
 * RSVP-01: Couple can add guests with full name + nickname + +1
 * RSVP-02: +1 field shown in AddGuestDialog
 * RSVP-03: generateRsvpLink via GenerateLinkButton
 * RSVP-06: setMealPreferenceEnabled toggle
 * RSVP-07: 4-count RSVP summary (Invited/Going/Not Going/Pending)
 * RSVP-08: Manual override via GuestTable row actions
 * D-05: nickname field (guests can search by nickname on RSVP page)
 * D-06: RSVP deadline field
 * D-07: responded_at shown in GuestTable Response Date column
 *
 * UI-SPEC §Guests Page:
 *   - Page title: "Guests"
 *   - RSVP summary: Invited / Going / Not Going / Pending
 *   - Empty state heading: "No guests added yet"
 *   - Empty state body: "Add your guests to build the RSVP list. Include nicknames so guests can find themselves easily."
 *   - Add guest CTA: "Add Guest"
 *   - Generate RSVP link CTA: "Generate RSVP Link"
 *   - RSVP deadline label: "RSVP deadline"
 */

import { assertRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { RsvpSummaryBar } from "@/components/guests/RsvpSummaryBar";
import { GuestTable, type GuestRow } from "@/components/guests/GuestTable";
import { GenerateLinkButton } from "@/components/guests/GenerateLinkButton";
import { AddGuestTrigger } from "@/components/guests/AddGuestTrigger";
import { RsvpDeadlineField } from "@/components/guests/RsvpDeadlineField";

export default async function GuestsPage() {
  // Auth + role guard (CLAUDE.md §Architecture Decisions #5)
  const { user } = await assertRole("client");
  const supabase = await createClient();

  // Fetch the client's event (including rsvp_deadline)
  const { data: event } = await supabase
    .from("events")
    .select("id, rsvp_deadline")
    .eq("client_id", user.id)
    .maybeSingle();

  if (!event) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-foreground">Guests</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <p className="text-xl font-semibold text-foreground">No event created yet</p>
          <p className="text-base font-normal text-muted-foreground">
            Create your wedding event to start managing your guest list.
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-md bg-[#BE3C5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#BE3C5E]/90"
          >
            Create Your Event
          </a>
        </div>
      </div>
    );
  }

  // Fetch all guests for this event
  const { data: guests } = await supabase
    .from("guests")
    .select("id, full_name, nickname, has_plus_one, plus_one_name")
    .eq("event_id", event.id)
    .order("full_name", { ascending: true });

  const guestList = guests ?? [];

  // Fetch all RSVP responses for guests in this event
  // Join via guest_id to get status + responded_at
  const guestIds = guestList.map((g) => g.id);

  let rsvpMap: Record<
    string,
    { status: string; responded_at: string }
  > = {};

  if (guestIds.length > 0) {
    const { data: responses } = await supabase
      .from("rsvp_responses")
      .select("guest_id, status, responded_at")
      .in("guest_id", guestIds);

    if (responses) {
      for (const r of responses) {
        rsvpMap[r.guest_id] = {
          status: r.status,
          responded_at: r.responded_at,
        };
      }
    }
  }

  // Build GuestRow array with joined RSVP status
  const guestRows: GuestRow[] = guestList.map((g) => {
    const rsvp = rsvpMap[g.id];
    return {
      id: g.id,
      full_name: g.full_name,
      nickname: g.nickname,
      has_plus_one: g.has_plus_one,
      plus_one_name: g.plus_one_name,
      rsvp_status: rsvp
        ? (rsvp.status as "attending" | "not_attending")
        : "pending",
      responded_at: rsvp?.responded_at ?? null,
    };
  });

  // ─── Compute RSVP summary counts (RSVP-07) ─────────────────────────────────
  const invited = guestRows.length;
  const going = guestRows.filter((g) => g.rsvp_status === "attending").length;
  const notGoing = guestRows.filter(
    (g) => g.rsvp_status === "not_attending"
  ).length;
  const pending = guestRows.filter((g) => g.rsvp_status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* UI-SPEC: page title "Guests" */}
        <h1 className="text-3xl font-semibold text-foreground">Guests</h1>

        <div className="flex items-center gap-2">
          {/* RSVP-03: Generate RSVP Link button */}
          <GenerateLinkButton eventId={event.id} />

          {/* RSVP-01: Add Guest button + dialog */}
          <AddGuestTrigger eventId={event.id} />
        </div>
      </div>

      {/* RSVP-07: 4-count summary bar (Invited / Going / Not Going / Pending) */}
      <RsvpSummaryBar
        invited={invited}
        going={going}
        notGoing={notGoing}
        pending={pending}
      />

      {/* D-06: RSVP deadline field */}
      <div className="rounded-xl border border-border bg-card px-6 py-4">
        <RsvpDeadlineField
          eventId={event.id}
          currentDeadline={event.rsvp_deadline}
        />
      </div>

      {/* Guest table with sort + manual override (RSVP-08) */}
      <GuestTable guests={guestRows} eventId={event.id} />
    </div>
  );
}
