---
phase: 01-foundation-planning-tools
plan: "04"
subsystem: auth-onboarding-dashboard
tags: [auth, onboarding, dashboard, server-actions, supabase, zod, zustand, date-fns]
dependency_graph:
  requires: ["01-03"]
  provides: ["01-05", "01-06", "01-07", "01-08", "01-09"]
  affects: []
tech_stack:
  added:
    - zustand (wizard state store — no partial DB writes mid-wizard)
    - date-fns differenceInDays (countdown widget)
  patterns:
    - react-hook-form + zodResolver for all auth and onboarding forms
    - 'use server' Server Actions for auth and event mutations (dual auth layer)
    - 'use client' CountdownWidget to avoid hydration mismatch (Pitfall 6)
    - shadcn Form component (custom-created — shadcn CLI did not install it automatically)
key_files:
  created:
    - lib/schemas/auth.ts
    - lib/schemas/event.ts
    - lib/stores/onboarding.ts
    - app/actions/auth.ts
    - app/actions/events.ts
    - app/(auth)/layout.tsx
    - app/(auth)/login/page.tsx
    - app/(auth)/signup/page.tsx
    - app/(auth)/forgot-password/page.tsx
    - app/(auth)/update-password/page.tsx
    - app/(client)/layout.tsx
    - app/(client)/dashboard/page.tsx
    - app/onboarding/layout.tsx
    - app/onboarding/page.tsx
    - components/ui/form.tsx
    - components/dashboard/CountdownWidget.tsx
    - components/dashboard/DashboardEmptyState.tsx
    - components/dashboard/SummaryWidgets.tsx
    - app/api/cron/keepalive/route.ts
    - vercel.json
  modified: []
decisions:
  - "shadcn form component created manually (CLI returned without error but did not write the file)"
  - "Zod v4 uses .issues not .errors on ZodError — auth actions updated to use parsed.error.issues[0]"
  - "createEvent uses maybeSingle() not single() on dashboard fetch to safely handle no-event state"
  - "signUp redirects to /dashboard not /onboarding per D-01 (locked decision)"
metrics:
  duration_minutes: 65
  completed_date: "2026-06-19"
  tasks_completed: 2
  tasks_total: 3
  files_created: 20
  files_modified: 0
---

# Phase 1 Plan 04: Auth, Onboarding, Dashboard Shell Summary

**One-liner:** Full auth flow (signup with RA 10173 consent, login, logout, password reset) + 2-step onboarding wizard (wedding date + ceremony/reception locations) + dashboard Server Component with live countdown and summary widgets using shadcn/ui, react-hook-form, Zod v4, and Zustand.

## What Was Built

### Task 1: Auth (AUTH-01–04) — TDD GREEN
- `lib/schemas/auth.ts`: Zod v4 schemas — `signUpSchema` enforces password min 8 chars and `consent === true` (RA 10173). All 8 vitest tests passing.
- `app/actions/auth.ts`: `signUp` (sets `consent_given_at`, redirects to `/dashboard` per D-01), `signIn`, `signOut`, `resetPassword`, `updatePassword` — all Server Actions.
- `app/(auth)/layout.tsx`: redirects authenticated users to `/dashboard`.
- Four auth pages (login, signup with consent checkbox, forgot-password, update-password) using shadcn Form + react-hook-form + zodResolver with UI-SPEC locked copy.
- `components/ui/form.tsx`: shadcn Form component (created manually — CLI issue).

### Task 2: Onboarding + Dashboard (EVENT-01–04)
- `lib/schemas/event.ts`: Zod schemas for event and location forms.
- `lib/stores/onboarding.ts`: Zustand store holding wizard step data (avoids partial DB writes mid-wizard).
- `app/actions/events.ts`: `createEvent` (verifySession + phpToCentavos for budget), `updateEvent`, `addLocation` — all Server Actions guarded by DAL.
- `app/onboarding/page.tsx`: 2-step wizard with UI-SPEC locked copy ("When is the big day?", "Where will it happen?", "Continue to Location", "Start Planning"). Step 2 collects Ceremony (required) + Reception (optional) locations — EVENT-02.
- `app/(client)/layout.tsx`: `assertRole('client')` + topbar (logo + avatar dropdown with signOut) + sidebar nav.
- `app/(client)/dashboard/page.tsx`: Server Component — assertRole, fetch event; no event → `DashboardEmptyState`; with event → `CountdownWidget` + `SummaryWidgets` (EVENT-04).
- `components/dashboard/CountdownWidget.tsx`: `'use client'` + `differenceInDays` from date-fns. Handles 0-day and past-date states per UI-SPEC.
- `components/dashboard/DashboardEmptyState.tsx`: UI-SPEC locked copy "Your wedding adventure starts here" + "Create Your Event" CTA to `/onboarding`.
- `components/dashboard/SummaryWidgets.tsx`: checklist %, budget summary (total/committed/paid/remaining via `formatPHP`), RSVP counts.
- `app/api/cron/keepalive/route.ts` + `vercel.json`: keep-alive cron every 3 days (Pitfall 7, T-1-09 mitigate).

### Task 3: Deploy to Vercel (Checkpoint — RELOCATED to Phase 6)
The keep-alive cron Route Handler and `vercel.json` are created (committed code). The actual Vercel deploy, production env vars, Supabase Auth URL configuration, and live verification were **moved to Phase 6 (Cloud Deployment & Launch)** on 2026-07-02 under the local-first build strategy. Phase 1 is complete on localhost; this checkpoint no longer gates it.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `6ebf488` | feat(01-04): auth route group, schemas, pages, Server Actions with consent |
| 2 | `be0b361` | feat(01-04): onboarding wizard, createEvent action, dashboard shell + countdown |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Zod v4 uses `.issues` not `.errors` on ZodError**
- **Found during:** Task 1 TypeScript check
- **Issue:** `parsed.error.errors` does not exist on Zod v4's `ZodError` type — it was renamed to `.issues`.
- **Fix:** All four error-return paths in `app/actions/auth.ts` updated to use `parsed.error.issues[0]?.message`.
- **Files modified:** `app/actions/auth.ts`
- **Commit:** `6ebf488`

**2. [Rule 1 - Bug] `Record<string, string | number | null>` incompatible with Supabase update type**
- **Found during:** Task 2 TypeScript check
- **Issue:** `updateEvent` built updates as a `Record<string, string | number | null>` which TypeScript rejected against Supabase's strict update type signature.
- **Fix:** Rewrote as object spread with conditional keys using `...(key !== undefined && { key })` pattern.
- **Files modified:** `app/actions/events.ts`
- **Commit:** `be0b361`

**3. [Rule 3 - Blocking] shadcn CLI did not install `form` component**
- **Found during:** Task 1 setup
- **Issue:** `npx shadcn@latest add form` completed without error but wrote no files to `components/ui/`.
- **Fix:** Created `components/ui/form.tsx` manually from the official shadcn form component pattern (react-hook-form + Radix UI `Slot`).
- **Files modified:** `components/ui/form.tsx` (created)
- **Commit:** `6ebf488`

## Known Stubs

None — the dashboard correctly shows aggregated live data from the DB. Values that show 0 (checklist, budget, RSVP) are legitimate empty states, not hardcoded placeholders. The `DashboardEmptyState` renders when no event exists and is wired to `/onboarding`.

## Threat Flags

No new security-relevant surfaces beyond what is in the plan's `<threat_model>`.

All T-1 mitigations are implemented:
- T-1-05: `assertRole('client')` in `(client)/layout.tsx` + `verifySession()` first line of every Server Action.
- T-1-08: Zod v4 schemas validate both client-side and server-side (Server Actions parse/validate before DB insert).
- T-1-DPA: Required consent checkbox; `consent_given_at` written on signup.
- T-1-06: `SUPABASE_SERVICE_ROLE_KEY` used only in `app/api/cron/keepalive/route.ts` (server-side, never `NEXT_PUBLIC_`).
- T-1-09: Keep-alive cron every 3 days prevents Supabase free-tier auto-pause.

## Self-Check: PASSED

Files exist:
- lib/schemas/auth.ts: FOUND
- lib/schemas/event.ts: FOUND
- lib/stores/onboarding.ts: FOUND
- app/actions/auth.ts: FOUND
- app/actions/events.ts: FOUND
- app/(auth)/layout.tsx: FOUND
- app/(auth)/login/page.tsx: FOUND
- app/(auth)/signup/page.tsx: FOUND
- app/(auth)/forgot-password/page.tsx: FOUND
- app/(auth)/update-password/page.tsx: FOUND
- app/(client)/layout.tsx: FOUND
- app/(client)/dashboard/page.tsx: FOUND
- app/onboarding/layout.tsx: FOUND
- app/onboarding/page.tsx: FOUND
- components/ui/form.tsx: FOUND
- components/dashboard/CountdownWidget.tsx: FOUND
- components/dashboard/DashboardEmptyState.tsx: FOUND
- components/dashboard/SummaryWidgets.tsx: FOUND
- app/api/cron/keepalive/route.ts: FOUND
- vercel.json: FOUND

Commits verified: 6ebf488, be0b361
