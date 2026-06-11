# Research Summary: EventMate

**Synthesized:** 2026-06-11
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Project:** Wedding planning platform for the Philippines
**Constraints:** Solo developer, zero budget, free tiers only

---

## Executive Summary

EventMate is a two-sided marketplace with a planning tool layer: couples use it to manage their wedding, and vetted suppliers use it to receive and respond to inquiries. The research confirms the chosen stack is sound with one upgrade (Gemini 1.5 Flash to 2.0 Flash) and three mandatory additions (shadcn/ui for components, Vercel AI SDK for Gemini abstraction, React Hook Form + Zod for form handling). The architecture is well-understood: a multi-role Next.js 15 app backed by a single Supabase project, using route groups and a Data Access Layer to enforce role separation, with Row-Level Security as the hard data boundary.

The most important strategic insight from the research is the cold-start problem: Phase 1 must make the app fully useful before a single platform supplier exists. Couples can add offline suppliers (found via Facebook or referrals) from day one. This makes the checklist, budget tracker, and file storage immediately valuable and gives the platform real users before the supplier side is built. This sequencing is correct and must be preserved -- do not build supplier infrastructure before the planning tools.

The three categories of risk that will actually hurt this project are: (1) free tier infrastructure traps -- Supabase auto-pause, Vercel 10-second timeout on AI streaming, and Gemini quota exhaustion are all real failure modes that need mitigation before launch, not after; (2) security gaps -- RLS not enabled at table creation and service role key leaked to the client are both catastrophic and easy to prevent; (3) scope creep -- wedding website builder, gift registry, seating chart, and in-app payments each look like one-feature additions but each represent months of work and should be rejected on sight.

---

## Key Findings

### From STACK.md

**Confirmed stack:**

| Technology | Status | Notes |
|------------|--------|-------|
| Next.js 15 (App Router) | Confirmed | Use App Router exclusively. Apply async request API codemod on project init. |
| Supabase (DB + Auth + Storage) | Confirmed | Use @supabase/ssr -- NOT @supabase/auth-helpers-nextjs (deprecated). |
| Vercel (hosting) | Confirmed | Hobby plan has 10-second serverless timeout -- critical constraint for AI. |
| Gemini AI | Upgrade to 2.0 Flash | 2.0 Flash is the current recommended free-tier model. Update PROJECT.md. |
| Resend + React Email | Confirmed | 3,000 emails/month free; pair with @react-email/components for typed templates. |
| TypeScript strict mode | Mandatory | Enable strict: true from project init; never relax it. |

**Three mandatory additions not in PROJECT.md:**

1. **shadcn/ui** -- Component system (Dialog, Form, Table, Calendar, Combobox, Tabs, Badge). Not a package -- you own the components. Critical for solo-dev speed. Run npx shadcn@latest init on project init.
2. **Vercel AI SDK** (ai + @ai-sdk/google) -- Wraps Gemini. Enables streamText() in Route Handlers. Provider-agnostic: switching from Gemini to Claude Haiku is a one-line change. Do NOT use raw @google/generative-ai.
3. **React Hook Form + Zod** (react-hook-form, zod, @hookform/resolvers) -- Define one Zod schema, get client validation AND server validation AND TypeScript types. Every form in the app follows this pattern.

**Other required additions:** TanStack Query (client reactivity only, not all data fetching), Zustand (UI state for multi-step forms and modals), date-fns (dates with Asia/Manila timezone), react-dropzone (file uploads to Supabase Storage), sonner (toasts), nanoid (RSVP tokens), TanStack Table (admin data tables).

**Critical Next.js 15 note:** cookies(), headers(), params, and searchParams are all async. Apply the codemod on project init: npx @next/codemod@canary next-async-request-api .

**Currency:** Store all PHP amounts as INTEGER centavos (1 PHP = 100 centavos). Display via Intl.NumberFormat with en-PH locale and PHP currency. No library needed.

**Free tier hard limits:**

| Service | Tightest Constraint |
|---------|---------------------|
| Vercel Hobby | 10-second serverless function timeout -- AI responses MUST stream |
| Supabase | Project pauses after ~1 week of inactivity -- requires keep-alive cron |
| Supabase | 1GB storage total -- requires file size limits and client-side compression |
| Gemini 2.0 Flash | ~1,500 requests/day (verify at ai.google.dev) -- requires per-client rate limiting |
| Resend | 100 emails/day -- RSVP guest notifications must be opt-in or batched |

---

### From FEATURES.md

**Table stakes -- must ship in MVP or the product feels incomplete:**

For clients: event setup (date, type, multiple locations), dashboard countdown, Philippines-specific pre-built checklist template, custom checklist items, budget tracker with category breakdown, deposit + remaining balance + due date per supplier, guest list management, RSVP via shareable link (no guest login required), supplier browse with category/location/price filter, supplier profile with packages and portfolio, supplier availability indicator, inquiry/messaging thread, file storage (contracts, receipts, quotations), verified post-event reviews, offline supplier entry, email notifications, partner/co-planner access.

For suppliers: profile setup, package definition with starting-at option, portfolio photo upload, inquiry dashboard, manual reply, booking confirmation action, availability calendar management, decline action.

For admin: supplier account creation (invite-only), activation/deactivation toggle, category management, basic platform stats.

**Gap identified:** Partner/co-planner access and email notifications are not in PROJECT.md Active requirements but are table stakes. Both must be added.

**Differentiators -- no competing platform has these:**

- AI-powered supplier inquiry assistant with event context injection (date, budget, locations, supplier packages) -- none of WeddingWire, The Knot, Zola, Bridebook, Joy, or Appy Couple have this
- Offline supplier tracking alongside platform suppliers -- cold-start strategy and immediate user value
- Checklist auto-updates when supplier confirms a booking
- Deposit + balance + due date tracking (PH deposit culture: 30-50% deposit, balance 30-90 days before event)
- Starting-at package pricing reflecting PH supplier reality
- Philippines-first supplier categories (host/emcee, barong/gown, church venue, sound/lights AV, full vs. day-of coordinator)
- Verified-only reviews gated to confirmed bookings after event date

**Anti-features -- do not build:**

| Feature | Verdict |
|---------|---------|
| Wedding website builder | Months of work. Add a URL field instead. |
| Gift registry | E-commerce business, not a feature. Add a URL field instead. |
| Seating chart | Drag-and-drop canvas is weeks of work; users use printouts anyway. |
| Guest photo sharing | Storage costs explode; Google Photos shared album solves it. |
| Day-of push notifications | Requires native app or Web Push infrastructure. |
| Open supplier self-registration | Spam and quality dilution. Keep invite-only through v2. |
| In-app payment processing | Regulated financial product. Track payments; money moves outside the app. |
| Social/community features | Moderation at scale is a full-time job. |
| General wedding planner AI | Scope explosion. Nail the bounded AI inquiry assistant first. |
| Multi-event support (v1) | Ripples through every data model decision. |

---

### From ARCHITECTURE.md

**Application structure:** Four route groups enforced by middleware.ts and lib/dal.ts:

- (public) -- landing, supplier browse/profiles, no auth required
- (client) -- requires role = client
- (supplier) -- requires role = supplier
- (admin) -- requires role = admin
- rsvp/[token] -- public, unauthenticated; token is the authorization mechanism
- api/inquiry/[id]/ai -- Route Handler for Gemini (streaming, service role client)
- api/rsvp/[token]/* -- Route Handlers for public RSVP search and submission

**Key architectural rules:**
- Middleware handles redirect UX only -- never used as sole authorization
- Every Server Action calls verifySession() + assertRole() from DAL before touching data
- Client Components never call Supabase directly -- they invoke Server Actions or read props passed from Server Components
- The AI Route Handler is the only place Gemini is called -- uses Supabase service role client to write AI messages
- Supplier portfolio photos in a public Storage bucket; all other files use signed URLs via authenticated endpoints

**Core data model highlights:**
- profiles (1:1 with auth.users; role auto-set by trigger on signup)
- events (1:1 with client in v1; unique constraint on client_id enforces single-event per client)
- checklist_items (single table; item_type discriminator for supplier_task vs. personal_task; supplier columns nullable)
- expenses (deposit_paid + remaining_balance + balance_due_date -- the PH deposit/balance model)
- inquiries + inquiry_messages (sender_type: client | supplier | ai; ai_message_count for rate limiting)
- bookings created atomically via PostgreSQL RPC function (prevents double-booking race condition)
- blocked_dates auto-inserted when booking confirmed
- reviews INSERT gated: event_date must be in the past AND booking must be confirmed

**RLS must be enabled on every table at creation time. No exceptions.**

**Build order (layers with dependency chain):**

    Layer 1:  Foundation -- schema, RLS, auth, middleware, DAL, keep-alive cron
    Layer 2:  Client Event Shell -- event creation, locations, dashboard shell
    Layer 3A: Checklist + offline supplier entry          [parallel with 3B and 3C]
    Layer 3B: Budget tracker + file upload                [parallel with 3A and 3C]
    Layer 3C: Admin Panel -- supplier creation, cats      [parallel with 3A and 3B]
    Layer 4:  Supplier System -- profile, packages, portfolio, availability calendar
    Layer 5:  Supplier Discovery -- browse, filter, search
    Layer 6:  Inquiry + AI + Booking -- thread, Gemini streaming, rate limit, atomic booking
    Layer 7:  Guest List + RSVP -- CRUD, token generation, public page, response handling
    Layer 8:  File Storage -- event file browser, general uploads
    Layer 10: Reviews -- submission, supplier reply, display on profile

---

### From PITFALLS.md

**Critical pitfalls -- cause rewrites, data exposure, or cost spikes:**

| ID | Pitfall | Prevention |
|----|---------|------------|
| C-1 | Supabase auto-pause kills demos | Keep-alive cron (SELECT 1 every 3 days) before first external demo |
| C-2 | RLS disabled = all data readable by anyone | Enable RLS in the same migration as CREATE TABLE on every table |
| C-3 | Vercel 10s timeout on AI calls | AI Route Handler as streaming response from day one; never blocking Server Action |
| C-4 | Gemini 429 quota exhaustion | Per-client DB rate limit; graceful AI temporarily unavailable fallback |
| C-5 | Supabase 1GB storage limit | Client-side compression; 10MB max per file; per-event soft quota |
| C-6 | Service role key leaked in client code | Only URL and anon key get NEXT_PUBLIC_ prefix; service role never |

**Moderate pitfalls -- significant bugs or rework if missed:**

| ID | Pitfall | Prevention |
|----|---------|------------|
| M-1 | Double-booking race condition | Atomic PostgreSQL RPC function for all booking confirmations |
| M-2 | RSVP spam and name enumeration | Rate limit search endpoint; nanoid(20) tokens; disable after event date |
| M-3 | Filipino name collisions in RSVP | Optional disambiguator on guest (nickname, last 4 digits of phone) |
| M-4 | Supabase connection pool exhaustion | Pooled connection string (Supavisor) for app queries; direct URL for migrations only |
| M-5 | Float arithmetic in budget tracker | INTEGER centavos in schema from day one |
| M-7 | Resend email volume and deliverability | Custom sending domain + SPF/DKIM/DMARC; opt-in RSVP emails; batch non-urgent |
| M-8 | Vercel image optimization quota | Supabase Storage image transforms for portfolio photos, not next/image |
| M-9 | AI prompt injection via supplier data | Sanitize package text; structured delimiters in system prompt; log all prompts |
| M-10 | JWT session expiry mid-session | @supabase/ssr middleware handles auto-refresh; never legacy auth-helpers-nextjs |

**Minor pitfalls:**
- Countdown widget hydration errors -- must be a Client Component with useEffect, not a Server Component
- Philippine DPA (RA 10173) compliance -- privacy policy and consent checkbox before first real user; not a v2 item
- Scope creep -- seating chart, wedding website, video portfolios, SMS, multi-event all look small but are not

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 1 -- Infrastructure + Core Planning Tools**

Rationale: Delivers a fully functional planning app before any supplier is onboarded. The cold-start strategy requires this. Also locks in infrastructure decisions (security, currency, database connections) that are expensive to retrofit.

Delivers: Event setup with multiple locations, countdown dashboard, PH-specific checklist template + custom items + offline supplier entry, budget tracker with deposit/balance/due date tracking, guest list + RSVP shareable link (no guest login), file storage tagged to suppliers or checklist items.

Features from FEATURES.md: Event setup, dashboard countdown, checklist (PH template + custom + offline entry), budget (categories + deposit/balance/due date), guest list, RSVP link, file storage.

Must-avoid pitfalls: C-1 (keep-alive cron), C-2 (RLS per table at creation), C-6 (key naming convention), M-4 (pooled connection string), M-5 (INTEGER centavos), M-10 (@supabase/ssr from day one).

Research flag: Standard patterns -- no deep research phase required.

---

**Phase 2 -- Admin + Supplier System + Discovery**

Rationale: Unlocks the marketplace side. Admin must create supplier accounts before suppliers can set up profiles. Supplier profiles and packages must exist before discovery or inquiry are possible.

Delivers: Admin panel (invite-only supplier onboarding, category management, platform stats), supplier profile setup, package management with starting-at pricing, portfolio photo upload, availability calendar, public supplier browse with category/location/price filter.

Features from FEATURES.md: Admin CRUD, supplier profile, packages with starting-at, portfolio, availability calendar/indicator, public browse and filter.

Must-avoid pitfalls: M-8 (use Supabase Storage image transforms for portfolio photos, not Vercel next/image).

Research flag: Likely needs phase research for Supabase Admin API server-side user creation and invite mechanics.

---

**Phase 3 -- Inquiry + AI + Booking Confirmation**

Rationale: The highest-complexity phase. Depends on supplier profiles (Phase 2) and client event data (Phase 1). AI streaming, rate limiting, prompt injection prevention, and atomic booking confirmation all require upfront architectural decisions that affect the chat UI.

Delivers: Inquiry thread creation (client initiates), AI-powered responses with event and supplier context injection, supplier manual reply, atomic booking confirmation (auto-updates checklist status, prompts budget entry, blocks supplier date, sends email notification), supplier decline action, email notifications for booking confirmed and inquiry reply received.

Features from FEATURES.md: Inquiry/messaging thread, AI assistant, booking confirmation, checklist auto-update, email notifications.

Must-avoid pitfalls: C-3 (streaming from day one), C-4 (rate limiting + graceful 429 handling), M-1 (atomic booking via PostgreSQL RPC), M-9 (prompt injection guards), M-7 (custom Resend domain before first notification email).

Research flag: Requires deep phase research before implementation. AI streaming with Vercel 10s constraint, Gemini system prompt design, and atomic booking RPC all need detailed planning.

---

**Phase 4 -- Trust + Retention**

Rationale: Reviews require completed events (INSERT gated on event_date in the past), making this final. Partner access and privacy compliance also land here.

Delivers: Verified post-event reviews (time-gated 1 to 90 days after event, booking-gated), supplier review replies, partner/co-planner shared event access, privacy policy and consent mechanism.

Features from FEATURES.md: Verified reviews, supplier review reply, partner/co-planner access.

Must-avoid pitfalls: M-6 (review gaming: time-gate, delay window, IP audit logging), Mi-2 (DPA compliance must be in place before first real non-developer user).

Research flag: Standard patterns for reviews. Partner access model requires a product decision before implementation.

---

## Critical Decisions Before Phase 1

These are expensive or impossible to reverse after data exists. Resolve before writing any application code.

| Decision | Required Answer | Default if Unclear |
|----------|-----------------|-------------------|
| Currency storage format | INTEGER centavos or NUMERIC(10,2)? | INTEGER centavos -- migration is painful retroactively |
| RLS workflow | Enable in same migration as CREATE TABLE? | Yes, same migration -- never defer |
| Supabase connection strings | Pooled URL for app, direct URL for migrations? | Pooled for all app queries -- configure in .env before first query |
| Supabase key naming | Which keys get NEXT_PUBLIC_ prefix? | Only URL and anon key -- document before touching .env |
| Gemini model version | 1.5 Flash (PROJECT.md) or 2.0 Flash (research)? | 2.0 Flash -- update PROJECT.md reference |
| AI delivery mechanism | Streaming Route Handler or blocking Server Action? | Streaming Route Handler -- affects chat UI architecture |
| RSVP token length | Short (8 chars) or long (20+ chars)? | nanoid(20) -- set in schema migration |
| Data model scope | User-scoped or event-scoped internally? | Event-scoped with unique constraint on client_id in events table |
| Partner access model | Full access or read-only? Separate login or invite? | Needs product decision -- design DB to support it in Phase 1 |
| Keep-alive cron | Vercel Cron or external service (cron-job.org)? | Either -- must run before first external demo |

---

## Open Questions to Resolve Before Planning

| Question | Why It Matters | Where It Blocks |
|----------|----------------|-----------------|
| Partner/co-planner permission model | Full access vs. read-only? Notifications to both? Separate login or invite link? | Phase 1 DB schema; Phase 4 auth sub-flow |
| Email notification triggers and templates | Which events send email? User-configurable opt-out? RSVP guest emails? | Phase 3 booking notifications; Phase 4 notification system |
| Availability calendar UX direction | Available-by-default-block-specific vs. unavailable-by-default-open-specific? | Phase 2 supplier portal UI design |
| AI rate limit UX | Visible counter (X messages remaining today) or silent rejection with message? | Phase 3 AI chat UI component |
| Review unlock timing window | Accept 1-day minimum to 90-day maximum after event date? | Phase 4 review submission gating logic |
| PH wedding checklist template content | Exact items: church booking, CENOMAR, banns, barong/gown fitting timeline | Phase 1 checklist seed data |
| Gemini 2.0 Flash free tier limits | Verify 15 RPM / 1,500 RPD at ai.google.dev before coding rate limiter thresholds | Phase 3 rate limiter configuration |
| Vercel streaming timeout behavior | Streaming start within 10s is real constraint; validate with real Gemini calls | Phase 3 AI Route Handler design |
| NPC registration obligation | Does EventMate need to register as a PIC before first real user? | Pre-launch legal checklist |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Stack selection | HIGH | Official Next.js 15 and Supabase docs; stable current patterns |
| Feature scope | HIGH | Direct product analysis of all major competitors; PH market context |
| Architecture patterns | HIGH | Official Next.js App Router auth guide + Supabase fundamentals |
| Pitfalls -- infrastructure | HIGH | Supabase pause, Vercel timeout, RLS, pooler are well-documented stable facts |
| Pitfalls -- security | HIGH | RLS, service role key exposure, JWT session handling are verified patterns |
| Pitfalls -- PH domain | HIGH | Filipino naming, deposit culture, Facebook-first discovery are well-grounded |
| Gemini free tier limits | MEDIUM | Numbers from training data (August 2025 cutoff); verify at ai.google.dev |
| Vercel image optimization quota | MEDIUM | Known limit; exact number may have changed; verify at vercel.com/pricing |
| DPA/RA 10173 compliance | MEDIUM | General framework correct; NPC threshold for solo devs needs verification |
| AI streaming vs. Vercel timeout | MEDIUM | Streaming is correct approach; validate with real Gemini calls before Phase 3 |

Overall: HIGH confidence on architecture, stack, and pitfall categories. MEDIUM confidence on specific free-tier numbers -- verify all against live pricing pages before writing code that depends on them.

---

## Gaps to Address in Phase-Specific Research

- Phase 2 (Admin + Supplier): Supabase Admin API for server-side user creation; exact API for setting user role at creation vs. post-creation; invite email mechanics via Resend.
- Phase 3 (AI + Inquiry): Gemini streaming integration with Vercel AI SDK streamText(); token counting for staying under TPM limits; system prompt design and delimiter patterns for PH wedding supplier context.
- Pre-launch: Philippine DPA NPC registration requirements for solo and early-stage developers. Custom sending domain setup with Resend (SPF, DKIM, DMARC records).
- Phase 4 (Partner Access): Product decision on permission model needed before DB schema for this feature is finalized.

---

## Sources Aggregated

- Next.js 15 official release blog and App Router authentication guide: https://nextjs.org/blog/next-15
- shadcn/ui component registry: https://ui.shadcn.com
- Vercel AI SDK v4 documentation: https://sdk.vercel.ai
- Supabase SSR and Auth: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase pricing (verify before launch): https://supabase.com/pricing
- Vercel Hobby plan limits (verify before launch): https://vercel.com/pricing
- Gemini API model availability and rate limits (verify before launch): https://ai.google.dev
- Resend pricing: https://resend.com/pricing
- Philippine Data Privacy Act RA 10173: https://www.privacy.gov.ph
- Competitor product analysis: WeddingWire, The Knot, Zola, Bridebook, Joy, Appy Couple (training data, August 2025 cutoff)
- PROJECT.md: C:/Users/josep/Desktop/application/event-app/.planning/PROJECT.md
