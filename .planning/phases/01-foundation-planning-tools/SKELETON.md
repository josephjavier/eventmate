# Walking Skeleton — EventMate

**Phase:** 1
**Generated:** 2026-06-18

## Capability Proven End-to-End

A new couple can sign up (with privacy consent), verify their email, log in, create a wedding event with a date and a first location through the onboarding wizard, and see a live "X days until your wedding" countdown plus checklist/budget/RSVP summary widgets on the dashboard — running on a deployed Vercel URL backed by a real Supabase Postgres database with RLS enforced.

This single slice exercises every architectural layer: Next.js 15 App Router routing, `@supabase/ssr` auth + session refresh middleware, the DAL (`verifySession`/`assertRole`), a real RLS-protected DB write (event creation), a real DB read (dashboard aggregates), an interactive Client Component (countdown), and production deployment.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15.3.9 (App Router) — pinned, NOT `@latest` (which is 16.x) | Project-locked in CLAUDE.md; Next.js 16 renames `middleware.ts`→`proxy.ts`. Pin avoids breaking all documented patterns. |
| Data layer | Supabase Postgres, all money as `INTEGER` centavos, RLS on every table in the same migration as `CREATE TABLE` | CLAUDE.md decisions #1 and #6 (non-negotiable). Integer centavos prevents rounding errors at ₱500k+ wedding scales. |
| Auth | Supabase Auth (email/password + JWT HttpOnly cookie); dual layer — `middleware.ts` for redirect UX only, `verifySession()` (DAL) in every Server Action/Route Handler; `getUser()` never `getSession()` | CLAUDE.md decision #5; `getUser()` validates JWT against the Auth server (forged-cookie defense). |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` server-only, NEVER `NEXT_PUBLIC_`; used only in public RSVP/invite Route Handlers | CLAUDE.md decision #7. Browser exposure = full RLS bypass. |
| Deployment target | Vercel Hobby (free); Supabase keep-alive cron every 3 days | Zero-budget solo developer; Supabase free tier pauses after ~1 week idle. |
| Directory layout | Route groups: `(auth)/`, `(client)/`, `onboarding/`, `rsvp/[token]/`, `invite/[token]/`; `app/actions/*` Server Actions; `lib/` for DAL + Supabase clients + utils | RESEARCH.md Recommended Project Structure; CLAUDE.md Route Group Structure. RSVP/invite live OUTSIDE auth groups (token is authorization). |
| Currency display | `Intl.NumberFormat('en-PH', { style:'currency', currency:'PHP' })` at render only; storage always centavos | CLAUDE.md decision #1; native API, zero bundle cost. |
| Forms/validation | react-hook-form + Zod v4 + `@hookform/resolvers@5.x` + shadcn/ui Form; validate client AND server | RESEARCH.md Standard Stack; ASVS V5 input validation both sides. |

## Stack Touched in Phase 1 (Skeleton = Waves 1–4)

- [x] Project scaffold — `create-next-app@15.3.9` + async codemod + shadcn/ui init + all deps + Vitest (Plan 01-01, Wave 1)
- [x] Database — `001_create_tables.sql` (all Phase 1 tables + RLS + `user_can_access_event()`), `supabase db push`, one real write (event create) and read (dashboard) (Plans 01-02 + 01-04, Waves 2 + 4)
- [x] Routing — `(auth)/`, `(client)/`, `onboarding/`, `rsvp/[token]/`, `invite/[token]/` route groups (Plan 01-04, Wave 4)
- [x] UI wired to API — onboarding wizard → `createEvent` Server Action → dashboard countdown Client Component reading the new row (Plan 01-04, Wave 4)
- [x] Deployment — Vercel deploy with env vars + Supabase keep-alive cron (Plan 01-04, Wave 4)

## Out of Scope (Deferred to Later Slices / Later Phases)

- Checklist, budget, file storage, guest list/RSVP, co-planner invitation — these are Phase 1 feature slices built ON TOP of the skeleton (Waves 5–6), not part of the skeleton itself.
- Supplier discovery, AI inquiry, bookings, reviews, admin panel — Phases 2–5.
- Animated attire photos, honeymoon checklist tasks, per-guest RSVP lock, seating chart — deferred (CONTEXT.md Deferred Ideas).
- Dark mode, mobile sidebar — UI-SPEC explicitly defers.

## Subsequent Slice Plan (Phase 1 Waves, then Phases 2–5)

Each slice adds one vertical capability on top of the skeleton without changing its architectural decisions:

- **Wave 1 (01-01):** Scaffold + dependencies + Vitest harness + failing Wave-0 tests
- **Wave 2 (01-02):** DB schema + RLS migration + `supabase db push`
- **Wave 3 (01-03):** Core library (Supabase clients, DAL, currency utils, middleware, generated types)
- **Wave 4 (01-04):** Auth + onboarding + dashboard shell + Vercel deploy — **skeleton closes here**
- **Wave 5 (01-05 / 01-06 / 01-07 / 01-08, parallel):** Checklist · Budget · Files · Guest List & RSVP
- **Wave 6 (01-09):** Co-planner invitation + RSVP notification email (depends on RSVP slice)
- **Phase 2:** Admin onboards suppliers; suppliers build profiles, packages, availability
- **Phase 3:** Clients browse/filter/search suppliers
- **Phase 4:** AI streaming inquiry + atomic booking confirmation + notifications
- **Phase 5:** Verified post-event reviews
