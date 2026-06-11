# Phase 1: Foundation & Planning Tools - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a fully functional wedding planning app — auth, event setup, checklist with offline supplier entry, budget tracking, file storage, guest list, and RSVP — useful to a couple before any platform supplier is onboarded. The app must solve the cold-start problem: a couple who finds the platform before any supplier is listed can still plan their entire wedding.

39 requirements: AUTH-01–04, AUTH-07, EVENT-01–04, COPL-01–03, CHECK-01–07, BUDG-01–06, FILE-01–04, RSVP-01–08, DISC-07, NOTF-04

</domain>

<decisions>
## Implementation Decisions

### Signup & Onboarding Flow

- **D-01:** Signup creates an account only — no forced event creation. Post-signup dashboard shows an empty state with a prominent "Create your event" CTA that encourages (but does not require) event setup. Clients can explore the app before creating their event.
- **D-02:** Event creation wizard lives at `/onboarding/*` — a separate route group outside `(client)/`. Wizard collects: wedding date + first location (minimum). After wizard completes, redirects to `(client)/dashboard`.
- **D-03:** When no event exists, the client dashboard empty state prominently surfaces "Create your event" with encouraging copy. This is the primary conversion moment from registered → planning.

### Co-planner Access

- **D-04:** Co-planner has full edit access identical to the event owner (per COPL-03 as written). No exclusive owner-only actions in v1. Both accounts can edit checklist, budget, guests, and files equally.

### RSVP Guest Management

- **D-05:** Guest record has two name fields: **full name** (required) + **nickname** (optional). RSVP search matches on both fields. When multiple guests share the same full name, the nickname appears alongside as a disambiguation label (e.g., "Maria Santos (Tita)" vs "Maria Santos (officemate)"). Filipino couples naturally use nicknames — this is the primary disambiguation mechanism.
- **D-06:** Guests can update their RSVP response until a **client-set RSVP deadline date**. After the deadline passes, the RSVP page locks and shows "RSVP closed."
- **D-07:** RSVP response records include a **response timestamp** (when the response was last submitted or updated). The client dashboard shows this alongside each guest's status.
- **D-08:** When any RSVP is submitted or updated by a guest, the client receives a notification. (Channel: Claude's discretion — email via Resend or in-app notification.)
- **D-09:** After the RSVP deadline, the RSVP page (`/rsvp/[token]`) shows:
  - "RSVP has closed" message
  - Event location(s) and schedule
  - Color motif (text)
  - Attire reference photos (up to 2)
  Client can still manually override any guest's status from their dashboard after the deadline.

### Event Data Model

- **D-10:** Event model includes two additional fields beyond what REQUIREMENTS.md specifies:
  - **Color motif** — text/color value (e.g., "Dusty Rose", "#D4A5A5")
  - **Attire reference photos** — up to 2 image uploads stored in Supabase Storage; displayed on the RSVP closed page

### Checklist Default Template

- **D-11:** Template is grouped by **supplier category**. Default categories in order:
  Photography · Videography · Venue / Reception Hall · Catering · Hair & Make-up · Florist · Host / Emcee · Wedding Gown / Barong · Cake & Dessert · Invitations & Printing · Sound System · Lights & Décor · Transportation · Wedding Coordinator
  Plus a "Personal Tasks" group at the end.
- **D-12:** Default **Personal Tasks** group includes three sub-groups:
  - *Legal documents:* Marriage license application, CENOMAR (PSA), birth certificates (PSA), baptismal certificates
  - *Pre-wedding milestones:* Pre-Cana / marriage counseling seminar, prenuptial agreement (if needed), prenuptial photoshoot
  - *Day-of items:* Prepare vows, wedding rings, secondary sponsors list, entourage assignments (principal sponsors, bridesmaids, groomsmen, flower girls, ring bearers)
  - Honeymoon and post-wedding tasks are NOT in the default template (couple adds manually if needed).
- **D-13:** Template does **not** auto-load. Empty checklist shows a "Start from the Philippine wedding template" button. Couple clicks it after creating their event. This respects their choice to build from scratch if preferred.
- **D-14:** After the template loads, the couple can delete any category or individual item freely (CHECK-03). No items are locked or mandatory.

### Claude's Discretion

- RSVP change notification channel (email vs in-app) — implement whichever fits the Resend + Supabase stack most cleanly. Email preferred since Resend is already in the stack.
- Exact color motif input UI (text input, color picker, or both) — start with a text input for simplicity.
- Checklist template seeding mechanism (SQL seed file vs admin-inserted rows vs hardcoded in application code) — Claude picks the most maintainable approach.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/REQUIREMENTS.md` — 39 Phase 1 requirements with requirement IDs (AUTH, EVENT, COPL, CHECK, BUDG, FILE, RSVP, DISC-07, NOTF-04). These are the acceptance criteria.
- `.planning/PROJECT.md` — Key Decisions table, core value statement, market context, constraints
- `.planning/ROADMAP.md` §Phase 1 — Goal statement and 5 success criteria that must all be TRUE to pass verification

### Architecture Constraints (Non-Negotiable)
- `CLAUDE.md` §Architecture Decisions — All 8 decisions are locked. Most relevant to Phase 1:
  - INTEGER centavos for all monetary values (₱1 = 100 in DB)
  - RLS on every table in the same migration as CREATE TABLE
  - `@supabase/ssr` (not deprecated auth-helpers-nextjs)
  - Dual auth layer: middleware for redirect UX only, every Server Action and Route Handler independently calls `verifySession()`
  - Service role key never `NEXT_PUBLIC_`
  - RSVP page at `app/rsvp/[token]/` — outside all auth route groups
- `CLAUDE.md` §Route Group Structure — Defines `(public)/`, `(client)/`, `(supplier)/`, `(admin)/`, `rsvp/[token]/`. Phase 1 adds `/onboarding/` for the event creation wizard.

### No external specs exist yet — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — project is greenfield. No existing components, hooks, or utilities.

### Established Patterns
- Stack is defined but not yet scaffolded: Next.js 15 (App Router), Supabase (Auth + PostgreSQL + Storage), Tailwind CSS, shadcn/ui
- All UI components will come from shadcn/ui — use the component library rather than building custom primitives
- Supabase client: use `@supabase/ssr` package patterns for Server Components, Server Actions, and Route Handlers (three distinct client types: browser, server, service-role)

### Integration Points
- `/onboarding/*` — new route group for the event creation wizard (not in CLAUDE.md route structure, adding here)
- `app/rsvp/[token]/` — public RSVP route, no auth group, token is the authorization (nanoid(20) set in schema migration)
- `(client)/dashboard` — landing page after onboarding wizard and for all subsequent logins

</code_context>

<specifics>
## Specific Ideas

- **Budget UX inspiration:** GCash / wallet apps — deposit paid, remaining balance, spend breakdown (from idea.md). The budget tracking UI should feel familiar to Filipino users of mobile banking.
- **RSVP page (closed state):** Event info display — location, schedule, color motif, attire reference photos. This is the "save the date" info in a practical form.
- **Checklist template:** 14 supplier categories + 3 personal task groups reflecting the real PH Catholic/civil wedding planning process. CENOMAR and Pre-Cana are specifically PH/Catholic requirements that make the template feel locally relevant.
- **Nickname-first RSVP:** "Tita Cora" or "Kuya Jojo" — Filipino family nicknames are more recognizable to guests than full legal names. The nickname field is optional but the design should encourage it.

</specifics>

<deferred>
## Deferred Ideas

- **Animated attire photos on RSVP closed page** — user mentioned "animated pics." Deferred to a future design pass. Phase 1 implements static image uploads (JPG/PNG) via Supabase Storage. GIF support or animation effects can be added later.
- **Honeymoon / post-wedding checklist tasks** — not in the default template. Couple can add manually. Can be added to the template in a future iteration after user feedback.
- **Per-guest RSVP lock** — client locks a specific guest's response (prevents further changes). Not in Phase 1. Client has manual override which covers the same need.
- **Table assignment for guests** — no seating chart in v1. Noted in PROJECT.md Out of Scope.

</deferred>

---

*Phase: 1 — Foundation & Planning Tools*
*Context gathered: 2026-06-11*
