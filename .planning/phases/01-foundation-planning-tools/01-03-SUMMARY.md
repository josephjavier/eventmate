---
phase: 01-foundation-planning-tools
plan: 03
subsystem: core-library
tags: [supabase, auth, dal, middleware, currency, rsvp, types]
dependency_graph:
  requires: ["01-01", "01-02"]
  provides: ["lib/dal.ts", "lib/supabase/*", "lib/utils.ts", "lib/rsvp.ts", "middleware.ts", "types/database.ts"]
  affects: ["all subsequent plans — every feature slice imports from this library layer"]
tech_stack:
  added: ["server-only"]
  patterns: ["dual-auth-dal", "supabase-ssr-server-client", "react-cache-deduplication", "integer-centavos", "nanoid-token"]
key_files:
  created:
    - types/database.ts
    - types/index.ts
    - lib/supabase/server.ts
    - lib/supabase/client.ts
    - lib/supabase/service.ts
    - lib/dal.ts
    - middleware.ts
    - lib/rsvp.ts
  modified:
    - lib/utils.ts
decisions:
  - "server-only import guard on lib/dal.ts prevents accidental client-side import of session-verification code"
  - "isRsvpDeadlinePassed uses UTC date string comparison (toISOString().split('T')[0]) to avoid timezone-sensitive Date object arithmetic"
  - "getSession() forbidden in both middleware and DAL — only getUser() validates JWT against Supabase Auth server"
metrics:
  duration_minutes: 29
  completed_date: "2026-06-19"
  tasks_completed: 3
  tasks_total: 3
  files_created: 9
  files_modified: 1
---

# Phase 1 Plan 03: Core Library Layer (DB Types, Clients, DAL, Utils) Summary

**One-liner:** Typed Supabase DB from live schema with three correctly-scoped clients, dual-auth DAL using getUser(), and INTEGER-centavos currency utils with nanoid(20) RSVP tokens — 18 Wave-0 tests green.

## What Was Built

The core library layer that every feature slice imports from:

1. **`types/database.ts`** — 684-line generated file from the live Supabase schema (12 tables: profiles, events, event_invitations, event_locations, checklist_items, budget_categories, expenses, receipt_files, guests, rsvp_tokens, rsvp_responses, event_files).

2. **`types/index.ts`** — Re-exports `Database` type plus Row and Insert convenience types for all 12 tables (e.g., `Event`, `Guest`, `RsvpToken`).

3. **`lib/supabase/server.ts`** — `createClient()` using `await cookies()` (Next.js 15 async API) and `createServerClient<Database>`. Used in all Server Components, Server Actions, and protected Route Handlers.

4. **`lib/supabase/client.ts`** — `createClient()` using `createBrowserClient<Database>`. Used only in `'use client'` components needing direct Supabase access.

5. **`lib/supabase/service.ts`** — `createServiceClient()` using `SUPABASE_SERVICE_ROLE_KEY` (never `NEXT_PUBLIC_`). Restricted by comment to 3 public Route Handlers (RSVP search, RSVP respond, invitation accept).

6. **`lib/dal.ts`** — `verifySession()` and `assertRole()` with `import 'server-only'` guard. Both use `supabase.auth.getUser()` (never `getSession()`). Wrapped in `React.cache()` for request-level deduplication.

7. **`middleware.ts`** — Session refresh via `supabase.auth.getUser()`. No business logic. Matcher covers all routes except static assets.

8. **`lib/utils.ts`** — Added `phpToCentavos()`, `centavosToPhp()`, `formatPHP()` alongside the existing `cn()` helper.

9. **`lib/rsvp.ts`** — `generateRsvpToken()` using `nanoid(20)` (20 URL-safe chars), `isRsvpDeadlinePassed()` with inclusive deadline-day semantics (deadline date itself = still open).

## Verification Results

- `npx tsc --noEmit` — exits 0 (no TypeScript errors)
- `npx vitest run tests/utils/` — 18/18 tests pass (currency.test.ts, token.test.ts, rsvp.test.ts)
- `supabase.auth.getSession()` — absent from all actual code (appears only in documentation comments)
- `SUPABASE_SERVICE_ROLE_KEY` — present in service.ts without `NEXT_PUBLIC_` prefix

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Generate DB types and create three Supabase clients | 6d583d0 | types/database.ts, types/index.ts, lib/supabase/server.ts, lib/supabase/client.ts, lib/supabase/service.ts |
| 2 | Create the DAL and middleware (dual auth layer) | 1625b1f | lib/dal.ts, middleware.ts, package.json (server-only) |
| 3 | Implement currency utils + RSVP token/deadline helpers | 704ac7c | lib/utils.ts, lib/rsvp.ts |

## Decisions Made

1. **`server-only` import guard on `lib/dal.ts`** — prevents accidental client-side import of session-verification code. This would otherwise silently fail at runtime in a Client Component.

2. **UTC date string comparison in `isRsvpDeadlinePassed`** — uses `toISOString().split('T')[0]` to get a YYYY-MM-DD string in UTC rather than constructing `new Date(deadline)` objects with timezone-sensitive comparison. This ensures consistent behavior regardless of the server's local timezone.

3. **Deadline-day semantics: inclusive** — `isRsvpDeadlinePassed` returns `false` on the deadline day itself (guests can still RSVP), consistent with the typical meaning of "RSVP by [date]."

4. **`server-only` package installed** — Not in the original `package.json`; added as a dependency during Task 2 to enable the `import 'server-only'` guard in `lib/dal.ts`. This is a standard Next.js security practice.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- Task 3 TDD RED gate confirmed: tests imported non-existent modules and failed with `TypeError: phpToCentavos is not a function` and module resolution errors — true RED state.
- `server-only` package was not in `package.json` but is a standard Next.js dependency; installed inline (not a deviation, just a missing dependency that was caught during Task 2).

## Known Stubs

None — all exported functions are fully implemented with no placeholder values.

## Threat Flags

No new security-relevant surface introduced beyond what was planned in the threat model.

| Mitigation | Status |
|-----------|--------|
| T-1-05: Forged session cookie | Mitigated — verifySession() and middleware both use getUser() (JWT validated against Auth server) |
| T-1-06: Service-role key exposure | Mitigated — SUPABASE_SERVICE_ROLE_KEY, no NEXT_PUBLIC_ prefix, restricted by comment to 3 Route Handlers |
| T-1-07: Currency rounding | Mitigated — phpToCentavos/centavosToPhp are the single rounding point; 18 tests assert exact integer behavior |

## Self-Check: PASSED

Files exist:
- [x] types/database.ts (684 lines)
- [x] types/index.ts
- [x] lib/supabase/server.ts
- [x] lib/supabase/client.ts
- [x] lib/supabase/service.ts
- [x] lib/dal.ts
- [x] middleware.ts
- [x] lib/utils.ts (updated)
- [x] lib/rsvp.ts

Commits verified:
- [x] 6d583d0 (Task 1)
- [x] 1625b1f (Task 2)
- [x] 704ac7c (Task 3)
