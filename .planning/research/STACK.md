# Technology Stack

**Project:** EventMate (Wedding/Event Planning Platform)
**Researched:** 2026-06-11
**Market:** Philippines (PHP currency, Philippine Data Privacy Act)
**Constraints:** Solo developer, zero budget, free tiers only

---

## Verdict on Already-Chosen Stack

| Component | Decision | Confidence | Verdict |
|-----------|----------|------------|---------|
| Next.js 15 (App Router) | Keep | HIGH | Confirmed from official release blog. Correct choice. |
| Supabase (DB + Auth + Storage) | Keep | HIGH | All-in-one BaaS matches solo-dev constraints perfectly. |
| Vercel (hosting) | Keep | HIGH | Canonical Next.js host; zero-config deploys. |
| Gemini 1.5 Flash | Upgrade to 2.0 Flash | MEDIUM | 2.0 Flash is the current recommended free-tier model (better perf, same cost). |
| Resend (email) | Keep, add React Email | HIGH | 3,000 emails/month free is ample for MVP; pair with React Email for typed templates. |

**Three additions are mandatory:** UI component system (shadcn/ui), AI SDK wrapper (Vercel AI SDK), and form handling (React Hook Form + Zod). The chosen stack has no answer for these and they affect every feature.

---

## Complete Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 15.x | Full-stack framework | App Router + Server Actions eliminate most API routes; RSC reduces client JS; Turbopack cuts dev iteration time; `next/form` for progressive-enhancement forms. CONFIRM: use App Router exclusively, not Pages Router. |
| React | 19.x | UI runtime | Bundled with Next.js 15; new `use()` hook simplifies async data in components. |
| TypeScript | 5.x | Type safety | Enable `strict: true`. Supabase generates typed DB schemas; Zod infers types at runtime; no untyped code. |

**Key Next.js 15 gotcha:** `cookies()`, `headers()`, `params`, and `searchParams` are now async. Every server component that touches these must `await` them. Apply the codemod immediately on project init: `npx @next/codemod@canary next-async-request-api .`

### Styling & UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility styling | Ships with `create-next-app`; v4 uses CSS-first config (no `tailwind.config.js` required for basics). |
| shadcn/ui | latest (registry) | Component system | Not a package — you own the components. No bundle bloat, full Radix UI accessibility, works perfectly with Tailwind. Critical for solo dev speed: Dialog, Sheet, Form, Table, Calendar, Combobox, Tabs, Badge — all available out of the box. Run `npx shadcn@latest init` to set up. |
| Lucide React | 0.x | Icons | Ships with shadcn/ui. Tree-shakeable. Do not add a second icon library. |

**Do not use:** Material UI, Ant Design, Chakra UI. These are heavy, opinionated, and fight Tailwind. shadcn/ui + Tailwind is the correct 2025 pairing.

### Database / Backend (Supabase)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @supabase/supabase-js | 2.x | Database queries, realtime, storage | Typed client generated from your DB schema. Handles all DB, auth, storage, and realtime operations. |
| @supabase/ssr | 0.x | Server-side auth in Next.js | **Required** for App Router. Replaces deprecated `@supabase/auth-helpers-nextjs`. Manages Supabase sessions via cookies in Server Components and Route Handlers. |

**Supabase free tier limits** (MEDIUM confidence — verify at supabase.com/pricing before relying on these):
- PostgreSQL database: 500MB
- File storage: 1GB (confirmed in PROJECT.md)
- Monthly active users: 50,000
- Egress bandwidth: 5GB/month
- Realtime connections: 200 concurrent
- Edge functions: 500K invocations/month
- **Critical:** Projects are paused after 1 week of inactivity on free tier. Set a cron job (via Vercel Cron or GitHub Actions) to ping the project weekly during early development.

**Do not add Prisma or Drizzle ORM.** Supabase generates fully-typed TypeScript from your schema via `supabase gen types typescript`. Adding an ORM creates a second abstraction layer with no benefit.

**RLS is mandatory.** Row Level Security must be enabled on every table. A client must never be able to read another client's event data. A supplier must never see another supplier's inquiries. Design RLS policies before writing application code.

Storage bucket architecture:
- `supplier-portfolio` — public bucket (accessible without auth for browsing)
- `event-files` — private bucket (contracts, receipts, quotations; RLS by event owner)
- `receipts` — private bucket (payment receipts; RLS by client)

### AI Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ai (Vercel AI SDK) | 4.x | AI streaming, structured output, tool calls | `streamText()` and `generateText()` work natively with Next.js Server Actions and Route Handlers. Built-in token usage tracking. Much better DX than raw `@google/generative-ai`. |
| @ai-sdk/google | 1.x | Gemini provider for Vercel AI SDK | Plugs Gemini into the AI SDK. Switch to `@ai-sdk/anthropic` (Claude Haiku) by changing one line if free tier is exhausted. |

**Upgrade Gemini model:** Use `gemini-2.0-flash` instead of `gemini-1.5-flash`. It is the current recommended free-tier model with better reasoning at the same cost tier. The PROJECT.md rate limit figure (1,500 req/day) may still apply — verify at ai.google.dev before assuming.

**Rate limiting strategy (free tier, no Redis):** Implement rate limiting via Supabase. Add an `ai_usage` table with columns `(client_id, date, request_count)`. On each AI inquiry, check and increment in a transaction. Reject if count exceeds daily limit. This avoids needing Upstash Redis or Vercel KV (both have free-tier constraints).

Do not use raw `@google/generative-ai` SDK. The Vercel AI SDK abstracts provider-specific quirks and makes switching models or providers trivial.

### Form Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-hook-form | 7.x | Form state, validation UX | Uncontrolled inputs (no re-render on every keystroke); native Server Action support; integrates directly with shadcn/ui Form components. |
| zod | 3.x | Schema validation + TypeScript inference | Define one schema, get runtime validation AND TypeScript types. Use the same Zod schema on client (react-hook-form) and server (Server Action) for defense-in-depth validation. |
| @hookform/resolvers | 3.x | Connects Zod to react-hook-form | One import: `zodResolver`. |

Pattern for every form in this app:
```typescript
// shared/schemas/event.ts
const createEventSchema = z.object({ ... })
type CreateEventInput = z.infer<typeof createEventSchema>

// component: use zodResolver(createEventSchema)
// server action: createEventSchema.parse(formData)
```

### Server State & Data Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @tanstack/react-query | 5.x | Client-side data caching and synchronization | For features requiring reactive updates: guest list RSVP status, inquiry thread polling, supplier availability filters. Server Components handle initial load; TanStack Query handles subsequent client mutations and cache invalidation. |

Do not use TanStack Query for everything. Server Components fetching from Supabase directly is sufficient for static or rarely-updated data (supplier profiles, package listings). Use TanStack Query only where client-side reactivity matters.

### Client State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zustand | 5.x | Client-side UI state | Multi-step forms (event setup wizard), modal state, filter state for supplier discovery, sidebar state. No context boilerplate, no Redux overhead. |

Do not use Redux, MobX, or Jotai. Zustand 5 is sufficient and matches the zero-boilerplate requirement of a solo developer.

### Date & Time

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| date-fns | 3.x | Date formatting, calculations, countdown | Tree-shakeable (import only what you use); TypeScript-first; correct handling of timezones and locales. Required for: event countdown timer, RSVP deadline display, payment balance due-date formatting, supplier availability calendar logic. |

Do not use Day.js (smaller API, more chaining gymnastics) or Moment.js (deprecated, 230KB). `date-fns` is the correct choice for TypeScript Next.js projects.

**Philippine timezone:** Store all dates as UTC in Supabase. Display using `Asia/Manila` timezone: `format(date, 'PPP', { locale: ... })`. 

### Email

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| resend | 4.x | Email delivery | Already chosen. 3,000 emails/month free. |
| @react-email/components | 0.x | Typed, testable email templates | Write emails as React components; render to HTML on the server with `render()`. Gives type-safe props to email templates. Required for: booking confirmation, RSVP link email, supplier notification emails. |

Install both: `npm install resend @react-email/components`. The Resend SDK accepts the output of `@react-email/render()` directly.

### File Uploads

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-dropzone | 14.x | Drag-and-drop file upload UI | Handles file selection, drag events, type/size validation on the client before upload. Pairs with shadcn/ui styling. Upload goes directly to Supabase Storage via the JS client. No separate upload service needed. |

Pattern: `react-dropzone` → client-side validation (type, size) → Supabase Storage `upload()` → save storage path in DB. Never expose storage bucket service keys to the client; use Supabase RLS on storage buckets instead.

### Data Tables (Admin Panel)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @tanstack/react-table | 8.x | Headless data table | Handles sorting, filtering, pagination logic with no UI opinions. shadcn/ui DataTable pattern wraps it with Tailwind styling. Required for: admin client list, admin supplier list, booking management. |

shadcn/ui ships a DataTable component using TanStack Table. Copy it into your project and customize.

### Notifications / Toasts

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| sonner | 1.x | Toast notifications | shadcn/ui's recommended toast library. Accessible, lightweight, requires one `<Toaster />` in root layout. |

### Unique ID Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| nanoid | 5.x | Short unique IDs for RSVP links | RSVP links need a short, URL-safe token (e.g., `/rsvp/abc123xy`). `nanoid` generates cryptographically random IDs shorter than UUIDs. Standard UUIDs (via `crypto.randomUUID()`) are also acceptable if URL length is not a concern. |

### Currency (No Library Needed)

For Philippine Peso formatting, use native `Intl.NumberFormat` — no library required:

```typescript
const formatPHP = (amount: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(amount)
// → "₱ 50,000"
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI Components | shadcn/ui | Material UI / Chakra | Heavy, opinionated, fights Tailwind, no component ownership |
| UI Components | shadcn/ui | Tremor | Only for dashboards; no full-app component coverage |
| ORM | (none, Supabase client) | Prisma / Drizzle | Supabase typed client makes ORM redundant; adds complexity |
| Auth | Supabase Auth | NextAuth / Auth.js | Supabase Auth is already included; adding NextAuth creates two auth systems |
| AI SDK | Vercel AI SDK | @google/generative-ai (raw) | No streaming abstractions; no provider-agnostic switch path; worse DX |
| State | Zustand | Redux Toolkit | Redux is 3x the boilerplate for the same result in a solo project |
| State | Zustand | Context API | Context causes unnecessary re-renders at scale; Zustand is the correct replacement |
| Dates | date-fns | Day.js | Day.js chains; date-fns is tree-shakeable and TypeScript-native |
| Dates | date-fns | Moment.js | Deprecated, 230KB, no tree-shaking |
| Real-time chat | Supabase Realtime | Socket.io / Pusher | PROJECT.md explicitly excludes real-time chat infrastructure; Supabase Realtime covers the inquiry thread use case at no added cost |
| File storage | Supabase Storage | Cloudinary | Free tier (1GB) covers MVP; no additional vendor |
| Email templates | React Email | MJML / HTML strings | React Email gives TypeScript props, component reuse, previews in dev |
| Rate limiting | Supabase DB table | Upstash Redis | Upstash free tier is limited; a DB-based rate limit table avoids a new vendor on the zero-budget constraint |

---

## Installation

### Project Bootstrap

```bash
npx create-next-app@latest event-app --typescript --tailwind --app --src-dir
cd event-app
npx shadcn@latest init
```

### Core Dependencies

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  ai \
  @ai-sdk/google \
  react-hook-form \
  zod \
  @hookform/resolvers \
  @tanstack/react-query \
  @tanstack/react-table \
  zustand \
  date-fns \
  resend \
  @react-email/components \
  react-dropzone \
  sonner \
  nanoid
```

### Dev Dependencies

```bash
npm install -D \
  supabase \
  @types/node \
  @types/react \
  @types/react-dom
```

### Supabase Type Generation (run after schema changes)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

## Free Tier Summary

| Service | Free Allowance | Constraint for EventMate |
|---------|---------------|--------------------------|
| Vercel Hobby | ~100GB bandwidth, unlimited deploys | Serverless function timeout is 10s (not 60s) — AI streaming responses must complete within this window |
| Supabase | 500MB DB, 1GB storage, 50K MAU | Project pauses after 1 week of inactivity — add a weekly keep-alive ping |
| Gemini 2.0 Flash | ~1,500 RPD / 15 RPM (MEDIUM confidence — verify) | Already rate-limited per client in PROJECT.md design |
| Resend | 3,000 emails/month, 100/day | Sufficient for MVP; triggers are booking confirms + RSVP links only |

**Vercel 10-second timeout is the tightest constraint.** Gemini AI responses for the inquiry feature must stream (using `streamText()` from Vercel AI SDK) and complete or yield within 10 seconds. Test with real prompts early. If streaming keeps connections open longer than 10s, upgrade to Vercel Pro or move AI to Supabase Edge Functions (which have a 2-minute limit on the free tier).

---

## Sources

- Next.js 15 official release blog: https://nextjs.org/blog/next-15 (fetched 2026-06-11)
- shadcn/ui: https://ui.shadcn.com — not versioned (component registry pattern)
- Vercel AI SDK: https://sdk.vercel.ai — v4 documentation
- Supabase SSR package: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase free tier: https://supabase.com/pricing — MEDIUM confidence (verify current limits)
- Vercel Hobby tier limits: https://vercel.com/pricing — MEDIUM confidence (verify current limits)
- Gemini model availability: https://ai.google.dev/gemini-api/docs/models — MEDIUM confidence
- PROJECT.md constraints and decisions: C:\Users\josep\Desktop\application\event-app\.planning\PROJECT.md
