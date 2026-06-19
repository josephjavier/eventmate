---
phase: "01-foundation-planning-tools"
plan: "08"
subsystem: "guest-management-rsvp"
tags: ["rsvp", "guests", "public-route", "server-actions", "tanstack-table", "nickname-search"]
dependency_graph:
  requires: ["01-04"]
  provides: ["RSVP public link", "guest dashboard", "RSVP search + respond API"]
  affects: ["app/(client)/event/guests/", "app/rsvp/[token]/", "app/api/rsvp/[token]/"]
tech_stack:
  added: ["@tanstack/react-table (guest list)"]
  patterns: ["service-client-rls-bypass", "deadline-gate", "dual-auth-server-actions", "zod-z.input-form-types"]
key_files:
  created:
    - lib/schemas/guest.ts
    - app/actions/guests.ts
    - app/(client)/event/guests/page.tsx
    - components/guests/GuestTable.tsx
    - components/guests/AddGuestDialog.tsx
    - components/guests/RsvpSummaryBar.tsx
    - components/guests/GenerateLinkButton.tsx
    - components/guests/EditGuestDialog.tsx
    - components/guests/AddGuestTrigger.tsx
    - components/guests/RsvpDeadlineField.tsx
    - app/api/rsvp/[token]/search/route.ts
    - app/api/rsvp/[token]/respond/route.ts
    - app/rsvp/[token]/page.tsx
    - components/rsvp/RSVPOpenPage.tsx
    - components/rsvp/RSVPClosedPage.tsx
  modified: []
decisions:
  - "z.input<typeof schema> used for react-hook-form types (not z.infer) to resolve Zod v4 boolean default() type incompatibility with zodResolver"
  - "GuestTable includes EditGuestDialog and AddGuestTrigger as separate 'use client' wrappers — same pattern as AddItemTrigger (01-05)"
  - "RSVPOpenPage uses fetch() to /api/rsvp/[token]/search + /respond (client-side Route Handler calls, not Server Actions — public API requires no auth)"
  - "Signed URLs for attire photos generated server-side in app/rsvp/[token]/page.tsx with 1-hour expiry from event-media bucket"
  - "D-08 notification email left as a hook point comment in respond route — wired in Plan 01-09 per PATTERNS.md"
metrics:
  duration_minutes: 29
  completed_date: "2026-06-19"
  tasks_completed: 3
  files_count: 15
---

# Phase 1 Plan 8: Guest List + Public RSVP Vertical Slice Summary

**One-liner:** Full guest management + account-free RSVP page with nickname-first search (D-05), client deadline gate (D-06), response timestamp (D-07), +1 flow (RSVP-05), optional meal preference (RSVP-06), and closed state with event details/motif/attire photos (D-09).

## What Was Built

**Task 1 — Guest Server Actions + dashboard page (commit 4ec6bd6)**

Delivers the authenticated couple-facing side of RSVP management:

- `lib/schemas/guest.ts`: Zod v4 schemas for addGuest, updateGuest, overrideRsvp (status enum), and rsvpDeadline. Uses `z.input<>` (not `z.infer<>`) for form types to correctly handle `boolean.default(false)` with react-hook-form zodResolver.
- `app/actions/guests.ts`: Seven Server Actions, each calling `verifySession()` first:
  - `addGuest`, `updateGuest`, `deleteGuest` — RSVP-01/02
  - `overrideRsvp(guestId, status)` — RSVP-08, upserts rsvp_responses with `responded_at = now()` (D-07); "pending" deletes the row to reset
  - `generateRsvpLink(eventId)` — RSVP-03, idempotent: returns existing token or creates new via `generateRsvpToken()` (nanoid(20)); returns `${NEXT_PUBLIC_SITE_URL}/rsvp/${token}`
  - `setRsvpDeadline(eventId, date)` — D-06
  - `setMealPreferenceEnabled(eventId, bool)` — RSVP-06
- `app/(client)/event/guests/page.tsx`: Server Component with `assertRole('client')`, fetches guests + rsvp_responses join (via `in` on guestIds), builds GuestRow array with derived rsvp_status
- Components:
  - `RsvpSummaryBar.tsx` — 4-count badges: Invited, Going, Not Going, Pending (exact UI-SPEC copy, RSVP-07)
  - `GuestTable.tsx` — TanStack Table with sortable Full Name/RSVP Status/Response Date columns; dropdown menu with edit, override (Going/Not Going/Reset to Pending), and delete with confirmation dialog
  - `AddGuestDialog.tsx` — exact UI-SPEC labels including nickname hint "e.g., Tita Cora, Kuya Jojo..."
  - `EditGuestDialog.tsx` — same form structure pre-filled
  - `GenerateLinkButton.tsx` — calls generateRsvpLink, copies to clipboard, shows "Copy Link" + "Link copied!" toast
  - `AddGuestTrigger.tsx` — 'use client' wrapper to hold dialog state (same pattern as 01-05 AddItemTrigger)
  - `RsvpDeadlineField.tsx` — 'use client' date input that calls setRsvpDeadline

**Task 2 — Public RSVP Route Handlers (commit 97b501d)**

Two anon Route Handlers, both using the service client (RLS bypass for token lookup), both with no verifySession():

- `app/api/rsvp/[token]/search/route.ts` (GET): 2-char enumeration guard (T-1-12), service client token→event_id lookup, `.or('full_name.ilike.%q%,nickname.ilike.%q%')` (D-05), `.limit(5)`, returns only `id, full_name, nickname, has_plus_one`
- `app/api/rsvp/[token]/respond/route.ts` (POST): 4-step security checklist — (1) token→event+deadline, (2) `isRsvpDeadlinePassed` 403 gate (T-1-14), (3) `guest_id` belongs-to-event validation (T-1-13), (4) UPSERT with `responded_at = now()` (D-07); meal_preference recorded only when `meal_preference_enabled` (RSVP-06); D-08 hook point comment for Plan 01-09

**Task 3 — Public RSVP page (commit f2416d9)**

- `app/rsvp/[token]/page.tsx`: Outside all auth route groups (AUTH-07); service client for token+event join with `event_locations(...)` nested select; signed URLs for attire photos (1-hour expiry, event-media bucket); `isRsvpDeadlinePassed` gate (D-06) → RSVPClosedPage or RSVPOpenPage
- `components/rsvp/RSVPOpenPage.tsx`: 2-char minimum, 300ms debounced search to Route Handler; results as "Full Name (Nickname)" (D-05 disambiguation); Going/Not Going at 44px touch targets (UI-SPEC/WCAG 2.5.5); +1 section revealed for `has_plus_one` guests (RSVP-05); meal preference conditional on event setting (RSVP-06); all UI-SPEC copy exact including success/already-responded states
- `components/rsvp/RSVPClosedPage.tsx`: "RSVP has closed" + body; event locations with role labels; Dress Code & Motif with color_motif text + up to 2 attire photos from signed URLs (D-09); all UI-SPEC copy exact

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod v4 boolean.default() + react-hook-form resolver type incompatibility**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** `addGuestSchema` used `z.boolean().default(false)` which makes the inferred output type `has_plus_one: boolean` (required). Using `z.infer<>` for `AddGuestFormValues` caused TypeScript errors in react-hook-form `useForm<AddGuestFormValues>` and `zodResolver(addGuestSchema)` because the resolver's output type conflicts with the form's expected input type.
- **Fix:** Changed schema to `z.boolean().optional().default(false)` and exported form types as `z.input<typeof schema>` instead of `z.infer<>`. `z.input<>` gives the "before transformation" type where the field is `boolean | undefined`, which matches react-hook-form's expectations. The runtime behavior is unchanged — the schema still provides `false` as default.
- **Files modified:** `lib/schemas/guest.ts`
- **Commit:** 4ec6bd6

## Known Stubs

**D-08: RSVP notification email** — `app/api/rsvp/[token]/respond/route.ts` contains a clearly-marked hook point comment. No email is sent in this plan. Plan 01-09 wires the Resend notification per the plan dependency. This is intentional per PATTERNS.md plan note and does not prevent the RSVP flow from functioning.

## Threat Flags

No new threat surface introduced beyond what the plan's threat model covers. The two new public Route Handlers and the public RSVP page were all anticipated in the plan's `<threat_model>` (T-1-06, T-1-12, T-1-13, T-1-14, T-1-01).

## Self-Check: PASSED

**Files verified:**
- `lib/schemas/guest.ts` — FOUND
- `app/actions/guests.ts` — FOUND
- `app/(client)/event/guests/page.tsx` — FOUND
- `components/guests/GuestTable.tsx` — FOUND
- `components/guests/AddGuestDialog.tsx` — FOUND
- `components/guests/RsvpSummaryBar.tsx` — FOUND
- `components/guests/GenerateLinkButton.tsx` — FOUND
- `app/api/rsvp/[token]/search/route.ts` — FOUND
- `app/api/rsvp/[token]/respond/route.ts` — FOUND
- `app/rsvp/[token]/page.tsx` — FOUND
- `components/rsvp/RSVPOpenPage.tsx` — FOUND
- `components/rsvp/RSVPClosedPage.tsx` — FOUND

**Commits verified:**
- 4ec6bd6 (Task 1 — guest management)
- 97b501d (Task 2 — RSVP Route Handlers)
- f2416d9 (Task 3 — public RSVP page)

**TypeScript:** `npx tsc --noEmit` exits 0
