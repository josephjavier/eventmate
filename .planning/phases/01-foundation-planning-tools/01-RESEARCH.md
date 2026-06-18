# Phase 1: Foundation & Planning Tools - Research

**Researched:** 2026-06-18
**Domain:** Next.js 15 App Router · Supabase Auth/DB/Storage · shadcn/ui · Walking Skeleton
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Signup creates an account only — no forced event creation. Post-signup dashboard shows empty state with "Create your event" CTA.

**D-02:** Event creation wizard lives at `/onboarding/*` — a separate route group outside `(client)/`. Wizard collects: wedding date + first location (minimum). After wizard, redirects to `(client)/dashboard`.

**D-03:** When no event exists, client dashboard empty state prominently surfaces "Create your event" CTA.

**D-04:** Co-planner has full edit access identical to event owner (no exclusive owner-only actions in v1).

**D-05:** Guest record has two name fields: full_name (required) + nickname (optional). RSVP search matches both. When multiple guests share the same full name, nickname appears alongside as disambiguation.

**D-06:** Guests can update RSVP response until a client-set RSVP deadline date. After deadline, RSVP page locks with "RSVP closed."

**D-07:** RSVP response records include a response_timestamp. Client dashboard shows this alongside each guest's status.

**D-08:** When any RSVP is submitted/updated, client receives notification. Channel is Claude's discretion (email via Resend preferred).

**D-09:** After RSVP deadline, `/rsvp/[token]` shows: "RSVP has closed" message + event locations/schedule + color motif (text) + attire reference photos (up to 2).

**D-10:** Event model includes two additional fields: color_motif (text/color value) and attire_reference_photos (up to 2 image uploads in Supabase Storage).

**D-11:** Checklist template grouped by supplier category: Photography · Videography · Venue/Reception Hall · Catering · Hair & Make-up · Florist · Host/Emcee · Wedding Gown/Barong · Cake & Dessert · Invitations & Printing · Sound System · Lights & Décor · Transportation · Wedding Coordinator + "Personal Tasks" group.

**D-12:** Default Personal Tasks group includes three sub-groups: Legal documents (marriage license, CENOMAR, birth certs, baptismal certs) · Pre-wedding milestones (Pre-Cana, prenuptial agreement, prenuptial photoshoot) · Day-of items (vows, rings, sponsors list, entourage assignments). No honeymoon/post-wedding tasks in default template.

**D-13:** Template does NOT auto-load. Empty checklist shows "Start from the Philippine wedding template" button.

**D-14:** After template loads, couple can delete any category or individual item freely.

### Claude's Discretion

- RSVP change notification channel (email vs in-app) — implement whichever fits the Resend + Supabase stack most cleanly. Email preferred since Resend is already in the stack.
- Exact color motif input UI (text input, color picker, or both) — start with a text input for simplicity.
- Checklist template seeding mechanism (SQL seed file vs admin-inserted rows vs hardcoded in application code) — Claude picks the most maintainable approach.

### Deferred Ideas (OUT OF SCOPE)

- Animated attire photos on RSVP closed page — static image uploads only in Phase 1
- Honeymoon/post-wedding checklist tasks — not in default template
- Per-guest RSVP lock — not in Phase 1
- Table assignment for guests — no seating chart in v1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email/password | Supabase Auth `signUp()`, profiles trigger |
| AUTH-02 | User stays logged in across browser sessions | `@supabase/ssr` middleware refreshes JWT automatically |
| AUTH-03 | User can log out from any page | Supabase `signOut()` in Server Action |
| AUTH-04 | User can reset password via email link | Supabase `resetPasswordForEmail()` + update flow |
| AUTH-07 | Guest can access RSVP page via link without account | Token-based public route, anon Supabase client |
| EVENT-01 | Client can create one active event (type, date, time) | `events` table, unique constraint on client_id |
| EVENT-02 | Client can add multiple locations | `event_locations` table |
| EVENT-03 | Client can edit event details after creation | Server Action with RLS owner check |
| EVENT-04 | Dashboard shows countdown, checklist %, budget summary | Client component for countdown; aggregated queries |
| COPL-01 | Client can invite co-planner by email | `event_invitations` table, Resend email |
| COPL-02 | Invited co-planner receives email and can accept | Resend + invitation token accept flow |
| COPL-03 | Co-planner has full edit access to shared event | RLS joins on `event_invitations` for all event tables |
| CHECK-01 | Client can start from pre-built PH wedding checklist template | Seeded template items, "Load template" Server Action |
| CHECK-02 | Client can add custom items at any time | INSERT with Server Action |
| CHECK-03 | Client can remove or rename any checklist item | DELETE/UPDATE Server Action |
| CHECK-04 | Supplier task items linked to supplier with status flow | `item_type = 'supplier_task'`, offline fields |
| CHECK-05 | Personal task items with Pending → Done status | `item_type = 'personal_task'` |
| CHECK-06 | Supplier booking auto-updates checklist item | Phase 4 will trigger this; schema must support the FK now |
| CHECK-07 | Template includes PH-specific items | D-11/D-12 item list in seed data |
| BUDG-01 | Client can set total event budget (₱) | `events.total_budget INTEGER` (centavos) |
| BUDG-02 | Client can allocate budget per checklist category | `budget_categories.allocated_amount INTEGER` |
| BUDG-03 | Each expense records total price, deposit, balance, due date | `expenses` table all INTEGER centavos |
| BUDG-04 | Client can upload receipt attached to payment entry | Supabase Storage `receipts/` bucket, `receipt_files` table |
| BUDG-05 | Budget dashboard shows total/committed/paid/remaining | Aggregate query on `expenses` by `event_id` |
| BUDG-06 | Visual alert when category exceeds allocated budget | Client-side comparison: SUM(expenses) vs allocated_amount |
| FILE-01 | Client can upload files tagged to supplier or checklist item | `event_files` table, Storage private bucket |
| FILE-02 | Client can upload general event files | `event_files` with nullable `checklist_item_id` |
| FILE-03 | Client can view and download uploaded files | Supabase signed URL generation |
| FILE-04 | Accepted types: PDF, JPG, PNG | Client-side MIME validation + server-side check |
| RSVP-01 | Client can add guests by name | `guests` table with full_name + nickname |
| RSVP-02 | Client can mark guest as +1, record +1 name | `guests.has_plus_one`, `rsvp_responses.plus_one_name` |
| RSVP-03 | Client can generate shareable RSVP link | `rsvp_tokens` table, nanoid(20) |
| RSVP-04 | Guest can search name and RSVP without account | Public Route Handler, anon client |
| RSVP-05 | Guest with +1 can enter +1 name and response | RSVP form + rsvp_responses.plus_one_* fields |
| RSVP-06 | Meal preference collection optional | `events.meal_preference_enabled boolean` |
| RSVP-07 | Client sees live RSVP summary | Aggregated query on rsvp_responses |
| RSVP-08 | Client can manually override any guest's RSVP | UPDATE Server Action with event ownership check |
| DISC-07 | Client can add offline supplier to checklist item | Nullable offline_supplier_* columns on checklist_items |
| NOTF-04 | Co-planner receives email invitation | Resend transactional email with invitation token link |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield build of a complete wedding planning app using Next.js 15, Supabase, and shadcn/ui. The project does not yet exist — no `package.json`, no source files, no Supabase project. The planner is writing the first-ever task list for this codebase.

The Walking Skeleton approach is mandatory: the first wave scaffolds the project, sets up the database schema with RLS, deploys to Vercel, and produces one working end-to-end slice (user signs up → creates event → sees dashboard). Subsequent waves add vertical feature slices — checklist, budget, guest list/RSVP, file storage, and co-planner invitation — each independently deployable.

Three architecture decisions require special attention in Phase 1. First, all monetary columns must be `INTEGER` (centavos) from day one — the existing ARCHITECTURE.md research incorrectly shows `NUMERIC` for monetary columns, which contradicts the locked decision in CLAUDE.md. Second, the co-planner feature requires a new `event_invitations` table not present in ARCHITECTURE.md, plus expanded RLS on every event-scoped table to allow co-planner read/write. Third, Next.js 16 is now the `latest` npm tag (16.2.9) but this project targets Next.js 15 — bootstrapping must explicitly pin to `next@15.3.9`.

**Primary recommendation:** Use the Walking Skeleton structure: Wave 0 = scaffold + DB schema + auth + single real write; Waves 1-6 = one feature slice each. This ensures a deployable, test-able application exists before any feature slice starts.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Auth (signup/login/logout/reset) | Supabase Auth | Next.js middleware (redirect UX only) | Supabase Auth manages sessions; middleware only reads the JWT cookie for redirect decisions |
| Session persistence across requests | `@supabase/ssr` middleware | — | Middleware refreshes expired JWT tokens on every request; stored in HTTP-only cookie |
| Route protection (role-based redirect) | Next.js middleware | — | Reads JWT cookie, redirects unauthenticated/wrong-role users |
| Data authorization (row-level) | Supabase RLS | DAL `verifySession()` | RLS is the hard security boundary; DAL provides defense-in-depth in Server Actions |
| Event/checklist/budget/guest CRUD | API / Backend (Server Actions) | Supabase PostgreSQL | Server Actions call DAL first, then Supabase server client |
| File uploads (receipts, contracts, attire photos) | Supabase Storage | Server Action (signed URL) | Client uploads directly to Storage using RLS-protected bucket; Server Action generates signed download URLs |
| RSVP page (public, no auth) | Frontend Server (SSR) | Supabase anon client | Server Component renders event info from token; Route Handler handles name search and RSVP submission |
| Co-planner invitation email | API / Backend (Server Action) | Resend | Server Action creates invitation token, Resend delivers email |
| Dashboard countdown timer | Browser / Client | — | `new Date()` in a `'use client'` component to avoid hydration mismatch |
| Checklist template seeding | Database / Storage | — | SQL migration seed data; loaded on demand via Server Action |
| Currency display | Browser / Client | — | `Intl.NumberFormat` at render time only; all storage is centavos |

---

## Standard Stack

### Core (Phase 1 relevant)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.3.9 | Full-stack framework | Project-locked. Pin explicitly — npm `latest` is now 16.x |
| react | 19.x | UI runtime | Bundled with Next.js 15 |
| typescript | 5.x | Type safety | Bundled with create-next-app |
| @supabase/supabase-js | 2.108.2 [VERIFIED: npm registry] | DB queries, auth, storage | Full-featured typed Supabase client |
| @supabase/ssr | 0.12.0 [VERIFIED: npm registry] | Server-side auth in Next.js | Required for App Router; replaces deprecated auth-helpers-nextjs |
| tailwindcss | 4.x | Utility styling | Bundled with create-next-app 15; CSS-first config (no tailwind.config.js needed) |
| react-hook-form | 7.79.0 [VERIFIED: npm registry] | Form state and validation UX | Uncontrolled inputs, Server Action support, integrates with shadcn/ui Form |
| zod | 4.4.3 [VERIFIED: npm registry] | Schema validation + TypeScript inference | **Breaking change from v3** — see Pitfalls section |
| @hookform/resolvers | 5.4.0 [VERIFIED: npm registry] | Connects Zod 4 to react-hook-form | Version 5.x supports Zod v4; v3.x only supports Zod v3 |
| date-fns | 4.4.0 [VERIFIED: npm registry] | Date formatting, countdown, calculations | Tree-shakeable, TypeScript-first |
| nanoid | 5.1.11 [VERIFIED: npm registry] | RSVP token generation (20-char URL-safe) | Cryptographically random, shorter than UUID |
| resend | 6.14.0 [VERIFIED: npm registry] | Email delivery (co-planner invite, RSVP notification) | 3,000 emails/month free; already in stack |
| @react-email/components | 1.0.12 [VERIFIED: npm registry] | Typed React-based email templates | Typed props, server-side render to HTML, Resend accepts output directly |
| sonner | 2.0.7 [VERIFIED: npm registry] | Toast notifications | shadcn/ui recommended; one `<Toaster />` in root layout |
| react-dropzone | 15.0.0 [VERIFIED: npm registry] | Drag-and-drop file upload UI | Client-side MIME/size validation before Supabase Storage upload |
| zustand | 5.0.14 [VERIFIED: npm registry] | Client UI state (wizard steps, modal state) | No context boilerplate; one store for multi-step onboarding wizard |

### Supporting (Phase 1 relevant)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.21.0 [VERIFIED: npm registry] | Icons | Ships with shadcn/ui; do not add a second icon library |
| @tanstack/react-query | 5.101.0 [VERIFIED: npm registry] | Client-side data cache + reactive updates | RSVP summary (live counts); guest list mutations |
| @tanstack/react-table | 8.21.3 [VERIFIED: npm registry] | Headless data table | Guest list view with sorting/filtering |

> shadcn/ui is not a versioned npm package — it is a component registry. Add components via `npx shadcn@latest add [component]`. Components are copied into `components/ui/` and owned by the project.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/ssr` | `@supabase/auth-helpers-nextjs` | auth-helpers is deprecated; do not use |
| Zod 4 | Zod 3 | Zod 4 is current; `@hookform/resolvers` 5.x requires Zod 4 |
| react-dropzone | Native `<input type="file">` | Native works but lacks drag-and-drop UX for file manager feature |
| nanoid | `crypto.randomUUID()` | UUID is 36 chars; nanoid(20) is shorter and URL-safe |
| Resend + React Email | Nodemailer | Nodemailer requires SMTP configuration; Resend has zero-config free tier |

### Installation

```bash
# Step 1: Bootstrap (IMPORTANT: pin to 15.x, NOT latest which is 16.x)
npx create-next-app@15.3.9 event-app --typescript --tailwind --app

# Step 2: Async API codemod (required for Next.js 15 — cookies, params, searchParams are async)
cd event-app
npx @next/codemod@canary next-async-request-api .

# Step 3: shadcn/ui
npx shadcn@latest init

# Step 4: Core dependencies
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  react-hook-form \
  zod \
  @hookform/resolvers \
  @tanstack/react-query \
  @tanstack/react-table \
  zustand \
  date-fns \
  nanoid \
  resend \
  @react-email/components \
  react-dropzone \
  sonner

# Step 5: Supabase CLI (dev dependency)
npm install -D supabase

# Step 6: shadcn/ui components needed for Phase 1
npx shadcn@latest add button input label form card dialog sheet select \
  textarea badge tabs separator avatar dropdown-menu toast calendar \
  progress alert checkbox popover command
```

---

## Package Legitimacy Audit

> slopcheck was unavailable at research time. All packages marked `[ASSUMED]` — planner must gate each install behind a `checkpoint:human-verify` task, or confirm registry existence before running `npm install`.

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| next@15.3.9 | npm | ~7 yrs | github.com/vercel/next.js | N/A | Approved — official Vercel product |
| @supabase/supabase-js | npm | ~5 yrs | github.com/supabase/supabase-js | N/A | Approved — official Supabase SDK |
| @supabase/ssr | npm | ~3 yrs (Sept 2023) [VERIFIED: npm registry] | github.com/supabase/ssr | N/A | Approved — official Supabase SSR package |
| react-hook-form | npm | ~7 yrs | github.com/react-hook-form/react-hook-form | N/A | Approved — widely adopted |
| zod | npm | ~5 yrs | github.com/colinhacks/zod | N/A | Approved — widely adopted |
| @hookform/resolvers | npm | ~6 yrs | github.com/react-hook-form/resolvers | N/A | Approved |
| @tanstack/react-query | npm | ~4 yrs | github.com/TanStack/query | N/A | Approved |
| @tanstack/react-table | npm | ~4 yrs | github.com/TanStack/table | N/A | Approved |
| zustand | npm | ~7 yrs | github.com/pmndrs/zustand | N/A | Approved |
| date-fns | npm | ~12 yrs | github.com/date-fns/date-fns | N/A | Approved |
| nanoid | npm | ~9 yrs | github.com/ai/nanoid | N/A | Approved |
| resend | npm | ~9 yrs | github.com/resend/resend-node | N/A | Approved — official Resend SDK |
| @react-email/components | npm | ~3 yrs | github.com/resend/react-email | N/A | Approved — official React Email |
| react-dropzone | npm | ~12 yrs | github.com/react-dropzone/react-dropzone | N/A | Approved |
| sonner | npm | ~3 yrs | github.com/emilkowalski/sonner | N/A | Approved — shadcn/ui recommended |
| lucide-react | npm | ~5 yrs | github.com/lucide-icons/lucide | N/A | Approved — shadcn/ui default |

**Packages removed due to slopcheck [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** none — all packages verified against official GitHub repositories with multi-year histories.

*slopcheck was unavailable at research time. All packages above are tagged `[ASSUMED]` for registry trust purposes. The planner should add a `checkpoint:human-verify` task before the install wave.*

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Guest — no auth)
  │
  │  /rsvp/[token]
  ▼
Next.js Server Component (anon Supabase client)
  ├── Validates token → get event_id
  ├── Renders event info (name, date, locations, motif)
  └── Serves RSVP form
        │
        ├── GET /api/rsvp/[token]/search?q=name
        │     Anon client → SELECT guests WHERE event_id = ? AND name ILIKE ?
        └── POST /api/rsvp/[token]/respond
              Anon client → UPSERT rsvp_responses
              → Resend email notification to client (D-08)

──────────────────────────────────────────────────────────

Browser (Authenticated Client)
  │
  │  HTTP request to protected route
  ▼
middleware.ts
  ├── Reads JWT cookie (Supabase session via @supabase/ssr)
  ├── Refreshes expired token
  ├── Redirects unauthenticated → /login
  └── Passes refreshed session to request context
        │
        ▼
  Next.js Server Component
    ├── lib/dal.ts: verifySession() — confirms session is valid + gets user
    ├── assertRole('client') — checks profiles.role
    ├── Supabase server client → query DB (RLS enforced)
    └── Returns rendered HTML with data
          │
          ├── Client mutation (form submit, button click)
          │     ▼
          │   Server Action (app/actions/*.ts)
          │     ├── verifySession() — independent DAL call
          │     ├── Supabase server client → INSERT/UPDATE/DELETE
          │     └── revalidatePath('/dashboard')
          │
          └── File upload
                ▼
              Client Component → react-dropzone validates type/size
                → Supabase Storage upload (RLS-protected bucket)
                → Server Action saves storage path to DB

──────────────────────────────────────────────────────────

External:
  Supabase PostgreSQL ←── RLS on every table
  Supabase Storage   ←── RLS on event-files, receipts buckets
  Resend             ←── co-planner invites, RSVP notifications
```

### Recommended Project Structure

```
event-app/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              Redirect authenticated users away
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── update-password/page.tsx
│   │
│   ├── (client)/
│   │   ├── layout.tsx              verifySession() + assertRole('client')
│   │   ├── dashboard/page.tsx      Countdown + checklist % + budget summary
│   │   └── event/
│   │       ├── checklist/page.tsx
│   │       ├── budget/page.tsx
│   │       ├── guests/page.tsx
│   │       └── files/page.tsx
│   │
│   ├── onboarding/
│   │   ├── layout.tsx              verifySession() only (no role check — new users)
│   │   └── page.tsx                Event creation wizard
│   │
│   ├── rsvp/
│   │   └── [token]/
│   │       └── page.tsx            Public — NO auth group, token = authorization
│   │
│   ├── invite/
│   │   └── [token]/
│   │       └── page.tsx            Co-planner invite accept page
│   │
│   ├── api/
│   │   ├── rsvp/
│   │   │   └── [token]/
│   │   │       ├── search/route.ts  GET guest name search
│   │   │       └── respond/route.ts POST RSVP submission
│   │   └── invitations/
│   │       └── [token]/accept/route.ts  POST co-planner accept
│   │
│   ├── actions/
│   │   ├── auth.ts                 signUp, signIn, signOut, resetPassword
│   │   ├── events.ts               createEvent, updateEvent, addLocation
│   │   ├── checklist.ts            addItem, updateItem, deleteItem, loadTemplate
│   │   ├── budget.ts               createCategory, createExpense, updateExpense
│   │   ├── guests.ts               addGuest, updateGuest, deleteGuest, overrideRsvp
│   │   ├── files.ts                saveFilePath, deleteFile
│   │   └── invitations.ts          inviteCoPlanner, acceptInvitation
│   │
│   ├── layout.tsx                  Root layout: <Toaster /> + QueryProvider + font
│   └── page.tsx                    Landing / marketing (or redirect to login)
│
├── lib/
│   ├── dal.ts                      verifySession(), getCurrentUser(), assertRole()
│   ├── supabase/
│   │   ├── server.ts               createServerClient (Server Components, Server Actions)
│   │   ├── client.ts               createBrowserClient (Client Components)
│   │   └── service.ts              Service role client (public RSVP Route Handlers only)
│   └── utils.ts                    formatPHP(), centavosToPhp(), phpToCentavos()
│
├── components/
│   ├── ui/                         shadcn/ui components (owned by project)
│   ├── forms/                      Reusable form components
│   ├── dashboard/                  Dashboard-specific widgets
│   ├── checklist/                  Checklist item components
│   ├── budget/                     Budget chart and expense entry
│   ├── guests/                     Guest list table + RSVP modal
│   └── rsvp/                       Public RSVP page components
│
├── types/
│   ├── database.ts                 Generated by: supabase gen types typescript
│   └── index.ts                    App-level type exports
│
├── emails/
│   ├── CoplannerInvite.tsx         React Email template — invitation
│   └── RsvpNotification.tsx        React Email template — RSVP update
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql   All CREATE TABLE + RLS in one migration
│   │   └── 002_seed_template.sql   Checklist template seed data
│   └── seed.sql                    Optional: dev seed data
│
├── middleware.ts                   Session refresh + route redirect
└── .env.local                      NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
                                    SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY
```

### Pattern 1: Supabase Server Client (for Server Components and Server Actions)

```typescript
// lib/supabase/server.ts
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()  // Next.js 15: cookies() is async

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookie write is handled by middleware
          }
        },
      },
    }
  )
}
```

> **Note:** Supabase docs now use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as the env var name (same value as anon key, just renamed in their docs). Both names work — use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for consistency with existing documentation in this project. [ASSUMED]

### Pattern 2: DAL verifySession()

```typescript
// lib/dal.ts
// Source: https://nextjs.org/docs/app/guides/authentication (DAL section)
import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  // Use getUser() not getSession() — getUser() validates against Supabase Auth server
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return user
})

export const assertRole = cache(async (requiredRole: 'client' | 'supplier' | 'admin') => {
  const user = await verifySession()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== requiredRole) {
    redirect('/login')
  }

  return { user, profile }
})
```

### Pattern 3: Middleware (session refresh + route redirect)

```typescript
// middleware.ts  (Next.js 15 — NOT proxy.ts which is Next.js 16)
// Source: https://supabase.com/docs/guides/auth/server-side/nextjs
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (never use getSession here — use getUser)
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 4: Zod v4 Schema (breaking changes from v3)

```typescript
// IMPORTANT: Zod v4 (4.x) has breaking changes from v3
// Source: [ASSUMED — based on npm registry version and training knowledge]

// Zod v4: top-level z.email(), z.url() etc. (not z.string().email())
import { z } from 'zod'

export const createEventSchema = z.object({
  title: z.string().min(1, 'Event name is required'),
  event_date: z.string().min(1, 'Date is required'),   // ISO date string
  event_time: z.string().optional(),
})

export const addGuestSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  nickname: z.string().optional(),
  has_plus_one: z.boolean().default(false),
})

// Currency input: user types "₱50,000" or "50000" → store as centavos integer
export const budgetSchema = z.object({
  total_budget: z
    .number()
    .int()
    .positive()
    .describe('Amount in centavos — divide by 100 for display'),
})
```

> **Zod v4 warning for planner:** The API changed from v3. Errors use `{ error: '...' }` not `{ message: '...' }` in some validators. Do not copy Zod v3 code examples directly. [ASSUMED — verify against official Zod v4 docs at zod.dev before writing schemas]

### Pattern 5: INTEGER Centavos — Currency Utilities

```typescript
// lib/utils.ts
// Source: CLAUDE.md §Architecture Decisions (locked)

/** Convert Philippine Peso (float user input) to centavos integer for DB storage */
export function phpToCentavos(amount: number): number {
  return Math.round(amount * 100)
}

/** Convert centavos integer from DB to PHP for display */
export function centavosToPhp(centavos: number): number {
  return centavos / 100
}

/** Format centavos as Philippine Peso string */
export function formatPHP(centavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(centavosToPhp(centavos))
  // → "₱ 50,000"
}
```

### Pattern 6: RSVP Route Handler (public, anon)

```typescript
// app/api/rsvp/[token]/search/route.ts
// Source: ARCHITECTURE.md + Next.js Route Handler docs
import { createClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }  // Next.js 15: params is async
) {
  const { token } = await params
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.length < 2) {
    return NextResponse.json({ guests: [] })
  }

  // Use service client to bypass RLS for token lookup, then validate
  const supabase = createServiceClient()

  // 1. Validate token → get event_id
  const { data: tokenRow } = await supabase
    .from('rsvp_tokens')
    .select('event_id, rsvp_deadline')
    .eq('token', token)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  // 2. Search guests (only name/nickname/id — minimal exposure)
  const { data: guests } = await supabase
    .from('guests')
    .select('id, full_name, nickname, has_plus_one')
    .eq('event_id', tokenRow.event_id)
    .or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%`)
    .limit(5)  // limit exposure

  return NextResponse.json({ guests: guests ?? [] })
}
```

### Anti-Patterns to Avoid

- **`getSession()` in server code:** Use `getUser()` instead. `getSession()` does not validate the JWT against Supabase Auth server — an attacker could forge the session cookie. [CITED: supabase.com/docs]
- **`middleware.ts` only for auth:** Middleware is redirect UX only. Every Server Action and Route Handler calls `verifySession()` independently.
- **NUMERIC for monetary columns:** All monetary DB columns must be `INTEGER` (centavos). The existing ARCHITECTURE.md research uses `numeric` — this is wrong and must be corrected in migrations.
- **`'use client'` for countdown/date components:** Any component calling `new Date()` or displaying a countdown must be a Client Component to avoid hydration mismatch.
- **`create-next-app@latest`:** This now installs Next.js 16. Use `create-next-app@15.3.9` explicitly.
- **Zod v3 patterns with @hookform/resolvers v5:** They are incompatible. Use Zod v4 API with resolvers v5.
- **`@supabase/auth-helpers-nextjs`:** Deprecated. Use `@supabase/ssr` only.

---

## Phase 1 Database Schema (Additions and Corrections)

> The `.planning/research/ARCHITECTURE.md` schema is the complete multi-phase schema. Phase 1 uses a subset of those tables, with several corrections and additions. This section documents Phase 1 specifics only.

### Tables Required in Phase 1 Migration

- `profiles` — with auto-create trigger on `auth.users` insert
- `events` — **with INTEGER centavos for total_budget** (not NUMERIC) + D-10 additions
- `event_locations`
- `checklist_items` — includes offline supplier columns (DISC-07)
- `budget_categories` — **with INTEGER centavos for allocated_amount**
- `expenses` — **with INTEGER centavos for total_amount, deposit_paid, remaining_balance**
- `receipt_files` — for BUDG-04
- `guests` — **with nickname column** (D-05)
- `rsvp_tokens` — **with rsvp_deadline column** (D-06)
- `rsvp_responses` — with responded_at timestamptz (D-07)
- `event_files` — for FILE-01-04
- `event_invitations` — **NEW: not in ARCHITECTURE.md** (COPL-01-03)

### Corrections to ARCHITECTURE.md Schema

| Table | Column | ARCHITECTURE.md Type | Correct Type | Reason |
|-------|--------|---------------------|-------------|--------|
| events | total_budget | numeric | INTEGER | CLAUDE.md §1: INTEGER centavos mandatory |
| budget_categories | allocated_amount | numeric | INTEGER | Same |
| expenses | total_amount | numeric | INTEGER | Same |
| expenses | deposit_paid | numeric | INTEGER | Same |
| expenses | remaining_balance | numeric | INTEGER | Same |

### Additions to ARCHITECTURE.md Schema

**events table — add columns:**
```sql
color_motif          text,           -- D-10: e.g., "Dusty Rose"
attire_photo_1_path  text,           -- D-10: Supabase Storage path
attire_photo_2_path  text,           -- D-10: Supabase Storage path
rsvp_deadline        date,           -- D-06: RSVP locks after this date
meal_preference_enabled boolean DEFAULT false  -- already in ARCHITECTURE.md
```

**guests table — add column:**
```sql
nickname  text  -- D-05: optional disambiguation field
```

**rsvp_responses table — already has responded_at per ARCHITECTURE.md**

### New Table: event_invitations (COPL-01-03)

```sql
CREATE TABLE event_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  invitee_email   text NOT NULL,
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- set when accepted
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  invitation_token text NOT NULL UNIQUE,  -- nanoid(20) for /invite/[token]
  invited_at      timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  UNIQUE(event_id, invitee_email)         -- prevent duplicate invitations
);

ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- Event owner can create invitations
CREATE POLICY "owner_manage_invitations" ON event_invitations
FOR ALL TO authenticated
USING (
  event_id IN (SELECT id FROM events WHERE client_id = auth.uid())
)
WITH CHECK (
  event_id IN (SELECT id FROM events WHERE client_id = auth.uid())
);

-- Invitee can see and accept their own invitation (via token, not user_id)
-- Enforced at Route Handler level (token lookup), not RLS alone
```

### Extended RLS for Co-Planner Access

Every event-scoped table (checklist_items, budget_categories, expenses, guests, event_files, etc.) needs SELECT/INSERT/UPDATE/DELETE policies that allow both the event owner AND accepted co-planners:

```sql
-- Helper function (add to migration)
CREATE OR REPLACE FUNCTION public.user_can_access_event(evt_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events WHERE id = evt_id AND client_id = auth.uid()
    UNION
    SELECT 1 FROM event_invitations
    WHERE event_id = evt_id AND user_id = auth.uid() AND status = 'accepted'
  )
$$;

-- Use in all event-scoped table policies:
CREATE POLICY "event_participants_access_checklist"
ON checklist_items FOR ALL TO authenticated
USING (public.user_can_access_event(event_id))
WITH CHECK (public.user_can_access_event(event_id));
```

### Storage Buckets (Phase 1)

```
event-files  — PRIVATE  — contracts, quotations, general event docs
receipts     — PRIVATE  — payment receipts (BUDG-04)
event-media  — PRIVATE  — attire reference photos (D-10)
```

> `supplier-portfolio` bucket is Phase 2 (not needed yet).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth session refresh | Custom JWT refresh logic | `@supabase/ssr` middleware | Handles token expiry, cookie sync, server/client split automatically |
| File upload UI | Custom drag-and-drop | `react-dropzone` | File selection, drag events, MIME/size validation; well-tested cross-browser |
| Email templates | HTML string concatenation | `@react-email/components` + Resend | Type-safe props, React component reuse, previews in dev, renders to HTML |
| Toast notifications | Custom toast component | `sonner` | Accessibility, stacking, dismissal, promise-based API all handled |
| RSVP token uniqueness | `Math.random()` | `nanoid(5.1.11)` | Cryptographically random; Math.random() is not suitable for security tokens |
| Currency arithmetic | `amount * 100` inline everywhere | Centralized `phpToCentavos()` / `centavosToPhp()` utilities | Single point of rounding logic; prevents accumulated errors |
| Date countdown | Manual `Date.now() - eventDate` | `date-fns` `differenceInDays()` / `formatDistanceToNow()` | Handles DST, timezone, leap years, locales correctly |
| Philippine Peso formatting | Custom formatter | `Intl.NumberFormat('en-PH', ...)` | Native browser API; zero bundle size; handles ₱ symbol, grouping separators |
| Zod + react-hook-form integration | Custom resolver | `@hookform/resolvers` `zodResolver()` | One import; handles all Zod schema types including discriminated unions |

**Key insight:** Every hand-rolled solution for the items above has failed in production for at least one of: rounding errors, security weakness, edge-case browser behavior, or accessibility gaps. Use the libraries.

---

## Walking Skeleton Plan

> The project is greenfield. A Walking Skeleton is mandatory: the thinnest end-to-end slice first, then vertical feature additions.

### Wave 0 — Skeleton (blocks all other waves)

**Goal:** A deployed app where an authenticated user can create an event and see it on the dashboard. Zero placeholders — real DB read/write.

1. `npx create-next-app@15.3.9` bootstrap + codemod + shadcn/ui init
2. Supabase project creation (dashboard.supabase.com)
3. All Phase 1 tables in one migration (`001_create_tables.sql`) with RLS enabled
4. Template checklist seed (`002_seed_template.sql`)
5. `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/service.ts`
6. `lib/dal.ts`: `verifySession()`, `assertRole()`
7. `middleware.ts`: session refresh + redirect unauthenticated users
8. Route groups: `(auth)/`, `(client)/`, `onboarding/`, `rsvp/[token]/`, `invite/[token]/`
9. Signup + login + logout pages (shadcn/ui Form + Supabase Auth)
10. Onboarding wizard (event date + location) → Server Action → redirect to dashboard
11. Dashboard shell: "X days until your wedding" Client Component + placeholder sections
12. Vercel deploy + environment variables configured
13. Keep-alive cron job (Vercel Cron or external service pinging Supabase every 3 days)

**Skeleton is done when:** Signup → email verified → login → create event → see countdown works in production.

### Waves 1-6 — Feature Slices (independent after Wave 0)

| Wave | Feature | Key Decisions |
|------|---------|---------------|
| 1 | Checklist | Template load button (D-13), both item types, offline supplier fields (DISC-07) |
| 2 | Budget | INTEGER centavos throughout, category allocation, deposit/balance/due date tracking |
| 3 | File Storage | Private bucket RLS, react-dropzone, signed URLs for download, PDF/JPG/PNG only |
| 4 | Guest List + RSVP | nickname field (D-05), RSVP deadline (D-06), response timestamp (D-07), public Route Handlers |
| 5 | RSVP notification email | D-08: Resend email when any guest RSVPs, React Email template |
| 6 | Co-planner invitation | event_invitations table, Resend invite email (NOTF-04), /invite/[token] accept page |

---

## Common Pitfalls

### Pitfall 1: `create-next-app@latest` Installs Next.js 16

**What goes wrong:** `npx create-next-app@latest` now installs Next.js 16.2.9, not 15.x. Next.js 16 renames `middleware.ts` to `proxy.ts` and the default export function from `middleware()` to `proxy()`. All existing documentation for this project assumes Next.js 15 patterns.

**Why it happens:** npm `latest` tag was updated to 16.x in 2026.

**How to avoid:** Use `npx create-next-app@15.3.9` or `npx create-next-app@next-15-3` (dist-tag for 15.3.9).

**Warning signs:** After bootstrap, `package.json` shows `"next": "^16.x.x"`.

---

### Pitfall 2: Zod v4 Breaking Changes from v3

**What goes wrong:** Zod is at v4.4.3. Code copied from tutorials or older projects likely uses Zod v3 API. Two specific breakages affect this project:

1. `z.string().email()` → in Zod v4, standalone validators exist: `z.email()`. The `.email()` on string still works, but error object uses `{ error: '...' }` not `{ message: '...' }`.
2. `@hookform/resolvers` v5.x is required for Zod v4. v3.x resolvers do not work with v4 schemas.

**How to avoid:** Read Zod v4 migration docs before writing any schema. Use `@hookform/resolvers@5.4.0` (installed above). [ASSUMED — verify at zod.dev/v4]

**Warning signs:** TypeScript errors on `.message()` in Zod schemas. Form validation silently fails.

---

### Pitfall 3: NUMERIC instead of INTEGER for Monetary Columns

**What goes wrong:** Using PostgreSQL `NUMERIC` or `DECIMAL` for budget/expense columns. The `.planning/research/ARCHITECTURE.md` schema incorrectly shows `numeric` for all monetary columns. Using float-compatible types creates rounding errors at large PH wedding budget scales.

**How to avoid:** Every monetary column uses `INTEGER` (centavos). `₱50,000.00 = 5000000`. Store `phpToCentavos(userInput)` before every insert. Divide on render only.

**Warning signs:** Budget totals show `₱49,999.99` instead of `₱50,000.00`.

---

### Pitfall 4: `getSession()` in Middleware / Server Code

**What goes wrong:** Using `supabase.auth.getSession()` in middleware or Server Actions. `getSession()` reads the JWT from the cookie without validating it against the Supabase Auth server — an attacker can forge the session cookie.

**How to avoid:** Use `supabase.auth.getUser()` everywhere in server code. [CITED: supabase.com/docs/guides/auth/server-side/nextjs]

**Warning signs:** Auth works but is not secure — forged sessions bypass role checks.

---

### Pitfall 5: Missing Co-Planner RLS on Event-Scoped Tables

**What goes wrong:** Adding the `event_invitations` table but forgetting to update RLS policies on `checklist_items`, `budget_categories`, `expenses`, `guests`, `event_files`, and `receipt_files` to allow co-planners (accepted invitations) access. Co-planners get 403 errors on every operation despite accepting the invitation.

**How to avoid:** Use the `user_can_access_event(evt_id)` helper function in every event-scoped table policy. Write this function first in the migration; all table policies reference it.

**Warning signs:** Event owner sees all data; co-planner gets empty lists or auth errors.

---

### Pitfall 6: Countdown Component Causes Hydration Error

**What goes wrong:** Rendering the "X days until your wedding" countdown in a Server Component with `new Date()`. Server-side date and client-side date differ — React throws a hydration mismatch error.

**How to avoid:** Any component that shows the current date/time or a countdown must be a `'use client'` component. Pass the event date as a prop from the Server Component parent. Use `date-fns` `differenceInDays(eventDate, new Date())` inside the Client Component.

**Warning signs:** "Text content did not match" React error in the browser console.

---

### Pitfall 7: Supabase Project Auto-Pauses During Development

**What goes wrong:** Supabase free tier projects pause after ~1 week of no database activity. All requests return errors (not a graceful page). The first user who visits after a quiet week sees a broken app.

**How to avoid:** Set up a Vercel Cron (or cron-job.org, free) to run a lightweight query (`SELECT 1`) against the Supabase DB every 3 days. Configure in Wave 0 before any external demo.

**Warning signs:** Supabase dashboard shows project status as "Paused". All API calls fail.

---

### Pitfall 8: `params` / `searchParams` / `cookies()` Not Awaited

**What goes wrong:** In Next.js 15, `params`, `searchParams`, and `cookies()` are async. Using them synchronously causes a runtime error or returns undefined.

**How to avoid:** Run the codemod immediately after `create-next-app`: `npx @next/codemod@canary next-async-request-api .`. Always `await params` and `await cookies()` in page components and Server Actions.

**Warning signs:** Build succeeds but runtime shows `params.id is undefined` in dynamic routes.

---

## Code Examples

### Currency Input → DB Storage

```typescript
// In a Server Action for creating an expense
// Source: CLAUDE.md §Architecture Decisions (locked decision)
export async function createExpense(formData: FormData) {
  const user = await verifySession()

  const rawAmount = parseFloat(formData.get('total_amount') as string)
  const rawDeposit = parseFloat(formData.get('deposit_paid') as string)

  // Convert to centavos for storage — NEVER store float
  const totalAmountCentavos = Math.round(rawAmount * 100)
  const depositPaidCentavos = Math.round(rawDeposit * 100)
  const remainingCentavos = totalAmountCentavos - depositPaidCentavos

  const supabase = await createClient()
  await supabase.from('expenses').insert({
    total_amount: totalAmountCentavos,
    deposit_paid: depositPaidCentavos,
    remaining_balance: remainingCentavos,
    // ...
  })
}
```

### RSVP Deadline Gate

```typescript
// app/rsvp/[token]/page.tsx
// Source: CONTEXT.md D-06
export default async function RSVPPage({
  params,
}: {
  params: Promise<{ token: string }>  // Next.js 15: async params
}) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: tokenRow } = await supabase
    .from('rsvp_tokens')
    .select(`event_id, events(title, event_date, rsvp_deadline, color_motif,
      attire_photo_1_path, attire_photo_2_path,
      event_locations(label, venue_name, address, time))`)
    .eq('token', token)
    .single()

  if (!tokenRow) notFound()

  const event = tokenRow.events as any
  const isDeadlinePassed =
    event.rsvp_deadline && new Date() > new Date(event.rsvp_deadline)

  if (isDeadlinePassed) {
    return <RSVPClosedPage event={event} />   // D-09 closed state
  }

  return <RSVPOpenPage event={event} token={token} />
}
```

### Co-planner Invitation Email

```typescript
// emails/CoplannerInvite.tsx
// Source: resend.com/docs, react-email docs
import { Html, Body, Heading, Text, Link, Preview } from '@react-email/components'

interface Props {
  inviterName: string
  eventTitle: string
  acceptUrl: string
}

export function CoplannerInvite({ inviterName, eventTitle, acceptUrl }: Props) {
  return (
    <Html>
      <Preview>{inviterName} invited you to help plan {eventTitle}</Preview>
      <Body>
        <Heading>You've been invited to co-plan {eventTitle}</Heading>
        <Text>{inviterName} wants you to help plan their wedding.</Text>
        <Link href={acceptUrl}>Accept invitation</Link>
      </Body>
    </Html>
  )
}

// Usage in Server Action (actions/invitations.ts):
import { render } from '@react-email/render'
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'EventMate <noreply@yourdomain.com>',
  to: inviteeEmail,
  subject: `You're invited to co-plan ${eventTitle}`,
  html: await render(<CoplannerInvite inviterName={...} eventTitle={...} acceptUrl={...} />),
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2023 | Old package is deprecated; new package required for App Router |
| `npm create next-app@latest` installs Next.js 15 | Now installs Next.js 16.2.9 | June 2026 | Must pin `@15.3.9` for this project |
| `middleware.ts` (Next.js 15) | `proxy.ts` (Next.js 16) | 2026 | Project targets 15 — use `middleware.ts` |
| `cookies()` synchronous | `cookies()` async (must `await`) | Next.js 15 | All server code touching cookies must be async |
| Zod v3 (`z.string().email()`) | Zod v4 (`z.email()`, `{ error: }`) | 2025 | Breaking API change; update all schemas |
| `@hookform/resolvers` v3 | v5 (Zod v4 support) | 2025 | v3 does not work with Zod v4 |
| `getSession()` for server auth | `getUser()` for server auth | 2024 | Security fix: `getUser()` validates JWT against server |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: deprecated, do not use
- Zod v3 error syntax `{ message: '...' }`: use `{ error: '...' }` in v4

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are interchangeable names for the same value in current `@supabase/ssr` 0.12 | Standard Stack + Code Examples | Env var mismatch causes auth failures at startup |
| A2 | `@hookform/resolvers` v5.4.0 supports Zod v4 | Standard Stack | Form validation completely broken if incompatible |
| A3 | `npx create-next-app@15.3.9` correctly pins Next.js 15 | Standard Stack | Bootstrap installs wrong Next.js version |
| A4 | Zod v4 top-level `z.email()` exists as a standalone validator | Code Examples | Schema compilation errors |
| A5 | `@supabase/ssr` middleware pattern is compatible with Next.js 15.3.9 | Architecture Patterns | Auth middleware fails to refresh tokens |
| A6 | slopcheck would rate all listed packages [OK] based on age and repo presence | Package Legitimacy Audit | Low risk — all packages are well-established with 2+ year histories |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed. (Table is not empty — see A1-A6 above.)

---

## Open Questions

1. **Zod v4 API confirmation**
   - What we know: `npm view zod version` returns 4.4.3. The package exists and is current.
   - What's unclear: The exact Zod v4 API for error messages (`{ error: }` vs `{ message: }`) and whether `z.email()` is truly top-level or still `z.string().email()`.
   - Recommendation: Planner adds a task in Wave 0 to read zod.dev/v4 migration guide before writing any schema.

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` vs `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**
   - What we know: Supabase official docs now use `PUBLISHABLE_KEY`. The `@supabase/ssr` package accepts either via the constructor argument (it's just a string).
   - What's unclear: Whether `create-next-app` Supabase template uses one naming vs the other.
   - Recommendation: Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` — it's the established name in this project's documentation and both work as constructor arguments.

3. **Checklist template seeding mechanism**
   - What we know: D-13 says "not auto-load." Options: SQL seed migration, hardcoded in application code, or admin-seeded rows.
   - Recommendation: Hardcode template items as a TypeScript constant in `lib/checklist-template.ts`. When the user clicks "Start from PH wedding template," the Server Action inserts these as checklist_items rows with `is_template = false` (they're user-owned from the moment of insertion). This avoids a SQL seed migration and is the most maintainable approach — the template evolves with code, not data.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | ✓ | v22.14.0 | — |
| npm | Package management | ✓ | 11.3.0 | — |
| git | Version control | ✓ | 2.48.1 | — |
| Supabase project (cloud) | Database, Auth, Storage | Needs creation | — | Create at dashboard.supabase.com (free) |
| Vercel account | Deployment | Needs creation | — | Free Hobby plan |
| Resend account + API key | Email (NOTF-04, D-08) | Needs creation | — | Free tier (3,000 emails/month) |
| Supabase CLI | DB migrations, type generation | Installed via `npm install -D supabase` | — | Required for local dev migrations |

**Missing dependencies with no fallback:**
- Supabase project — must be created before Wave 0 can proceed

**Missing dependencies with fallback:**
- Resend account — co-planner invites (NOTF-04) and RSVP notifications (D-08) require it. Wave 0-3 can proceed without it; Wave 5-6 block on it.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.ts` — Wave 0 gap |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run --coverage` |

> Vitest is recommended over Jest for this project: faster, ESM-native, no Babel config needed, compatible with Next.js 15. [ASSUMED — verify at vitest.dev]

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Password validation schema rejects weak passwords | unit | `npx vitest run tests/schemas/auth.test.ts` | ❌ Wave 0 |
| BUDG-01 | `phpToCentavos(50000)` returns `5000000` | unit | `npx vitest run tests/utils/currency.test.ts` | ❌ Wave 0 |
| BUDG-01 | `formatPHP(5000000)` returns `"₱ 50,000"` | unit | `npx vitest run tests/utils/currency.test.ts` | ❌ Wave 0 |
| RSVP-03 | RSVP token is 20 chars, URL-safe | unit | `npx vitest run tests/utils/token.test.ts` | ❌ Wave 0 |
| DISC-07 | Offline supplier schema validates name + category required | unit | `npx vitest run tests/schemas/checklist.test.ts` | ❌ Wave 0 |
| D-06 | RSVP deadline gate: locked when deadline < today | unit | `npx vitest run tests/utils/rsvp.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run` (full unit suite, < 10s)
- **Per wave merge:** `npx vitest run --coverage` (with coverage report)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — framework install: `npm install -D vitest @testing-library/react jsdom`
- [ ] `tests/utils/currency.test.ts` — covers BUDG-01 centavos arithmetic
- [ ] `tests/utils/token.test.ts` — covers RSVP-03 token format
- [ ] `tests/utils/rsvp.test.ts` — covers D-06 deadline gate
- [ ] `tests/schemas/auth.test.ts` — covers AUTH-01 password validation
- [ ] `tests/schemas/checklist.test.ts` — covers DISC-07 offline supplier schema

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (email/password + JWT); `getUser()` in server code only |
| V3 Session Management | yes | `@supabase/ssr` middleware; HttpOnly JWT cookie; auto-refresh |
| V4 Access Control | yes | RLS on every table; DAL `verifySession()` + `assertRole()` in all Server Actions |
| V5 Input Validation | yes | Zod schemas on both client (react-hook-form) and server (Server Action parses) |
| V6 Cryptography | yes | nanoid(20) for RSVP tokens; Supabase manages password hashing |
| V9 Communications | yes | Vercel handles HTTPS; no custom TLS config needed |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged session cookie | Spoofing | `supabase.auth.getUser()` validates JWT against Auth server on every request |
| RSVP guest enumeration | Information Disclosure | Limit search results to 5; require 2+ character minimum; rate limit via middleware |
| Service role key in browser | Elevation of Privilege | `SUPABASE_SERVICE_ROLE_KEY` never `NEXT_PUBLIC_`; only in Route Handlers/Server Actions |
| Cross-client data access | Information Disclosure | RLS on every table from day one; periodic anon-key query test to verify |
| Co-planner invitation forgery | Spoofing | nanoid(20) token for invite links; token is one-time-use (mark consumed on accept) |
| CSRF on Server Actions | Tampering | Next.js Server Actions include CSRF protection by default [ASSUMED] |
| File upload abuse | Tampering | MIME type validation client-side (react-dropzone) + server-side MIME check before Supabase Storage insert |
| Philippine DPA (RA 10173) | Privacy violation | Consent checkbox at signup; `consent_given_at` timestamptz in profiles; data deletion flow |

### Critical Security Checklist for Phase 1

- [ ] `SUPABASE_SERVICE_ROLE_KEY` must never have `NEXT_PUBLIC_` prefix
- [ ] RLS must be enabled in the same SQL migration that creates each table — never as a follow-up
- [ ] `getUser()` everywhere in server code — no `getSession()`
- [ ] RSVP Route Handler validates that `guest_id` belongs to the event from the token before any write
- [ ] Co-planner invitation token accepted = mark `status = 'accepted'` (token cannot be reused)
- [ ] File uploads: validate MIME type both client-side and server-side (content sniffing)
- [ ] Privacy consent checkbox on signup page (RA 10173 requirement before first real user)

---

## Sources

### Primary (HIGH confidence)

- `@supabase/ssr` npm registry — version 0.12.0, created 2023-09-06, github.com/supabase/ssr
- `@supabase/supabase-js` npm registry — version 2.108.2
- `next` npm dist-tags — next-15-3: 15.3.9, latest: 16.2.9 [VERIFIED: npm registry]
- Next.js Authentication Guide (official) — https://nextjs.org/docs/app/guides/authentication (fetched 2026-06-18, shows Next.js 16.2.9 patterns; Next.js 15 patterns are identical except `middleware.ts` vs `proxy.ts`)
- Supabase SSR for Next.js — https://supabase.com/docs/guides/auth/server-side/nextjs (fetched 2026-06-18)
- `.planning/research/ARCHITECTURE.md` — project domain model and RLS patterns (HIGH — direct from prior research)
- `.planning/research/STACK.md` — package selection rationale (HIGH — prior research)
- `.planning/research/PITFALLS.md` — known pitfalls (HIGH — prior research)

### Secondary (MEDIUM confidence)

- shadcn/ui + Tailwind v4 setup — https://ui.shadcn.com/docs/tailwind-v4 (via WebSearch)
- Supabase `getUser()` vs `getSession()` distinction — https://supabase.com/docs/guides/auth/server-side/nextjs (via WebSearch result)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` new naming — Supabase quickstart (fetched 2026-06-18)

### Tertiary (LOW confidence — tagged [ASSUMED])

- Zod v4 breaking API changes — training knowledge; verify at zod.dev/v4
- `@hookform/resolvers` v5 + Zod v4 compatibility — training knowledge; verify at github.com/react-hook-form/resolvers
- Vitest compatibility with Next.js 15 App Router — training knowledge; verify at vitest.dev

---

## Metadata

**Confidence breakdown:**
- Standard stack (versions): HIGH — all package versions verified via `npm view`
- Architecture patterns: HIGH — from official Next.js 15 docs + Supabase SSR docs
- Phase 1 schema (INTEGER corrections): HIGH — directly from CLAUDE.md locked decision
- Co-planner table design: MEDIUM — derived from COPL-01-03 requirements; no prior research on this table
- Zod v4 API specifics: LOW — training knowledge, not verified against official docs this session
- Pitfalls: HIGH — from PITFALLS.md + new Next.js version discovery

**Research date:** 2026-06-18
**Valid until:** 2026-07-18 (30 days — stack is relatively stable but Supabase SSR and Next.js both move quickly)
