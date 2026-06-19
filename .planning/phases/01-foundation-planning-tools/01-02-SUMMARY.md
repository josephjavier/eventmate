---
phase: 01-foundation-planning-tools
plan: "02"
subsystem: database
tags: [supabase, postgres, rls, migrations, storage, sql]

# Dependency graph
requires:
  - phase: 01-01
    provides: Next.js scaffold, Supabase project initialized, .env.local with project credentials
provides:
  - All Phase 1 Postgres tables live in Supabase with RLS enforced from day one
  - user_can_access_event() helper for co-planner-aware row-level security
  - profiles auto-create trigger on auth.users INSERT
  - Three private storage buckets (event-files, receipts, event-media) with event-scoped RLS
  - INTEGER-centavos schema — no numeric/decimal anywhere
affects:
  - 01-03 (DAL and Supabase clients write against these tables)
  - 01-04 (auth onboarding writes to profiles via trigger)
  - 01-05 through 01-09 (every feature slice reads/writes these tables)
  - All future phases (Phase 2-5 schema extensions build on this foundation)

# Tech tracking
tech-stack:
  added: [supabase-cli (npx supabase)]
  patterns:
    - INTEGER centavos for all monetary columns (never numeric/decimal)
    - RLS enabled in the same SQL block as CREATE TABLE — never as a follow-up migration
    - user_can_access_event(evt_id uuid) SECURITY DEFINER helper centralizes co-planner access logic
    - Storage path convention — first segment is always event_id (e.g., event-files/<event_id>/<filename>)

key-files:
  created:
    - supabase/migrations/001_create_tables.sql
    - supabase/migrations/002_storage_buckets.sql
  modified:
    - supabase/config.toml

key-decisions:
  - "Co-planner access granted only when event_invitations.status = 'accepted' AND user_id = auth.uid() inside user_can_access_event() — pending invites grant nothing (T-1-02)"
  - "Storage object path must start with event_id — RLS gates on (storage.foldername(name))[1]::uuid; documented in SQL comment for Wave 3/5/7 upload code"
  - "consent_given_at timestamptz captured at profile level for RA 10173 Philippine Data Privacy Act compliance"
  - "rsvp_responses and receipt_files (no direct event_id) use parent-join subqueries in RLS policies"

patterns-established:
  - "Migration order: profiles → events → event_invitations → helper function → remaining tables (FK dependency order)"
  - "Immediately after each CREATE TABLE: ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;"
  - "Event-scoped tables use: FOR ALL TO authenticated USING (user_can_access_event(event_id)) WITH CHECK (user_can_access_event(event_id))"
  - "Storage buckets: INSERT INTO storage.buckets … ON CONFLICT (id) DO NOTHING for idempotent re-runs"

requirements-completed: [EVENT-01, EVENT-02, EVENT-03, CHECK-04, CHECK-05, CHECK-06, BUDG-03, FILE-04, RSVP-06, COPL-03]

# Metrics
duration: developer-executed (schema push done manually after migration files written)
completed: "2026-06-19"
---

# Phase 1 Plan 02: DB Schema + RLS Migration + Schema Push Summary

**12-table Supabase schema with INTEGER-centavos, co-planner RLS via user_can_access_event(), profiles trigger, and 3 private storage buckets pushed live**

## Performance

- **Duration:** Developer-executed (Task 3 was a blocking human-action gate)
- **Started:** 2026-06-19
- **Completed:** 2026-06-19
- **Tasks:** 3 of 3 (Tasks 1-2 automated; Task 3 human-action gate cleared by developer)
- **Files modified:** 3

## Accomplishments

- Wrote `001_create_tables.sql` with all 12 Phase 1 tables: profiles, events, event_invitations, event_locations, checklist_items, budget_categories, expenses, receipt_files, guests, rsvp_tokens, rsvp_responses, event_files — every table has RLS enabled in the same statement block
- Wrote `002_storage_buckets.sql` with 3 private buckets (event-files, receipts, event-media) and 9 explicit storage.objects policies (INSERT/SELECT/DELETE per bucket) gated on user_can_access_event()
- Developer ran `npx supabase link --project-ref waxbzbgvnscuairfmsrv` + `npx supabase db push` — all tables and buckets confirmed live in Supabase dashboard with RLS active

## Task Commits

Each task was committed atomically:

1. **Task 1: Write 001_create_tables.sql** - `a5bdb8b` (feat)
2. **Task 2: Write 002_storage_buckets.sql** - `967e6fb` (feat)
3. **Task 3: Push migrations to Supabase** - developer-executed (blocking human-action gate)

## Files Created/Modified

- `supabase/config.toml` — Supabase CLI project configuration (created by `npx supabase init`)
- `supabase/migrations/001_create_tables.sql` — All 12 Phase 1 tables, RLS policies, user_can_access_event() SECURITY DEFINER function, handle_new_user() trigger, and indexes
- `supabase/migrations/002_storage_buckets.sql` — 3 private storage buckets with event-scoped storage.objects RLS (9 policies total)

## Decisions Made

- **Co-planner access model confirmed as full edit access** — COPL-03 "full edit access" honored. user_can_access_event() returns true for both the event owner (client_id = auth.uid()) and any accepted co-planner (event_invitations: invitee_id = auth.uid() AND status = 'accepted'). Pending invites grant zero access.
- **Storage path convention documented in SQL** — first path segment must always be the event_id. RLS extracts it via (storage.foldername(name))[1]::uuid. This is enforced by policy and documented in the migration header comment so Wave 3/5/7 upload code follows the same convention.
- **Idempotent bucket creation** — `ON CONFLICT (id) DO NOTHING` so the migration is safe to re-run without errors.
- **receipt_files and rsvp_responses use parent-join subqueries** — these tables have no direct event_id column; their RLS policies traverse to the parent (expenses and guests respectively) to obtain the event_id for user_can_access_event().

## Deviations from Plan

None — plan executed exactly as written. All 12 tables match the PLAN.md specification. All monetary columns are INTEGER. All tables have RLS. user_can_access_event() is defined and referenced by every event-scoped policy. Three private storage buckets exist with matching RLS. Schema push confirmed successful.

## Issues Encountered

None. The blocking checkpoint (Task 3) resolved cleanly — developer ran the two CLI commands and confirmed success via the Supabase dashboard Table Editor.

## User Setup Required

Task 3 (schema push) required the developer to:
1. Export `SUPABASE_ACCESS_TOKEN` from Supabase Account → Access Tokens
2. Run `npx supabase link --project-ref waxbzbgvnscuairfmsrv`
3. Run `npx supabase db push`
4. Confirm all tables visible in Table Editor with RLS shield icons, and 3 private buckets in Storage

Status: **COMPLETE** — confirmed by developer before this summary was written.

## Next Phase Readiness

- Schema is live and verified — Plan 01-03 (Core library: Supabase clients, DAL, currency/token utils, middleware) can proceed immediately
- `npx supabase gen types typescript --linked > types/database.ts` is the first task of 01-03 (intentionally deferred from this plan)
- No blockers for Wave 3

---
*Phase: 01-foundation-planning-tools*
*Completed: 2026-06-19*
