# App Idea: EventMate

## Context

Personal motivation: Planning a wedding in 2027. Currently juggling multiple tools — spreadsheets for budget,
notes apps for checklists, Google Drive for contracts, WhatsApp for supplier inquiries, Facebook groups
for recommendations. This app consolidates all of that into one place, and makes it available to
anyone planning any kind of event.

---

## What is this app?

An event planning platform that connects **clients** (people planning events) with **suppliers**
(businesses offering event services). Clients can plan, track, and manage their event in one place.
Suppliers can list their packages and availability. An AI assistant bridges the two — answering
client inquiries based on supplier package knowledge and the client's own event context.

Target market: **Philippines**, Philippine Peso (₱), local supplier categories.

---

## Who is it for?

| Role | Description |
|------|-------------|
| **Client** | Anyone planning an event — primarily weddings in v1 |
| **Supplier** | Businesses offering event services — photographers, venues, caterers, florists, etc. |
| **Admin** | Developer who manages the platform, onboards suppliers, manages categories |

---

## The Problem It Solves

- Clients juggle too many tools (spreadsheets, chat apps, cloud storage, notes) to plan one event
- Finding and comparing suppliers is scattered across Facebook groups, Instagram, and word of mouth
- No centralized way to check supplier availability against a specific event date
- Community knowledge (good/bad supplier experiences) is buried in group chats and comment threads
- Suppliers have no dedicated platform to showcase packages and manage inquiries

---

## v1 Core Features

### Client — Account & Event Setup
- One active event per account in v1 (multiple events is v2)
- Create an event with:
  - Type (Wedding for v1; architecture supports Birthday, Corporate in v2)
  - Date and time of event
  - Multiple locations (ceremony venue, reception venue, prenup location, etc.)
  - Each location has a name, address, and role (e.g. "Church", "Reception")
- Dashboard showing event countdown, checklist progress, and budget summary

---

### Client — Checklist
- Start from a **pre-built wedding template** (Venue, Catering, Photographer, Videographer,
  Host, Florist, Hair & Make-up, Cake, Invitations, Transportation, Sound system, etc.)
- Two types of checklist items:
  1. **Supplier task** — linked to a supplier (platform or offline). Status: Pending → Inquired → Booked ✓
  2. **Personal task** — a plain to-do with no supplier (e.g. "Apply for marriage license", "Order wedding rings",
     "Prepare vows", "PSA requirements"). Status: Pending → Done ✓
- Client can add, remove, and customize items freely
- When a supplier booking is confirmed, the linked checklist item auto-updates to Booked ✓
- Cancellations in v1 are handled manually — client resets the checklist item themselves

> **Architecture note:** Event type is a data field, not hardcoded. Birthday and corporate
> templates added in v2 without reworking the data model.

---

### Client — Budget Tracking
- Set total event budget (₱)
- Break budget down by category (matches checklist supplier categories)
- Per supplier/expense entry:
  - Total package price
  - Deposit paid (amount + date paid)
  - Remaining balance
  - Balance due date
- View: total budget / total committed / total paid / remaining balance
- Upload receipt (image or PDF) per payment entry
- Visual breakdown: how much of budget is allocated, paid, and remaining
- Alert when a category goes over its allocated budget

---

### Client — File Storage
- Upload and organize files per event:
  - Contracts (PDF or image)
  - Receipts (PDF or image)
  - Quotations
- Files tagged to the relevant supplier or checklist item
- General event files (not tied to a supplier) stored under the event itself

---

### Client — Supplier Discovery
- Browse platform suppliers by:
  - Category (Photographer, Venue, Catering, etc.)
  - Location / city
  - Availability (filters out suppliers booked on the client's event date and time)
  - Price range / starting price
- **Search by supplier name** — for clients who already know who they want
- View supplier profile: business details, packages with prices, portfolio photos, reviews
- **Manually add an offline supplier** for any checklist item (name, contact, category, price, notes)
  — keeps the checklist useful from day one before the supplier base grows
- Offline suppliers don't have AI inquiry or availability checking

---

### Client — AI Inquiry Assistant
- Each **platform supplier** profile has an AI-powered inquiry chat
- AI context includes:
  - Supplier: packages, prices, availability, service area
  - Client event: type, date, time, locations, budget
- Example queries: "Do you have availability on April 12, 2027 at 10am?",
  "Which package fits my ₱30,000 budget for a 100-person wedding?"
- AI answers based on all of this context
- Supplier can **also reply manually** in the same thread (AI-first, human follow-up)
- **Cost control**: rate-limited per client (e.g. reasonable daily query limit) to manage API costs
- **Language**: AI responds in English; Tagalog support is v2
- **Guardrails**: AI is instructed never to confirm a booking — it can only answer questions.
  Booking confirmation is always done by the supplier.

---

### Client — Guest List & RSVP
- Client adds guests by name (one by one or bulk)
- Client can mark any guest as having a **+1** and enter the +1's name
- Client generates a **shareable RSVP link** for the event
- Guest experience (no login required):
  1. Guest opens the RSVP link
  2. Guest types their name to search
  3. Guest selects: Going / Not Going
  4. If going, guest selects meal preference (if enabled by client)
  5. If the guest has a +1, the +1 can also respond in the same flow
- Client sees live RSVP summary: Total invited / Confirmed / Declined / Pending
- Client can manually override any guest's RSVP status
- Meal preference collection is optional (client toggles on/off)

---

### Client — Supplier Reviews
- After the event date passes, review window opens for booked platform suppliers
- Client can rate (1–5 stars) and leave a text review
- **Verified only**: only clients who booked a supplier through the app can review
- **Supplier can reply** to a review (one reply per review, visible publicly)
- Reviews are visible on the supplier's public profile
- No formal dispute mechanism in v1 — supplier's public reply is their recourse

---

### Supplier — Account & Profile
- **Invite-only onboarding**: admin (developer) creates supplier accounts via the admin panel
- Supplier logs in and sets up their profile:
  - Business name and description
  - Service categories (can offer multiple, e.g. Photography + Videography)
  - Service area / location(s)
  - Contact details
  - Portfolio photos (images only, no video in v1)
  - Social links (Facebook, Instagram — common for PH suppliers)
- Profile is publicly visible to clients

---

### Supplier — Packages
- Define one or more packages:
  - Package name
  - Description (what's included)
  - Pricing option: **fixed price** (₱X) OR **starting at** (₱X+, contact for full quote)
  - Optional add-ons with individual pricing
- Packages are the primary data source for the AI inquiry assistant

---

### Supplier — Booking & Availability
- Supplier views incoming inquiry threads in their dashboard
- Supplier can:
  - Reply manually to any inquiry thread
  - **Mark a client as "Booked"** — confirms the booking
  - Mark an inquiry as "Not Available" (declines without booking)
- When marked Booked:
  - Event date/time is blocked on supplier's calendar
  - Client receives a notification
  - Client's checklist item auto-updates to Booked ✓
- Supplier manually marks dates as available or blocked on their calendar
- Cancellations in v1 are handled offline — no in-app cancel action

---

### Supplier — Inquiry Management
- Dashboard shows all inquiry threads (new, replied, booked, declined)
- AI auto-handles new inquiries instantly
- Supplier notified (email) when a new inquiry arrives
- Supplier can jump in and reply manually at any point

---

### Admin Panel (Developer-only)
- Create and manage supplier accounts (invite-only onboarding)
- Activate / deactivate supplier profiles
- Manage supplier categories (add, rename, reorder)
- View all registered clients and events
- Basic platform stats (total clients, suppliers, bookings, inquiries)

---

## v2 Features (Deferred)

| Feature | Why Deferred |
|---------|--------------|
| Multiple events per account | One event sufficient for v1; coordinators are v2 users |
| Mobile app (iOS/Android) | Web-first to validate; mobile is a large effort |
| Co-planning (shared event access for couples) | Single-user sufficient for v1 |
| Birthday / corporate event templates | Wedding-first; event type is already extensible |
| AI supplier page builder | AI generates supplier's profile/portfolio page |
| AI RSVP page builder | Shareable, designed RSVP landing page |
| Seating chart | Complex UI; basic guest list ships first |
| Google Calendar sync | Supplier calendar sync with external calendars |
| Push notifications | Email notifications sufficient for v1 |
| Tagalog AI responses | English-first for v1 |
| In-app cancellation flow | Manual process sufficient for early stage |
| Post-event archive state | Decide once event lifecycle is clearer in v1 |

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing | Legal/financial risk; budget *tracking* is the value, not payments |
| Real-time chat | AI + manual reply thread covers the need |
| Video uploads | Storage costs; photos only for v1 |
| Supplier self-registration | Invite-only maintains quality; self-serve is v2+ |
| Multi-language (Tagalog) | PH market is English-comfortable; localize later |
| Dispute / review removal | Supplier reply is sufficient recourse for v1 |
| Monetization | Free until traction; model TBD |

---

## Tech Stack (Recommended — Zero Budget)

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Next.js 15 (React) | Full-stack, free, great ecosystem, Vercel-native |
| **Backend** | Next.js API Routes | Unified stack, no separate server needed |
| **Database** | PostgreSQL via **Supabase** | Free tier: auth + DB + file storage + real-time |
| **Auth** | Supabase Auth | Email/password for clients and suppliers |
| **File Storage** | Supabase Storage | Free 1GB — receipts, contracts, portfolio photos |
| **AI** | Gemini 1.5 Flash (Google) | Generous free tier (1,500 req/day); switch to Claude Haiku if needed |
| **Hosting** | Vercel | Free tier, auto-deploy from GitHub |
| **Email** | Resend (free tier) | RSVP links, inquiry notifications, booking confirmations |

> **AI cost note:** Gemini 1.5 Flash is free up to 1,500 requests/day — sufficient to launch
> and validate before incurring any AI cost. Rate limit per client to protect the quota.

**Estimated monthly cost at launch:** ~₱0 — all free tiers.

---

## Legal / Compliance Note

The app collects personal data (guest names, contacts, contracts, financial records).
The **Philippine Data Privacy Act of 2012 (RA 10173)** applies. Before public launch:
- Privacy Policy required
- Terms of Service required
- Data handling and retention policy
- User consent on signup

---

## Supplier Categories (Philippines — Wedding)

- Photography
- Videography
- Venue / Reception Hall
- Catering
- Hair & Make-up
- Florist / Floral Arrangement
- Host / Emcee
- Wedding Gown / Bridal Wear
- Barong / Men's Formal Wear
- Wedding Cake / Dessert
- Invitation & Printing
- Sound System
- Lights & Décor
- Transportation / Car Rental
- Hotel / Accommodation Block
- Wedding Coordinator / Planner

---

## Known Constraints

- Solo developer, no budget — free tiers only until traction
- Community project intended for public use
- Web-only for v1, mobile deferred
- Supplier base starts at zero — offline supplier entry bridges the gap

---

## Inspiration

- **Functionality**: Personal wedding planning pain points
- **Budget UX**: GCash / wallet apps — deposit, remaining balance, spend breakdown
- **Supplier browsing**: Shopee / Lazada — browse, filter, compare
- **Community trust**: Verified reviews like Airbnb / Agoda
- **AI inquiry**: Knowledgeable sales assistant who knows your situation and the supplier's offering

---

## All Decisions Made

| Decision | Answer |
|----------|--------|
| Booking confirmation | Supplier marks client as "Booked"; date auto-blocks |
| Early adoption | Client can manually add offline suppliers |
| Supplier onboarding | Invite-only, developer-managed via admin panel |
| Event types v1 | Wedding only; data model is event-type-extensible |
| Multiple events | One per account in v1 |
| Venues | Multiple locations per event (ceremony, reception, etc.) |
| Event time | Date + time captured (needed for supplier availability) |
| RSVP | Shareable link; guest searches name, selects Going/Not Going; +1 supported |
| Meal preference | Optional toggle, collected in the RSVP flow |
| Budget detail | Deposit + remaining balance + due date per supplier |
| Checklist types | Supplier tasks + personal to-do tasks |
| Cancellation | Manual for v1; no in-app cancel action |
| AI guardrail | AI cannot confirm bookings; supplier always confirms |
| AI cost | Gemini free tier with per-client rate limiting |
| Supplier pricing | Fixed price OR "starting at" option |
| Supplier decline | "Not Available" action in supplier dashboard |
| Supplier review reply | Supplier can post one public reply per review |
| Post-event state | TBD in v2 |
| Admin panel | Developer-only panel for supplier and platform management |
| Data privacy | RA 10173 compliance required before public launch |
