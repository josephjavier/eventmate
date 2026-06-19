# Phase 1: Foundation & Planning Tools - Pattern Map

**Mapped:** 2026-06-18
**Files analyzed:** 47 new files (greenfield — no existing source code)
**Analogs found:** 0 / 47 (greenfield project; all patterns sourced from 01-RESEARCH.md)

> This project has no existing source code. Every pattern reference below points to a
> named pattern or code example in `.planning/phases/01-foundation-planning-tools/01-RESEARCH.md`.
> "RESEARCH Pattern N" = the `### Pattern N:` heading in the Architecture Patterns section.
> "RESEARCH Code Example: [title]" = a block under the `## Code Examples` heading.

---

## File Classification

| New File | Role | Data Flow | Pattern Source | Match Quality |
|----------|------|-----------|----------------|---------------|
| `middleware.ts` | middleware | request-response | RESEARCH Pattern 3 | exact |
| `lib/supabase/server.ts` | utility | request-response | RESEARCH Pattern 1 | exact |
| `lib/supabase/client.ts` | utility | request-response | RESEARCH Pattern 1 (browser variant) | role-match |
| `lib/supabase/service.ts` | utility | request-response | RESEARCH Pattern 1 (service-role variant) | role-match |
| `lib/dal.ts` | utility | request-response | RESEARCH Pattern 2 | exact |
| `lib/utils.ts` | utility | transform | RESEARCH Pattern 5 | exact |
| `lib/checklist-template.ts` | utility | transform | RESEARCH Open Question 3 recommendation | role-match |
| `app/layout.tsx` | layout | request-response | shadcn/ui root layout conventions | role-match |
| `app/page.tsx` | page | request-response | shadcn/ui marketing page | role-match |
| `app/(auth)/layout.tsx` | layout | request-response | RESEARCH Architecture Patterns (auth group) | role-match |
| `app/(auth)/login/page.tsx` | page | request-response | shadcn/ui Form + RESEARCH Pattern 4 | role-match |
| `app/(auth)/signup/page.tsx` | page | request-response | shadcn/ui Form + RESEARCH Pattern 4 | role-match |
| `app/(auth)/forgot-password/page.tsx` | page | request-response | shadcn/ui Form + Supabase resetPasswordForEmail | role-match |
| `app/(auth)/update-password/page.tsx` | page | request-response | shadcn/ui Form + Supabase updateUser | role-match |
| `app/(client)/layout.tsx` | layout | request-response | RESEARCH Pattern 2 (assertRole 'client') | exact |
| `app/(client)/dashboard/page.tsx` | page | CRUD | RESEARCH Architecture Responsibility Map | role-match |
| `app/(client)/event/checklist/page.tsx` | page | CRUD | RESEARCH Wave 1 description | role-match |
| `app/(client)/event/budget/page.tsx` | page | CRUD | RESEARCH Wave 2 description | role-match |
| `app/(client)/event/guests/page.tsx` | page | CRUD | RESEARCH Wave 4 description | role-match |
| `app/(client)/event/files/page.tsx` | page | file-I/O | RESEARCH Wave 3 description | role-match |
| `app/onboarding/layout.tsx` | layout | request-response | RESEARCH Pattern 2 (verifySession only) | role-match |
| `app/onboarding/page.tsx` | page | CRUD | RESEARCH Wave 0 step 10 + zustand store | role-match |
| `app/rsvp/[token]/page.tsx` | page | request-response | RESEARCH Code Example: RSVP Deadline Gate | exact |
| `app/invite/[token]/page.tsx` | page | request-response | RESEARCH Wave 6 description | role-match |
| `app/api/rsvp/[token]/search/route.ts` | route | request-response | RESEARCH Pattern 6 | exact |
| `app/api/rsvp/[token]/respond/route.ts` | route | CRUD | RESEARCH Pattern 6 (POST variant) | role-match |
| `app/api/invitations/[token]/accept/route.ts` | route | CRUD | RESEARCH Wave 6 / Pattern 6 structure | role-match |
| `app/actions/auth.ts` | server-action | request-response | RESEARCH Pattern 2 + Supabase signUp/signIn | role-match |
| `app/actions/events.ts` | server-action | CRUD | RESEARCH Pattern 2 + RESEARCH Code Example: Currency Input | role-match |
| `app/actions/checklist.ts` | server-action | CRUD | RESEARCH Pattern 2 + lib/checklist-template.ts | role-match |
| `app/actions/budget.ts` | server-action | CRUD | RESEARCH Code Example: Currency Input → DB Storage | exact |
| `app/actions/guests.ts` | server-action | CRUD | RESEARCH Pattern 2 + Pattern 4 (addGuestSchema) | role-match |
| `app/actions/files.ts` | server-action | file-I/O | RESEARCH Architecture Responsibility Map (file upload row) | role-match |
| `app/actions/invitations.ts` | server-action | event-driven | RESEARCH Code Example: Co-planner Invitation Email | exact |
| `emails/CoplannerInvite.tsx` | email-template | event-driven | RESEARCH Code Example: Co-planner Invitation Email | exact |
| `emails/RsvpNotification.tsx` | email-template | event-driven | RESEARCH Code Example: Co-planner Invitation Email (structure) | role-match |
| `components/dashboard/CountdownWidget.tsx` | component | request-response | RESEARCH Pitfall 6 (must be 'use client' + date-fns) | exact |
| `components/budget/CurrencyInput.tsx` | component | transform | RESEARCH Pattern 5 + Code Example: Currency Input | exact |
| `components/rsvp/RSVPClosedPage.tsx` | component | request-response | RESEARCH Code Example: RSVP Deadline Gate (isDeadlinePassed branch) | exact |
| `components/rsvp/RSVPOpenPage.tsx` | component | request-response | RESEARCH Pattern 6 (form + POST /respond) | role-match |
| `supabase/migrations/001_create_tables.sql` | migration | CRUD | RESEARCH §Phase 1 Database Schema | exact |
| `supabase/migrations/002_seed_template.sql` | migration | transform | RESEARCH Open Question 3 | role-match |
| `types/database.ts` | config | — | `supabase gen types typescript` (generated, not hand-authored) | exact |
| `types/index.ts` | config | — | app-level re-exports from database.ts | role-match |
| `vitest.config.ts` | config | — | RESEARCH §Validation Architecture | exact |
| `tests/utils/currency.test.ts` | test | transform | RESEARCH §Phase Requirements → Test Map (BUDG-01) | exact |
| `tests/utils/token.test.ts` | test | request-response | RESEARCH §Phase Requirements → Test Map (RSVP-03) | exact |
| `tests/utils/rsvp.test.ts` | test | request-response | RESEARCH §Phase Requirements → Test Map (D-06) | exact |
| `tests/schemas/auth.test.ts` | test | request-response | RESEARCH §Phase Requirements → Test Map (AUTH-01) | exact |
| `tests/schemas/checklist.test.ts` | test | CRUD | RESEARCH §Phase Requirements → Test Map (DISC-07) | exact |

---

## Pattern Assignments

### `middleware.ts` (middleware, request-response)

**Source:** RESEARCH.md `### Pattern 3: Middleware`

**Full pattern** (RESEARCH.md lines 479–519):
```typescript
// middleware.ts  (Next.js 15 — NOT proxy.ts which is Next.js 16)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // NEVER getSession() here — use getUser() only
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Planner note:** Middleware performs session refresh only. All route protection logic (role redirects) is layered on top with route-specific checks. Do not add business logic here.

---

### `lib/supabase/server.ts` (utility, request-response)

**Source:** RESEARCH.md `### Pattern 1: Supabase Server Client`

**Full pattern** (RESEARCH.md lines 401–433):
```typescript
// lib/supabase/server.ts
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
        getAll() { return cookieStore.getAll() },
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

**Planner note:** Used in all Server Components, Server Actions, and protected Route Handlers. `await cookies()` is mandatory — Next.js 15 async API.

---

### `lib/supabase/client.ts` (utility, request-response)

**Source:** RESEARCH.md `### Pattern 1` (browser variant)

**Pattern to implement:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Planner note:** Only used in `'use client'` components that need to read Supabase data without a Server Action round-trip (e.g., real-time subscriptions, TanStack Query client fetches). Most data fetching goes through Server Components or Server Actions — use this sparingly.

---

### `lib/supabase/service.ts` (utility, request-response)

**Source:** RESEARCH.md Architecture Decisions — service role key is server-only, never NEXT_PUBLIC_

**Pattern to implement:**
```typescript
// lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export function createServiceClient() {
  // Service role bypasses RLS — ONLY for public Route Handlers that need it
  // (RSVP token lookup, invitation token accept)
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // NEVER NEXT_PUBLIC_ prefix
  )
}
```

**Planner note:** Restricted to `app/api/rsvp/[token]/search/route.ts`, `app/api/rsvp/[token]/respond/route.ts`, and `app/api/invitations/[token]/accept/route.ts`. Any Server Action that receives an authenticated user must use `lib/supabase/server.ts` instead.

---

### `lib/dal.ts` (utility, request-response)

**Source:** RESEARCH.md `### Pattern 2: DAL verifySession()`

**Full pattern** (RESEARCH.md lines 439–473):
```typescript
// lib/dal.ts
import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  // getUser() not getSession() — validates against Auth server
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

**Planner note:** Every Server Action and protected Route Handler calls `verifySession()` as its first line, independently of middleware. This is the dual auth layer — middleware does UX redirect, DAL does security verification.

---

### `lib/utils.ts` (utility, transform)

**Source:** RESEARCH.md `### Pattern 5: INTEGER Centavos — Currency Utilities`

**Full pattern** (RESEARCH.md lines 556–579):
```typescript
// lib/utils.ts
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

**Planner note:** Also import `cn()` utility from shadcn/ui (`clsx` + `tailwind-merge`) which shadcn/ui init generates automatically. Keep both utilities in this file.

---

### `lib/checklist-template.ts` (utility, transform)

**Source:** RESEARCH.md Open Question 3 — "Hardcode template items as a TypeScript constant"

**Pattern to implement:**
```typescript
// lib/checklist-template.ts
// CONTEXT.md D-11/D-12: 14 supplier categories + Personal Tasks group
// Loaded on demand by app/actions/checklist.ts loadTemplate()

export interface TemplateItem {
  category: string
  title: string
  item_type: 'supplier_task' | 'personal_task'
  sort_order: number
}

export const CHECKLIST_TEMPLATE: TemplateItem[] = [
  // Photography
  { category: 'Photography', title: 'Book photographer', item_type: 'supplier_task', sort_order: 1 },
  // Videography
  { category: 'Videography', title: 'Book videographer', item_type: 'supplier_task', sort_order: 2 },
  // ... (all 14 supplier categories from D-11)
  // Personal Tasks — Legal documents (D-12)
  { category: 'Personal Tasks', title: 'Marriage license application', item_type: 'personal_task', sort_order: 100 },
  { category: 'Personal Tasks', title: 'CENOMAR (PSA)', item_type: 'personal_task', sort_order: 101 },
  // ... Pre-Cana, Day-of items (D-12 full list)
]
```

**Planner note:** The `loadTemplate()` Server Action in `app/actions/checklist.ts` calls `verifySession()`, then bulk-inserts these rows as `checklist_items` owned by the authenticated user's event. Template does NOT auto-load (D-13) — user triggers it via button click.

---

### `app/(auth)/layout.tsx` + Auth Pages (layout, request-response)

**Source:** RESEARCH.md Architecture Patterns — auth group redirects authenticated users away

**Layout pattern to implement:**
```typescript
// app/(auth)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')  // already authenticated
  }

  return <>{children}</>
}
```

**Auth page pattern** (signup/login — RESEARCH Pattern 4 for Zod schema):
```typescript
// app/(auth)/signup/page.tsx  (login follows the same structure)
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { signUp } from '@/app/actions/auth'  // Server Action

const signUpSchema = z.object({
  email: z.string().email(),  // Zod v4: z.string().email() still works
  password: z.string().min(8, 'Minimum 8 characters'),
  consent: z.boolean().refine(v => v === true, 'You must accept the privacy policy'),
})

// Form renders shadcn/ui <Form> with zodResolver — see RESEARCH Pattern 4
// Privacy consent checkbox is REQUIRED (RA 10173 — RESEARCH §Security Domain)
```

**Planner note:** Signup form MUST include a privacy consent checkbox per Philippine Data Privacy Act (RA 10173). The `consent_given_at` timestamptz column must be in the `profiles` table migration.

---

### `app/(client)/layout.tsx` (layout, request-response)

**Source:** RESEARCH.md Pattern 2 — `assertRole('client')`

**Pattern to implement:**
```typescript
// app/(client)/layout.tsx
import { assertRole } from '@/lib/dal'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await assertRole('client')  // redirects to /login if not authenticated or wrong role
  return <>{children}</>
}
```

---

### `app/(client)/dashboard/page.tsx` (page, CRUD)

**Source:** RESEARCH.md Architecture Responsibility Map (dashboard row) + Pitfall 6

**Pattern to implement:**
```typescript
// app/(client)/dashboard/page.tsx — Server Component shell
import { assertRole } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { CountdownWidget } from '@/components/dashboard/CountdownWidget'  // 'use client'

export default async function DashboardPage() {
  await assertRole('client')
  const supabase = await createClient()

  // Fetch event data server-side
  const { data: event } = await supabase
    .from('events')
    .select('*, event_locations(*)')
    .single()

  if (!event) {
    // D-03: Empty state — no event yet
    return <DashboardEmptyState />  // shows "Create your event" CTA
  }

  return (
    <div>
      {/* Pass event_date as prop — CountdownWidget is 'use client' (Pitfall 6) */}
      <CountdownWidget eventDate={event.event_date} />
      {/* Checklist %, budget summary — server-fetched */}
    </div>
  )
}
```

---

### `app/onboarding/page.tsx` (page, CRUD)

**Source:** RESEARCH.md Wave 0 step 10 + zustand for wizard state

**Pattern to implement:**
```typescript
// app/onboarding/page.tsx
// Multi-step wizard: Step 1 = event date + time, Step 2 = first location
// Uses zustand store for step state (client-side only)
// Final submit = Server Action createEvent() → redirect to /dashboard
'use client'
import { useOnboardingStore } from '@/lib/stores/onboarding'  // zustand store

// Step 1 schema (RESEARCH Pattern 4):
// z.object({ event_date: z.string().min(1), event_time: z.string().optional() })

// Wizard flow:
// 1. Render step N based on store
// 2. On "Next", validate with zodResolver, advance store step
// 3. On final "Finish", call Server Action createEvent(formData) → redirect('/dashboard')
```

**Planner note:** Wizard stores intermediate step data in zustand (not server) to avoid partial DB writes mid-wizard. Only the final submit hits the Server Action.

---

### `app/rsvp/[token]/page.tsx` (page, request-response)

**Source:** RESEARCH.md `## Code Examples: RSVP Deadline Gate`

**Full pattern** (RESEARCH.md lines 929–958):
```typescript
// app/rsvp/[token]/page.tsx
export default async function RSVPPage({
  params,
}: {
  params: Promise<{ token: string }>  // Next.js 15: async params
}) {
  const { token } = await params
  const supabase = createServiceClient()  // anon is fine here; service for RLS bypass

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
    return <RSVPClosedPage event={event} />   // D-09: shows location, motif, attire photos
  }

  return <RSVPOpenPage event={event} token={token} />
}
```

**Planner note:** This page is OUTSIDE all auth route groups. No `verifySession()` — token is the only authorization. Uses service client to look up token, then anon queries for guest search and RSVP submission go through Route Handlers.

---

### `app/api/rsvp/[token]/search/route.ts` (route, request-response)

**Source:** RESEARCH.md `### Pattern 6: RSVP Route Handler`

**Full pattern** (RESEARCH.md lines 584–623):
```typescript
// app/api/rsvp/[token]/search/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }  // Next.js 15: params is async
) {
  const { token } = await params
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.length < 2) return NextResponse.json({ guests: [] })

  const supabase = createServiceClient()  // service bypasses RLS for token lookup

  const { data: tokenRow } = await supabase
    .from('rsvp_tokens')
    .select('event_id, rsvp_deadline')
    .eq('token', token)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })

  const { data: guests } = await supabase
    .from('guests')
    .select('id, full_name, nickname, has_plus_one')
    .eq('event_id', tokenRow.event_id)
    .or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%`)
    .limit(5)

  return NextResponse.json({ guests: guests ?? [] })
}
```

**Planner note:** D-05 nickname field is included in the search. Return minimal fields only — no contact info exposed to unauthenticated callers.

---

### `app/api/rsvp/[token]/respond/route.ts` (route, CRUD)

**Source:** RESEARCH.md Pattern 6 (POST variant) + D-08 (RSVP notification email)

**Pattern to implement:**
```typescript
// app/api/rsvp/[token]/respond/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()
  const supabase = createServiceClient()

  // 1. Validate token + check deadline (D-06)
  // 2. Validate guest_id belongs to this event (security — RESEARCH §Security Domain)
  // 3. UPSERT rsvp_responses with responded_at = now() (D-07)
  // 4. Send Resend notification email to event owner (D-08)
  //    — import RsvpNotification email template
  //    — resend.emails.send(...)

  return NextResponse.json({ ok: true })
}
```

---

### `app/api/invitations/[token]/accept/route.ts` (route, CRUD)

**Source:** RESEARCH.md Pattern 6 (structure) + RESEARCH Wave 6

**Pattern to implement:**
```typescript
// app/api/invitations/[token]/accept/route.ts
// POST — authenticated user accepts co-planner invitation
// 1. verifySession() — invitee must be logged in
// 2. Look up invitation by token (service client)
// 3. Mark status = 'accepted', set user_id = authenticated user.id
// 4. Redirect to /dashboard
```

---

### `app/actions/auth.ts` (server-action, request-response)

**Source:** RESEARCH.md Pattern 2 (verifySession) + Supabase Auth API

**Pattern to implement:**
```typescript
// app/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/onboarding')
}

export async function signIn(formData: FormData) { /* ... */ }

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  // supabase.auth.resetPasswordForEmail(email, { redirectTo: '/update-password' })
}
```

---

### `app/actions/events.ts` (server-action, CRUD)

**Source:** RESEARCH.md Pattern 2 + Pattern 5 (centavos) + Code Example: Currency Input

**Pattern to implement:**
```typescript
// app/actions/events.ts
'use server'
import { verifySession } from '@/lib/dal'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { phpToCentavos } from '@/lib/utils'

export async function createEvent(formData: FormData) {
  const user = await verifySession()  // DAL call — independent of middleware
  const supabase = await createClient()

  await supabase.from('events').insert({
    client_id: user.id,
    event_date: formData.get('event_date') as string,
    total_budget: phpToCentavos(parseFloat(formData.get('total_budget') as string)),
    // color_motif, rsvp_deadline, etc. (D-10)
  })

  revalidatePath('/dashboard')
}
```

---

### `app/actions/budget.ts` (server-action, CRUD)

**Source:** RESEARCH.md `## Code Examples: Currency Input → DB Storage`

**Full pattern** (RESEARCH.md lines 904–924):
```typescript
// app/actions/budget.ts
'use server'
export async function createExpense(formData: FormData) {
  const user = await verifySession()

  const rawAmount = parseFloat(formData.get('total_amount') as string)
  const rawDeposit = parseFloat(formData.get('deposit_paid') as string)

  // Convert to centavos — NEVER store float
  const totalAmountCentavos = Math.round(rawAmount * 100)
  const depositPaidCentavos = Math.round(rawDeposit * 100)
  const remainingCentavos = totalAmountCentavos - depositPaidCentavos

  const supabase = await createClient()
  await supabase.from('expenses').insert({
    total_amount: totalAmountCentavos,
    deposit_paid: depositPaidCentavos,
    remaining_balance: remainingCentavos,
  })
}
```

---

### `app/actions/invitations.ts` (server-action, event-driven)

**Source:** RESEARCH.md `## Code Examples: Co-planner Invitation Email`

**Full pattern** (RESEARCH.md lines 987–998):
```typescript
// app/actions/invitations.ts
'use server'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import { CoplannerInvite } from '@/emails/CoplannerInvite'
import { nanoid } from 'nanoid'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function inviteCoPlanner(formData: FormData) {
  const user = await verifySession()
  const token = nanoid(20)  // RESEARCH Standard Stack: nanoid(20) for tokens
  // 1. INSERT into event_invitations with token
  // 2. Send Resend email
  await resend.emails.send({
    from: 'EventMate <noreply@yourdomain.com>',
    to: formData.get('email') as string,
    subject: `You're invited to co-plan...`,
    html: await render(<CoplannerInvite ... />),
  })
}
```

---

### `emails/CoplannerInvite.tsx` (email-template, event-driven)

**Source:** RESEARCH.md `## Code Examples: Co-planner Invitation Email`

**Full pattern** (RESEARCH.md lines 965–985):
```typescript
// emails/CoplannerInvite.tsx
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
```

---

### `emails/RsvpNotification.tsx` (email-template, event-driven)

**Source:** RESEARCH.md Code Example: Co-planner Invitation Email (structure — same library pattern)

**Pattern to implement (same structure as CoplannerInvite):**
```typescript
// emails/RsvpNotification.tsx
import { Html, Body, Heading, Text, Preview } from '@react-email/components'

interface Props {
  guestName: string
  rsvpStatus: 'attending' | 'not_attending'
  respondedAt: string
  dashboardUrl: string
}

export function RsvpNotification({ guestName, rsvpStatus, respondedAt, dashboardUrl }: Props) {
  // D-08: Notify client when a guest RSVPs
}
```

---

### `components/dashboard/CountdownWidget.tsx` (component, request-response)

**Source:** RESEARCH.md Pitfall 6 — countdown MUST be a Client Component

**Pattern to implement:**
```typescript
// components/dashboard/CountdownWidget.tsx
'use client'  // MANDATORY — new Date() causes hydration mismatch in Server Component
import { differenceInDays } from 'date-fns'

interface Props {
  eventDate: string  // ISO date string passed from Server Component parent
}

export function CountdownWidget({ eventDate }: Props) {
  const daysLeft = differenceInDays(new Date(eventDate), new Date())
  return <div>{daysLeft} days until your wedding</div>
}
```

---

### `components/budget/CurrencyInput.tsx` (component, transform)

**Source:** RESEARCH.md Pattern 5 + RESEARCH "Don't Hand-Roll" table (Philippine Peso formatting)

**Pattern to implement:**
```typescript
// components/budget/CurrencyInput.tsx
// User types in PHP (e.g., "50000") → displays formatted ₱50,000
// On submit, parent Server Action calls phpToCentavos() before DB insert
// Display existing values: centavosToPhp() before rendering
```

---

### `supabase/migrations/001_create_tables.sql` (migration, CRUD)

**Source:** RESEARCH.md `## Phase 1 Database Schema (Additions and Corrections)`

**Critical migration rules:**
1. Every monetary column must be `INTEGER` (not NUMERIC/DECIMAL) — RESEARCH Pitfall 3
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in the SAME migration as `CREATE TABLE` — never as a follow-up
3. Create the `user_can_access_event()` helper FIRST — all event-scoped RLS policies depend on it
4. `event_invitations` table is NEW (not in ARCHITECTURE.md) — include in this migration
5. `guests` table needs `nickname text` column (D-05)
6. `events` table needs `color_motif`, `attire_photo_1_path`, `attire_photo_2_path`, `rsvp_deadline` (D-10)
7. `profiles` table needs `consent_given_at timestamptz` (RA 10173)

**RLS helper function** (RESEARCH.md lines 729–742):
```sql
CREATE OR REPLACE FUNCTION public.user_can_access_event(evt_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events WHERE id = evt_id AND client_id = auth.uid()
    UNION
    SELECT 1 FROM event_invitations
    WHERE event_id = evt_id AND user_id = auth.uid() AND status = 'accepted'
  )
$$;
```

**RLS policy pattern for all event-scoped tables** (RESEARCH.md lines 738–742):
```sql
CREATE POLICY "event_participants_access_checklist"
ON checklist_items FOR ALL TO authenticated
USING (public.user_can_access_event(event_id))
WITH CHECK (public.user_can_access_event(event_id));
```

**event_invitations table** (RESEARCH.md lines 689–714):
```sql
CREATE TABLE event_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  invitee_email   text NOT NULL,
  user_id         uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  invitation_token text NOT NULL UNIQUE,
  invited_at      timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  UNIQUE(event_id, invitee_email)
);
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;
```

---

### `supabase/migrations/002_seed_template.sql` (migration, transform)

**Source:** RESEARCH.md Open Question 3 — recommendation is TypeScript constant, not SQL seed

**Planner note:** RESEARCH.md recommends hardcoding the template as a TypeScript constant in `lib/checklist-template.ts` rather than a SQL seed migration. The `002_seed_template.sql` migration may be skipped entirely. The `loadTemplate()` Server Action inserts these rows when the user clicks the template button (D-13). If a SQL seed is still desired for dev data, it can insert developer test accounts only — not template items.

---

### `vitest.config.ts` + Test Files (config/test)

**Source:** RESEARCH.md `## Validation Architecture`

**Test framework install:**
```bash
npm install -D vitest @testing-library/react jsdom
```

**Test file pattern** (RESEARCH.md §Phase Requirements → Test Map):
```typescript
// tests/utils/currency.test.ts  (BUDG-01)
import { describe, it, expect } from 'vitest'
import { phpToCentavos, centavosToPhp, formatPHP } from '@/lib/utils'

describe('currency utilities', () => {
  it('phpToCentavos(50000) returns 5000000', () => {
    expect(phpToCentavos(50000)).toBe(5000000)
  })
  it('formatPHP(5000000) returns "₱ 50,000"', () => {
    expect(formatPHP(5000000)).toMatch(/50,000/)
  })
})
```

---

## Shared Patterns

### Dual Auth Layer
**Apply to:** Every Server Action and every protected Route Handler — no exceptions

**Source:** RESEARCH.md `### Pattern 2: DAL verifySession()`

```typescript
// First line of every Server Action and protected Route Handler:
const user = await verifySession()  // from '@/lib/dal'
// For role-specific pages, use assertRole('client') in layout.tsx
```

### Next.js 15 Async APIs
**Apply to:** All Server Components, Route Handlers, and Server Actions that use `cookies()`, `params`, or `searchParams`

**Source:** RESEARCH.md Pitfall 8

```typescript
// Route Handlers and dynamic pages:
const { token } = await params           // NOT params.token directly
const cookieStore = await cookies()      // NOT cookies() synchronously

// Run codemod after bootstrap to catch all occurrences:
// npx @next/codemod@canary next-async-request-api .
```

### Zod v4 + react-hook-form Integration
**Apply to:** All form components with validation

**Source:** RESEARCH.md `### Pattern 4: Zod v4 Schema`

```typescript
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'  // v5.x required for Zod v4
import { useForm } from 'react-hook-form'

const schema = z.object({
  email: z.string().email(),
  // NOTE: z.string().email() still works in Zod v4
  // Use @hookform/resolvers@5.4.0 (not v3)
})

const form = useForm({ resolver: zodResolver(schema) })
```

### INTEGER Centavos (All Monetary Values)
**Apply to:** All DB schema columns, Server Actions handling money, all display components

**Source:** RESEARCH.md Pitfall 3 + Pattern 5

- **Store:** always `phpToCentavos(userInput)` before INSERT
- **Display:** always `formatPHP(centavosFromDB)` at render time
- **Schema:** always `INTEGER` column type, never `NUMERIC` or `DECIMAL`

### shadcn/ui Form Pattern
**Apply to:** All form pages (auth, onboarding, checklist, budget, guest, invitation)

```typescript
// Standard shadcn/ui Form structure:
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
// Add components via: npx shadcn@latest add [component-name]
// See RESEARCH.md Standard Stack §Installation for full component list
```

### RLS on Every Table
**Apply to:** `supabase/migrations/001_create_tables.sql` — every CREATE TABLE

```sql
-- Immediately after every CREATE TABLE:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- Then add policies in the same migration block
```

### `getUser()` Not `getSession()`
**Apply to:** All server-side code — middleware, Server Actions, Route Handlers, DAL

**Source:** RESEARCH.md Pitfall 4

```typescript
// Always:
const { data: { user } } = await supabase.auth.getUser()
// Never:
const { data: { session } } = await supabase.auth.getSession()  // DO NOT USE
```

---

## No Analog Found

All files in Phase 1 have no existing codebase analog because this is a greenfield project. All patterns above are sourced from `.planning/phases/01-foundation-planning-tools/01-RESEARCH.md` named patterns and code examples.

The following files have no direct RESEARCH.md pattern — planner should derive structure from the architectural context and general Next.js/Supabase conventions:

| File | Role | Data Flow | Derive From |
|------|------|-----------|-------------|
| `app/(client)/event/checklist/page.tsx` | page | CRUD | RESEARCH Wave 1 description; shadcn/ui Checkbox + drag-order |
| `app/(client)/event/files/page.tsx` | page | file-I/O | RESEARCH Wave 3; react-dropzone docs + Supabase Storage signed URL |
| `app/invite/[token]/page.tsx` | page | request-response | RESEARCH Wave 6; similar structure to rsvp/[token]/page.tsx but authenticated |
| `components/guests/` | component | CRUD | RESEARCH Wave 4; @tanstack/react-table for guest list |
| `components/rsvp/RSVPOpenPage.tsx` | component | request-response | RESEARCH Pattern 6 (client-side calls to /api/rsvp/[token]/search + /respond) |
| `types/database.ts` | config | — | Generated: `supabase gen types typescript --local > types/database.ts` |
| `types/index.ts` | config | — | Re-export from database.ts + app-specific derived types |

---

## Metadata

**Pattern sources searched:**
- `.planning/phases/01-foundation-planning-tools/01-RESEARCH.md` — primary source (all 6 named patterns + code examples)
- `.planning/research/ARCHITECTURE.md` — database schema reference
- `CLAUDE.md` — 8 locked architecture decisions

**Files scanned:** 0 (greenfield — no source files exist)
**Pattern extraction date:** 2026-06-18
