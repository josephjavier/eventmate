# EventMate — Project Guide

## What This Is

A Philippine wedding planning platform connecting couples (clients) with event suppliers. Clients manage their entire wedding — checklist, budget, guest list, files, and supplier discovery — in one place. Suppliers list packages and availability. An AI assistant answers client inquiries using supplier package data and the client's event context.

**Stack:** Next.js 15 (App Router) · Supabase (PostgreSQL + Auth + Storage) · Vercel · Gemini 2.0 Flash via Vercel AI SDK · Resend · shadcn/ui + Tailwind

## GSD Workflow

This project uses Get Shit Done (GSD) for structured planning and execution.

**Current state:** See `.planning/STATE.md`
**Roadmap:** See `.planning/ROADMAP.md`
**Requirements:** See `.planning/REQUIREMENTS.md`

**Phase commands:**
```
/gsd:discuss-phase N    # Gather context before planning
/gsd:plan-phase N       # Create execution plan
/gsd:execute-phase N    # Build the phase
/gsd:verify-work N      # Verify phase deliverables
```

**Never skip phases.** Each phase has dependencies — Phase 2 requires Phase 1 complete.

## Architecture Decisions (Non-Negotiable)

These were decided during planning and must not be changed without explicit discussion:

1. **INTEGER centavos for all monetary values** — never float/decimal. `₱1,234.56` = `123456` in the DB.
2. **AI inquiry is a Route Handler, not a Server Action** — requires streaming, service-role Supabase client, and HTTP 429 for rate limiting.
3. **AI responses must stream** — Vercel Hobby plan has a 10-second serverless timeout. Use `streamText()` from Vercel AI SDK.
4. **Booking confirmation is an atomic Postgres RPC** — touches 4 tables simultaneously (bookings, blocked_dates, inquiry status, checklist item status). Never do this as sequential operations.
5. **Dual auth layer** — Next.js middleware handles redirect UX only. Every Server Action and Route Handler independently calls `verifySession()` from the DAL.
6. **RLS on every table from day one** — Supabase tables are unprotected by default. No exceptions.
7. **Service role key is never `NEXT_PUBLIC_`** — server-only, never exposed to the browser.
8. **RSVP page at `app/rsvp/[token]/`** — outside all auth route groups. Token is the authorization.

## Route Group Structure

```
app/
  (public)/          # Marketing, supplier public profiles
  (client)/          # Logged-in couple dashboard
  (supplier)/        # Supplier portal
  (admin)/           # Admin panel (developer-only)
  rsvp/[token]/      # Public RSVP — no auth group, no login required
```

Each group has its own `layout.tsx` that asserts the correct role.

## Key Product Decisions

- **Invite-only suppliers** — no public supplier registration. Admin creates accounts via admin panel.
- **One active event per client account** (v1) — multiple events is v2.
- **Offline supplier entry** — clients can add suppliers not on the platform to their checklist. Critical for cold-start.
- **Supplier marks client as "Booked"** — not the client. Supplier has ground truth on their own availability.
- **AI cannot confirm bookings** — system prompt guardrail. Supplier always confirms.
- **Verified reviews only** — only clients with a confirmed booking through the app can review that supplier.
- **Gemini 2.0 Flash** (not 1.5) — current free-tier model. Rate-limit clients to protect the daily quota.

## Free Tier Constraints

| Service | Limit | Watch for |
|---------|-------|-----------|
| Supabase DB | 500MB | Schema bloat from JSON columns |
| Supabase Storage | 1GB | Portfolio photos + receipts + contracts |
| Supabase | Pauses after 1 week inactivity | Keep-alive cron required |
| Vercel | 10s function timeout | AI route must stream |
| Gemini 2.0 Flash | 1,500 req/day free | Rate limit per client |
| Resend | 3,000 emails/month | Transactional only |

## Pitfalls to Avoid

- **Do not store money as float** — rounding errors at PH wedding budget scales (₱500,000+)
- **Do not skip RLS** — adding it later requires auditing every existing query
- **Do not use Server Actions for AI** — they can't stream; use Route Handlers
- **Filipino name collisions** — "Maria Santos" is common. RSVP guest search needs a secondary disambiguating field
- **Supabase `@supabase/ssr` version** — pin the version; it had breaking changes across minor versions
- **Next.js 15 async APIs** — `cookies()`, `params`, `searchParams` are now async. Run the official codemod after `create-next-app`

## Legal

- **Philippine Data Privacy Act (RA 10173)** applies — the app collects personal data (names, contacts, contracts, financial records)
- Privacy policy, terms of service, and user consent on signup required **before first non-developer account is created**
- NPC registration threshold for solo developers — verify at privacy.gov.ph

## Project Context

- **Developer:** Solo, zero budget, free tiers only
- **Market:** Philippines — Philippine Peso (₱), PH wedding supplier categories
- **Timeline:** Personal use for 2027 wedding + community project
- **Planning artifacts:** `.planning/` directory — committed to git
