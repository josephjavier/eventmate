# Architecture Patterns

**Project:** EventMate
**Domain:** Wedding / event planning platform
**Researched:** 2026-06-11
**Overall confidence:** HIGH (stack is well-documented; patterns are derived from official Next.js 15 docs + Supabase fundamentals + domain analysis of PROJECT.md)

---

## Recommended Architecture

EventMate is structured as a **multi-role Next.js application backed by a single Supabase project**. All data lives in PostgreSQL. Auth is handled by Supabase Auth. Row-Level Security enforces data ownership. The frontend is organized into four distinct access surfaces using Next.js App Router route groups.

```
Browser
  │
  ├── (public)          No auth — landing, supplier browse, RSVP
  ├── (client)          Supabase session required + role = 'client'
  ├── (supplier)        Supabase session required + role = 'supplier'
  └── (admin)           Supabase session required + role = 'admin'
         │
         ▼
   middleware.ts         Optimistic route guard (cookie check → redirect)
         │
         ▼
   Server Components     Fetch data server-side via Supabase server client
         │
         ├── lib/dal.ts  Data Access Layer — verifySession(), role assertions
         ├── Server Actions — mutations (create/update/delete)
         └── Route Handlers
               ├── /api/inquiry/[id]/ai   Gemini AI messages
               └── /api/rsvp/[token]      Public RSVP submissions
         │
         ▼
   Supabase
     ├── Auth            Session tokens, user creation
     ├── PostgreSQL      All data; RLS on every table
     └── Storage         Images (portfolio, receipts); PDFs (contracts)
```

---

## Core Data Model

### Entity Relationship Overview

```
auth.users (Supabase managed)
   └── profiles (1:1)  role: client | supplier | admin

profiles [client]
   └── events (1:1 for v1)
         ├── event_locations (1:N)      ceremony, reception, etc.
         ├── checklist_items (1:N)      supplier_task | personal_task
         ├── budget_categories (1:N)    per-category allocations
         │     └── expenses (1:N)       deposit + balance per supplier
         │           └── receipt_files (1:N)
         ├── guests (1:N)
         │     └── rsvp_responses (1:1)
         ├── rsvp_tokens (1:1)          public share link secret
         ├── event_files (1:N)          contracts, quotations not tied to expense
         └── inquiries (1:N)
               └── inquiry_messages (1:N)

profiles [supplier]
   └── suppliers (1:1)
         ├── supplier_categories (N:M)  via supplier_category_map
         ├── packages (1:N)
         │     └── package_addons (1:N)
         ├── portfolio_photos (1:N)
         ├── blocked_dates (1:N)        availability calendar
         ├── inquiries (1:N)            received from clients
         └── bookings (1:N)            confirmed bookings
               └── reviews (1:1)        client post-event review
                     └── review_replies (1:1)  supplier reply
```

### Table Definitions

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK → auth.users.id, PK |
| role | text | 'client' \| 'supplier' \| 'admin' |
| full_name | text | |
| avatar_url | text | Supabase Storage URL |
| created_at | timestamptz | |

Auto-created by trigger on `auth.users` insert. Role set at creation time (client = self-signup; supplier = admin-created; admin = manual).

#### `events`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| client_id | uuid | FK → profiles.id |
| title | text | e.g. "John & Jane Wedding" |
| event_type | text | 'wedding' (v1 only) |
| event_date | date | |
| event_time | time | |
| total_budget | numeric | ₱ |
| meal_preference_enabled | boolean | for RSVP flow |
| created_at | timestamptz | |

One event per client in v1. Enforced via unique constraint on `client_id`.

#### `event_locations`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| label | text | 'Ceremony', 'Reception' |
| venue_name | text | |
| address | text | |
| time | time | optional per-location time |
| sort_order | int | |

#### `checklist_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| item_type | text | 'supplier_task' \| 'personal_task' |
| title | text | |
| category | text | 'Photography', 'Venue', etc. |
| status | text | supplier_task: 'Pending' \| 'Inquired' \| 'Booked'; personal_task: 'Pending' \| 'Done' |
| supplier_id | uuid | nullable; FK → suppliers.id (platform supplier) |
| offline_supplier_name | text | nullable; manual offline entry |
| offline_supplier_contact | text | nullable |
| offline_supplier_notes | text | nullable |
| due_date | date | nullable |
| sort_order | int | |
| is_template | boolean | false for user items; true for seeded defaults |

Status transitions: Pending → Inquired (when inquiry created) → Booked (when booking confirmed, triggered by supplier action).

#### `budget_categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| name | text | 'Photography', 'Catering', etc. |
| allocated_amount | numeric | ₱ |
| sort_order | int | |

#### `expenses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| budget_category_id | uuid | FK → budget_categories.id |
| event_id | uuid | FK → events.id (denormalized for simpler RLS) |
| description | text | |
| total_amount | numeric | full package price |
| deposit_paid | numeric | |
| remaining_balance | numeric | computed or stored |
| balance_due_date | date | nullable |
| supplier_id | uuid | nullable; FK → suppliers.id |
| checklist_item_id | uuid | nullable; FK → checklist_items.id |
| created_at | timestamptz | |

#### `receipt_files`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| expense_id | uuid | nullable; FK → expenses.id |
| file_name | text | |
| storage_path | text | Supabase Storage path |
| file_type | text | 'image' \| 'pdf' |
| uploaded_at | timestamptz | |

#### `guests`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id |
| name | text | |
| has_plus_one | boolean | |
| plus_one_name | text | nullable; filled after RSVP |
| created_at | timestamptz | |

#### `rsvp_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| event_id | uuid | FK → events.id, unique |
| token | text | unique, URL-safe random string |
| created_at | timestamptz | |

#### `rsvp_responses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| guest_id | uuid | FK → guests.id |
| event_id | uuid | FK → events.id |
| status | text | 'going' \| 'not_going' \| 'pending' |
| meal_preference | text | nullable |
| plus_one_name | text | nullable |
| plus_one_meal_preference | text | nullable |
| plus_one_status | text | nullable |
| responded_at | timestamptz | |

#### `suppliers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| profile_id | uuid | FK → profiles.id, unique |
| business_name | text | |
| description | text | |
| service_area | text | city/region |
| contact_email | text | |
| contact_phone | text | |
| social_links | jsonb | {facebook, instagram, website} |
| is_active | boolean | admin-controlled |
| created_at | timestamptz | |

#### `supplier_categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | text | 'Photography', 'Catering', etc. |
| sort_order | int | |

#### `supplier_category_map`
| Column | Type | Notes |
|--------|------|-------|
| supplier_id | uuid | FK → suppliers.id |
| category_id | uuid | FK → supplier_categories.id |
| (PK: both columns) | | |

#### `packages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| supplier_id | uuid | FK → suppliers.id |
| name | text | |
| description | text | |
| price | numeric | nullable if starting_at = true |
| starting_at | boolean | 'starting at ₱X' display |
| is_active | boolean | |

#### `package_addons`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| package_id | uuid | FK → packages.id |
| name | text | |
| price | numeric | |

#### `portfolio_photos`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| supplier_id | uuid | FK → suppliers.id |
| storage_path | text | Supabase Storage |
| caption | text | nullable |
| sort_order | int | |

#### `blocked_dates`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| supplier_id | uuid | FK → suppliers.id |
| blocked_date | date | |
| note | text | nullable; e.g. "Already booked" |

#### `inquiries`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| client_id | uuid | FK → profiles.id |
| supplier_id | uuid | FK → suppliers.id |
| event_id | uuid | FK → events.id |
| status | text | 'open' \| 'booked' \| 'declined' |
| ai_message_count | int | for rate limiting |
| created_at | timestamptz | |

One inquiry per (client, supplier) pair per event.

#### `inquiry_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| inquiry_id | uuid | FK → inquiries.id |
| sender_type | text | 'client' \| 'supplier' \| 'ai' |
| sender_id | uuid | nullable for AI messages |
| content | text | |
| created_at | timestamptz | |

#### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| inquiry_id | uuid | FK → inquiries.id |
| client_id | uuid | FK → profiles.id |
| supplier_id | uuid | FK → suppliers.id |
| event_id | uuid | FK → events.id |
| package_id | uuid | nullable; FK → packages.id |
| booked_date | date | auto-copied from event.event_date |
| confirmed_at | timestamptz | |

Creating a booking triggers:
- supplier's blocked_dates insert for that date
- inquiry.status → 'booked'
- linked checklist_item.status → 'Booked' (via checklist_item_id on the inquiry or expense)

#### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| booking_id | uuid | FK → bookings.id, unique |
| client_id | uuid | FK → profiles.id |
| supplier_id | uuid | FK → suppliers.id |
| rating | int | 1–5 |
| body | text | |
| created_at | timestamptz | |

Insert gated: event.event_date must be in the past + booking must be confirmed.

#### `review_replies`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| review_id | uuid | FK → reviews.id, unique |
| supplier_id | uuid | FK → suppliers.id |
| content | text | |
| created_at | timestamptz | |

---

## Component Boundaries

| Component | Location | Responsibility | Communicates With |
|-----------|----------|---------------|-------------------|
| Auth Layer | `middleware.ts` + `lib/dal.ts` | Session validation, role-based redirect | Supabase Auth cookies |
| Client Portal | `app/(client)/` | All client-facing dashboards and management | DAL, Server Actions, Supabase |
| Supplier Portal | `app/(supplier)/` | Supplier dashboard, inquiries, profile | DAL, Server Actions, Supabase |
| Admin Panel | `app/(admin)/` | Supplier onboarding, platform management | DAL, Server Actions, Supabase |
| Public Layer | `app/(public)/` | Landing, supplier browse, supplier profiles | Supabase (anon client, read-only) |
| RSVP Page | `app/(public)/rsvp/[token]/` | Guest RSVP flow | Supabase anon client (read guests, write rsvp_responses) |
| AI Inquiry Handler | `app/api/inquiry/[id]/ai/route.ts` | Gemini API orchestration | Supabase (service role for AI writes), Gemini API |
| DAL | `lib/dal.ts` | `verifySession()`, `getCurrentUser()`, role assertion | Supabase server client |
| Server Actions | `app/actions/*.ts` | All data mutations | DAL (for auth check), Supabase server client |
| Supabase Auth | External | User accounts, JWT tokens | Next.js middleware via cookie |
| Supabase DB | External | All data with RLS | Server Components, Server Actions, Route Handlers |
| Supabase Storage | External | Files (images, PDFs) | Server Actions (signed URLs), public bucket for portfolio photos |
| Gemini API | External | AI message generation | AI Inquiry Route Handler only |

**Boundary rules:**
- Client Components never call Supabase directly — they invoke Server Actions or read data passed from Server Components as props.
- The AI Route Handler is the only place that calls Gemini. It also uses the Supabase service role client to write AI messages (bypasses RLS for the AI sender).
- Supplier portfolio photos use a public Supabase Storage bucket; all other files use signed URLs via authenticated server endpoints.
- The RSVP page uses the Supabase anon client. No authenticated session is required. Token lookup is the authorization mechanism.

---

## Data Flow: AI Inquiry Feature

```
Client Browser
  │
  │  1. Client visits /suppliers/[id] — Server Component fetches supplier
  │     profile, packages, availability (public read)
  │
  │  2. Client clicks "Send Inquiry" → Server Action creates inquiry row
  │     (if not exists) and first inquiry_message row
  │
  │  3. Client types a message in the chat UI (Client Component)
  │
  │  4. POST /api/inquiry/[inquiryId]/ai   ← Route Handler
  │        │
  │        ├── a. Verify session + confirm client owns this inquiry
  │        │       (DAL.verifySession + query inquiries.client_id = auth.uid())
  │        │
  │        ├── b. Check rate limit:
  │        │       SELECT ai_message_count FROM inquiries WHERE id = ?
  │        │       If count >= daily_limit → return 429
  │        │
  │        ├── c. Fetch context for Gemini prompt:
  │        │       - supplier.packages + package_addons (READ)
  │        │       - events (type, date, locations, budget) for client (READ)
  │        │       - inquiry_messages last 20 messages for thread history
  │        │
  │        ├── d. Build system prompt:
  │        │       "You are an assistant for [supplier]. They offer [packages].
  │        │        The client is planning a [type] wedding on [date] in [location]
  │        │        with a total budget of ₱[X]. You cannot confirm bookings."
  │        │
  │        ├── e. POST to Gemini API (gemini-1.5-flash)
  │        │       Request: system prompt + conversation history + new message
  │        │       Response: AI reply text
  │        │
  │        ├── f. INSERT into inquiry_messages:
  │        │       { inquiry_id, sender_type: 'ai', sender_id: null, content: reply }
  │        │       (uses service role client — bypasses RLS for AI writes)
  │        │
  │        ├── g. UPDATE inquiries SET ai_message_count = ai_message_count + 1
  │        │
  │        └── h. Return AI reply to browser
  │
  │  5. Supplier logs into their portal → sees the same inquiry thread
  │     Supplier types a manual reply → Server Action inserts inquiry_message
  │     with sender_type: 'supplier', sender_id: supplier.profile_id
  │
  │  6. Supplier clicks "Confirm Booking" → Server Action:
  │        - Creates bookings row
  │        - Inserts blocked_date for the event date
  │        - Updates inquiry.status → 'booked'
  │        - Updates linked checklist_item.status → 'Booked'
  │        - Optionally sends email notification (Resend)
```

**Rate limiting implementation:** Store `ai_message_count` per inquiry + a `ai_last_reset_at` timestamp. Reset count daily. Check at Route Handler entry; reject with 429 before calling Gemini.

**Why a Route Handler (not Server Action) for AI:** AI calls are async streaming candidates, need clean HTTP semantics for progressive response, and require service-role Supabase access (outside normal auth context) for writing AI messages.

---

## Data Flow: RSVP Link Feature (Public, No Login)

```
Client (event owner)
  │
  │  1. Client visits /event/guests (authenticated)
  │     Client clicks "Generate RSVP Link" → Server Action:
  │        - Check if rsvp_tokens row exists for event_id
  │        - If not: INSERT rsvp_tokens { event_id, token: randomURLsafeString() }
  │        - Return shareable URL: https://app.com/rsvp/[token]
  │
  │  2. Client shares the URL (WhatsApp, email, etc.)
  │
Guest Browser (no account, no login)
  │
  │  3. Guest opens /rsvp/[token]
  │     Server Component (anon Supabase client):
  │        - SELECT * FROM rsvp_tokens WHERE token = ? → get event_id
  │        - SELECT event.title, event.event_date, event.meal_preference_enabled
  │        - Render RSVP page with event name
  │
  │  4. Guest types their name → client-side search:
  │        - GET /api/rsvp/[token]/search?q=[name]   ← Route Handler
  │        - Anon client: SELECT guests WHERE event_id = ? AND name ILIKE ?
  │          (event_id derived from token lookup, not exposed to client)
  │        - Returns list of matching guest names + IDs
  │        - Guest selects their name from the list
  │
  │  5. Guest selects Going / Not Going
  │     If meal_preference_enabled: guest selects meal
  │     If has_plus_one: guest enters +1 name + status + meal
  │
  │  6. Guest submits → POST /api/rsvp/[token]/respond   ← Route Handler
  │        - Validate token → event_id
  │        - Validate guest_id belongs to that event
  │        - UPSERT rsvp_responses { guest_id, event_id, status, meal_preference, ... }
  │        - Return success
  │
  │  7. Client sees live RSVP summary at /event/guests (authenticated)
  │        - Going / Not Going / No Response counts
  │        - Per-guest status with manual override option
```

**Security note for RSVP:** The token is the authorization mechanism for the public route. The Route Handler validates that `guest_id` belongs to the event associated with that token before writing. The anon Supabase client can only SELECT from `rsvp_tokens` (to validate the token) and INSERT into `rsvp_responses`. All other tables are not accessible by anon.

**Why Route Handlers for RSVP (not Server Actions):** RSVP is a public, unauthenticated flow. Server Actions require no session but they're still POST-only; Route Handlers give cleaner control for the name search (GET) and the RSVP submit (POST) without mixing auth contexts.

---

## Row-Level Security Strategy

### Role Resolution

Store role in `profiles.role`. Expose it to RLS via a security-definer function to avoid recursive RLS loops:

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;
```

This function is called inside RLS policies: `public.get_my_role() = 'admin'`.

### Policy Matrix

| Table | anon SELECT | authenticated SELECT | INSERT | UPDATE | DELETE |
|-------|-------------|---------------------|--------|--------|--------|
| profiles | NO | own row OR admin | via trigger only | own row OR admin | admin only |
| events | NO | own (client_id = uid) OR admin | authenticated client | own OR admin | own OR admin |
| event_locations | NO | via events join | own event | own event | own event |
| checklist_items | NO | via events join | own event | own event | own event |
| budget_categories | NO | via events join | own event | own event | own event |
| expenses | NO | via events join | own event | own event | own event |
| receipt_files | NO | via events join | own event | own event | own event |
| guests | NO | own event (client) OR admin | own event | own event | own event |
| rsvp_tokens | YES (token only) | own event | own event | NO | NO |
| rsvp_responses | NO | own event (client) OR admin | anon (valid token) | NO | NO |
| suppliers | YES (active only) | YES (active only) | admin only | own profile OR admin | admin only |
| supplier_categories | YES | YES | admin only | admin only | admin only |
| supplier_category_map | YES | YES | own supplier OR admin | NO | own supplier OR admin |
| packages | YES (active supplier) | YES | own supplier | own supplier | own supplier |
| package_addons | YES | YES | own supplier | own supplier | own supplier |
| portfolio_photos | YES | YES | own supplier | own supplier | own supplier |
| blocked_dates | YES | YES | own supplier | own supplier | own supplier |
| inquiries | NO | (client = uid) OR (supplier belongs to uid) OR admin | authenticated client | own or own supplier | NO |
| inquiry_messages | NO | via inquiries join | authenticated participants | NO | NO |
| bookings | NO | via client_id OR via supplier_id | service role only (triggered by supplier action) | NO | NO |
| reviews | YES | YES | client with confirmed booking, post-event date | NO | NO |
| review_replies | YES | YES | own supplier, one per review | own supplier | NO |

### Key RLS Patterns

**Pattern 1: Owner access via foreign key join**
```sql
-- Events: client can only see their own
CREATE POLICY "clients_own_events"
ON events FOR SELECT
TO authenticated
USING (client_id = auth.uid());

-- Checklist items: derived from event ownership
CREATE POLICY "clients_own_checklist"
ON checklist_items FOR SELECT
TO authenticated
USING (
  event_id IN (
    SELECT id FROM events WHERE client_id = auth.uid()
  )
);
```

**Pattern 2: Inquiry access for both parties**
```sql
CREATE POLICY "inquiry_participants_select"
ON inquiries FOR SELECT
TO authenticated
USING (
  client_id = auth.uid()
  OR
  supplier_id IN (
    SELECT id FROM suppliers WHERE profile_id = auth.uid()
  )
  OR
  public.get_my_role() = 'admin'
);
```

**Pattern 3: Public RSVP — anon INSERT with token validation**
```sql
-- rsvp_tokens: anon can read to validate token
CREATE POLICY "anon_read_rsvp_tokens"
ON rsvp_tokens FOR SELECT
TO anon
USING (true);  -- token is the secret; return only event_id

-- rsvp_responses: anon can insert (validated at Route Handler level)
CREATE POLICY "anon_insert_rsvp_responses"
ON rsvp_responses FOR INSERT
TO anon
WITH CHECK (true);  -- business logic validation in Route Handler
```

The Route Handler is responsible for validating that the guest_id belongs to the event from the token before calling the Supabase insert. Do not rely on RLS alone for this join validation — it is enforced at the application layer.

**Pattern 4: Suppliers visible to all authenticated users and anon**
```sql
CREATE POLICY "public_read_active_suppliers"
ON suppliers FOR SELECT
TO anon, authenticated
USING (is_active = true);
```

**Pattern 5: Admin bypass**
```sql
CREATE POLICY "admin_full_access_suppliers"
ON suppliers FOR ALL
TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');
```

### Service Role Usage

The AI Route Handler uses the Supabase **service role** client (server-only, never in browser) to write AI messages and update rate limit counters. This bypasses RLS intentionally — the Route Handler itself performs the authorization check (session ownership of the inquiry) before using the service client. Keep the service key strictly in server environment variables.

---

## Next.js App Router File Structure

```
app/
├── (public)/
│   ├── layout.tsx               No auth required
│   ├── page.tsx                 Landing/marketing
│   └── suppliers/
│       ├── page.tsx             Supplier discovery (browse, filter, search)
│       └── [supplierId]/
│           └── page.tsx         Public supplier profile
│
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
│
├── rsvp/
│   └── [token]/
│       └── page.tsx             Public RSVP page — outside auth groups
│
├── (client)/
│   ├── layout.tsx               Verifies role = 'client'
│   ├── dashboard/page.tsx       Countdown, checklist %, budget summary
│   ├── event/
│   │   ├── setup/page.tsx       Create/edit event + locations
│   │   ├── checklist/page.tsx
│   │   ├── budget/page.tsx
│   │   ├── guests/page.tsx
│   │   └── files/page.tsx
│   └── suppliers/
│       └── [supplierId]/
│           ├── page.tsx         Supplier profile (client view + inquiry UI)
│           └── inquire/page.tsx AI chat interface
│
├── (supplier)/
│   ├── layout.tsx               Verifies role = 'supplier'
│   ├── dashboard/page.tsx
│   ├── inquiries/
│   │   ├── page.tsx
│   │   └── [inquiryId]/page.tsx Thread view + manual reply + confirm booking
│   ├── availability/page.tsx    Blocked dates calendar
│   └── profile/
│       ├── page.tsx
│       └── packages/page.tsx
│
├── (admin)/
│   ├── layout.tsx               Verifies role = 'admin'
│   ├── dashboard/page.tsx
│   ├── suppliers/
│   │   ├── page.tsx
│   │   └── [supplierId]/page.tsx
│   ├── categories/page.tsx
│   └── clients/page.tsx
│
├── api/
│   ├── inquiry/
│   │   └── [inquiryId]/
│   │       └── ai/route.ts      Gemini orchestration
│   └── rsvp/
│       └── [token]/
│           ├── search/route.ts  Guest name search (GET)
│           └── respond/route.ts RSVP submission (POST)
│
├── actions/
│   ├── auth.ts
│   ├── events.ts
│   ├── checklist.ts
│   ├── budget.ts
│   ├── guests.ts
│   ├── suppliers.ts
│   ├── inquiries.ts
│   └── admin.ts
│
└── lib/
    ├── dal.ts                   verifySession(), getCurrentUser(), assertRole()
    ├── supabase/
    │   ├── server.ts            Server Component client (cookies)
    │   ├── client.ts            Browser client (for Client Components)
    │   └── service.ts           Service role client (AI handler only)
    └── gemini.ts                Gemini API wrapper
```

**Note on middleware:** In Next.js 15 (the target version), use `middleware.ts`. Next.js 16 renamed this to `proxy.ts` — migration is handled by a codemod when the project upgrades. The middleware pattern is identical; only the file name and function name change.

---

## Suggested Build Order

Dependencies flow top to bottom. A phase cannot start until the items it depends on exist.

### Layer 1 — Foundation (blocks everything)
- Supabase project setup: all tables, RLS policies, storage buckets
- Profiles table + trigger (auto-create on auth.users insert)
- `middleware.ts`: route protection by role
- `lib/dal.ts`: `verifySession()`, `getCurrentUser()`, `assertRole()`
- Supabase auth flows: client signup, supplier creation (admin), admin creation (manual seed)
- Route group layouts with role assertion

**Why first:** Every other feature requires auth + RLS + the profiles.role pattern.

### Layer 2 — Client Event Shell (blocks checklist, budget, guests)
- Event creation form + Server Action
- `event_locations` (ceremony/reception)
- Client dashboard shell: countdown, placeholder sections for checklist %, budget summary

**Why second:** Checklist, budget, and guests all require an `event_id` to attach to.

### Layer 3A — Checklist (depends on Layer 2)
- Template seeding (pre-built wedding checklist rows with `is_template = true`)
- Checklist CRUD (both item types)
- Offline supplier manual entry (name, contact, notes)
- Status display and manual status transitions

### Layer 3B — Budget (depends on Layer 2)
- Budget categories CRUD
- Expense entries (deposit + balance tracking)
- Supabase Storage: receipt/contract file upload + signed URL retrieval
- Dashboard budget summary computation

### Layer 3C — Admin Panel (depends on Layer 1 only)
- Admin creates supplier user account (Supabase Admin API → set role = 'supplier')
- Supplier activate/deactivate
- Category management
- Platform stats (client count, event count, inquiry count)

**Build 3A, 3B, 3C in parallel** — no dependencies between them.

### Layer 4 — Supplier System (depends on Layer 3C — admin must create suppliers first)
- Supplier profile setup (business info, categories, service area)
- Package + add-on management
- Portfolio photo upload (Supabase Storage, public bucket)
- Supplier profile public page

### Layer 5 — Supplier Discovery (depends on Layer 4)
- Public browse page (filter by category, location, price range)
- Search by name
- Availability filter (depends on blocked_dates, which depends on Layer 4)
- Client view of supplier profile

### Layer 6 — Inquiry + AI + Booking (depends on Layer 4 + Layer 2)
- Inquiry thread creation (client initiates)
- Supplier manual reply
- AI Route Handler (Gemini integration)
- Rate limiting on AI messages
- Supplier "Confirm Booking" action:
  - Creates booking
  - Blocks date (inserts blocked_date)
  - Updates inquiry status
  - Updates checklist item status (closes the loop with Layer 3A)
- Supplier "Not Available" decline action

### Layer 7 — Guest List + RSVP (depends on Layer 2)
- Guest CRUD (client side)
- RSVP token generation
- Public RSVP page + name search Route Handler
- RSVP response submission (anon)
- Meal preference toggle (on events table)
- Client guest summary + manual override

### Layer 8 — Availability Calendar (can build alongside Layer 4)
- Supplier blocked date management (calendar UI)
- Blocked dates displayed on supplier profile
- Filter suppliers by availability in browse page (Layer 5 builds this filter)

### Layer 9 — File Storage (depends on Layer 2, builds on 3B's storage work)
- Event file browser
- Upload contracts, quotations, general files
- Tag to supplier or checklist item

### Layer 10 — Reviews (depends on Layer 6 — requires confirmed booking)
- Review submission (post-event date gating)
- Supplier reply to review
- Reviews displayed on supplier public profile
- Verified booking check for review eligibility

---

## Architecture Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side Data Fetching for Sensitive Data
**What goes wrong:** Using the Supabase browser client to fetch `events`, `expenses`, `guests` directly from Client Components.
**Why bad:** Leaks query logic to the browser, harder to enforce RLS edge cases, creates waterfall requests, exposes table structure.
**Instead:** Use Server Components for all initial data fetch. Pass data down as props. Client Components only call Server Actions for mutations or Route Handlers for specific async operations.

### Anti-Pattern 2: Trusting Middleware Alone for Authorization
**What goes wrong:** Putting all role-based auth in `middleware.ts` and doing no check in Server Actions or Route Handlers.
**Why bad:** Next.js official docs explicitly state middleware should not be the only line of defense. Direct API calls can bypass middleware matching patterns.
**Instead:** Middleware for redirect UX only. Every Server Action calls `verifySession()` and `assertRole()` from DAL before touching data.

### Anti-Pattern 3: One `checklist_items` Table Serving Both Item Types with Shared Status Column
**What goes wrong:** Trying to use a single `status` enum for both supplier tasks (Pending/Inquired/Booked) and personal tasks (Pending/Done).
**Why fine here:** The schema above uses a single table with `item_type` discriminator and the status values are compatible since both start at 'Pending'. But do not add supplier-specific columns (like `supplier_id`) as non-nullable — keep them nullable and enforce at the Server Action level by item_type.

### Anti-Pattern 4: Storing AI Conversation Only in React State
**What goes wrong:** Building the chat UI with local state for messages, never persisting to `inquiry_messages` until "submit."
**Why bad:** Losing conversation history on refresh, AI loses context for follow-up messages, supplier can't see the full thread.
**Instead:** Every message (client, AI, supplier) is persisted to `inquiry_messages` immediately. UI is fed from the database. Optimistic updates in the Client Component for perceived speed.

### Anti-Pattern 5: One Budget "Total" Without Category Breakdown
**What goes wrong:** Storing budget as a single number on `events`, computing overage in JavaScript.
**Why bad:** Can't alert per-category when over limit; harder to show breakdown dashboard; no way to allocate by supplier category.
**Instead:** `budget_categories` per event with `allocated_amount`; `expenses` with `budget_category_id`. Aggregation queries are straightforward in PostgreSQL.

### Anti-Pattern 6: Using Supabase Realtime for MVP
**What goes wrong:** Adding Realtime subscriptions to the inquiry thread for "live chat."
**Why bad:** Adds websocket complexity, subscription management, and Supabase free-tier connection limits. This is a low-volume platform at launch.
**Instead:** Optimistic UI for the sending user. Recipient sees new messages on next page visit or a 30-second poll with `revalidatePath`. Revisit Realtime in v2 if demand warrants.

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| RLS policy performance | No issue | Add index on `events.client_id`, `inquiries.client_id` | Partition tables by event_date |
| AI rate limiting | Per-inquiry counter in DB | Add Redis (Upstash free tier) for atomic counters | Dedicated rate limiting service |
| Storage | Supabase 1GB free tier | Upgrade Supabase plan; signed URL expiry management | CDN in front of Storage |
| Supplier browse | Full table scan is fine | Add composite indexes on `category`, `service_area`, `is_active` | Elasticsearch or pg_search extension |
| RSVP concurrency | Single row upserts | Upsert is atomic in Postgres; no issue | Queue writes if >1000 concurrent |
| Supabase free tier | 500MB DB, 1GB storage, 50K auth users | Upgrade to Pro ($25/mo) | Custom plan |

---

## Sources

- Next.js App Router Authentication Guide (official): https://nextjs.org/docs/app/guides/authentication — HIGH confidence
- Next.js Route Groups (official): https://nextjs.org/docs/app/api-reference/file-conventions/route-groups — HIGH confidence
- Next.js Middleware/Proxy (official, v16 rename note): https://nextjs.org/docs/app/api-reference/file-conventions/proxy — HIGH confidence
- Supabase RLS concepts: derived from Supabase documentation fundamentals + PostgreSQL RLS specification — HIGH confidence (core patterns are stable)
- Domain model: derived from PROJECT.md requirements analysis — HIGH confidence (direct from spec)
- AI inquiry architecture: derived from Gemini API patterns + Supabase service role patterns — MEDIUM confidence (Gemini streaming details need validation during implementation phase)
