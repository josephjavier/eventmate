# EventMate

## What This Is

EventMate is a wedding planning platform for the Philippine market that connects couples with
event suppliers in one place. Clients manage their entire event — checklist, budget, guest list,
file storage, and supplier discovery — while suppliers list their packages and availability.
An AI assistant bridges the two by answering client inquiries using supplier package data and
the client's own event context.

## Core Value

A couple planning their wedding should never need to leave the app — every supplier, every peso,
every guest, and every contract lives in one place.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Client — Account & Event**
- [ ] Client can create an account and set up one active event (wedding)
- [ ] Event stores type, date, time, and multiple locations (ceremony, reception, etc.)
- [ ] Dashboard shows countdown to event, checklist progress, and budget summary

**Client — Checklist**
- [ ] Client starts from a pre-built wedding checklist template
- [ ] Client can add, remove, and customize checklist items
- [ ] Checklist supports two item types: supplier tasks and personal to-do tasks
- [ ] Supplier task items link to a platform or offline supplier and track status: Pending → Inquired → Booked
- [ ] Personal task items track status: Pending → Done
- [ ] When a supplier confirms a booking, the linked checklist item auto-updates to Booked

**Client — Budget Tracking**
- [ ] Client sets a total event budget broken down by category
- [ ] Each expense entry tracks: total package price, deposit paid, remaining balance, balance due date
- [ ] Client can upload a receipt (image or PDF) per payment entry
- [ ] Dashboard shows total budget / total committed / total paid / remaining balance
- [ ] Alert when a category exceeds its allocated budget

**Client — File Storage**
- [ ] Client can upload contracts, receipts, and quotations (PDF or image) per event
- [ ] Files are tagged to a supplier or checklist item
- [ ] General event files (not tied to a supplier) are stored under the event

**Client — Supplier Discovery**
- [ ] Client can browse platform suppliers filtered by category, location, availability, and price range
- [ ] Client can search for a supplier by name
- [ ] Client can view a supplier's full profile: details, packages, portfolio photos, and reviews
- [ ] Client can manually add an offline supplier (name, contact, category, price, notes) to any checklist item

**Client — AI Inquiry**
- [ ] Each platform supplier profile has an AI-powered inquiry chat
- [ ] AI has context of the supplier's packages, prices, and availability
- [ ] AI has context of the client's event: type, date, time, locations, and budget
- [ ] Supplier can also reply manually in the same inquiry thread
- [ ] AI is rate-limited per client to control API costs
- [ ] AI cannot confirm bookings — supplier always confirms

**Client — Guest List & RSVP**
- [ ] Client can add guests by name and mark guests as having a +1
- [ ] Client can generate a shareable RSVP link for the event
- [ ] Guest opens the link, searches their name, and selects Going / Not Going (no login required)
- [ ] Guest with a +1 can enter the +1's name and response in the same flow
- [ ] Meal preference collection is optional (client toggles on/off per event)
- [ ] Client sees live RSVP summary and can manually override any guest's status

**Client — Supplier Reviews**
- [ ] Client can rate and review a supplier after the event date passes (1–5 stars + text)
- [ ] Only clients who booked a supplier through the app can leave a review
- [ ] Supplier can post one public reply per review
- [ ] Reviews are visible on the supplier's public profile

**Supplier — Profile & Packages**
- [ ] Supplier logs in and sets up their profile: business name, description, categories, service area, contact, portfolio photos, social links
- [ ] Supplier defines packages with name, description, and pricing (fixed or "starting at")
- [ ] Supplier can define optional add-ons with individual pricing

**Supplier — Bookings & Availability**
- [ ] Supplier views all inquiry threads in their dashboard
- [ ] Supplier can reply manually to any inquiry thread
- [ ] Supplier can mark a client as "Booked" — auto-blocks the date, notifies the client, updates checklist
- [ ] Supplier can mark an inquiry as "Not Available" to decline
- [ ] Supplier manually manages their availability calendar

**Admin Panel**
- [ ] Admin can create and manage supplier accounts (invite-only onboarding)
- [ ] Admin can activate or deactivate supplier profiles
- [ ] Admin can manage supplier categories
- [ ] Admin can view all clients, events, and basic platform stats

### Out of Scope

- Payment processing — legal/financial risk; budget tracking is the value, not payments
- Video uploads for supplier portfolio — storage costs; photos only for v1
- Supplier self-registration — invite-only maintains quality; self-serve is v2+
- Real-time chat infrastructure — AI + manual reply thread covers the need
- Multi-language (Tagalog) — PH market is English-comfortable; localize in v2
- In-app cancellation flow — manual process sufficient for early stage
- Post-event archive state — deferred; decide once v1 lifecycle is clearer
- Monetization — free until traction; model TBD

## Context

- **Origin**: Built by a couple planning their own 2027 wedding, solving real personal pain points
- **Market**: Philippines — Philippine Peso (₱), local supplier categories (photographers, videographers,
  venues, caterers, hair & make-up, florists, hosts, gown/barong, cake, invitations, sound, lights,
  transportation, accommodations, coordinators)
- **Bootstrap strategy**: Clients can add offline suppliers manually from day 1 — app is useful
  before a single platform supplier is onboarded. This bridges the cold-start problem.
- **Supplier adoption**: Invite-only — developers discuss the platform with suppliers before
  onboarding. Starts small, maintains quality.
- **Legal**: Philippine Data Privacy Act (RA 10173) applies — privacy policy, terms of service,
  and user consent required before public launch.

## Constraints

- **Budget**: Zero — free tiers only (Supabase, Vercel, Gemini API, Resend) until traction
- **Team**: Solo developer
- **Platform**: Web-only for v1; mobile deferred to v2
- **Event scope**: Wedding events only for v1; architecture is event-type-extensible for v2
- **AI cost**: Gemini 1.5 Flash free tier (1,500 req/day); rate-limited per client; switch to
  Claude Haiku if usage outgrows free tier
- **Storage**: Supabase free tier (1GB); images and PDFs only, no video

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supplier onboarding is invite-only | Quality control; avoids spam listings before community trust is built | — Pending |
| Supplier marks client as "Booked" | Supplier has the ground truth on their own availability | — Pending |
| Offline supplier entry from day 1 | Solves cold-start: app is useful before supplier base exists | — Pending |
| One event per client account (v1) | Reduces complexity; weddings are a one-at-a-time use case | — Pending |
| Multiple locations per event | Weddings have ceremony + reception as distinct locations with different times | — Pending |
| RSVP via shareable link, no guest login | Lowest friction for guests; no account creation barrier | — Pending |
| Deposit + balance tracking in budget | PH suppliers require deposits; tracking both is the real use case | — Pending |
| Two checklist item types | Not everything on a wedding checklist involves a supplier | — Pending |
| AI cannot confirm bookings | Prevents AI from making commitments the supplier hasn't agreed to | — Pending |
| Gemini 1.5 Flash for AI (free tier) | Zero AI cost at launch; validated before incurring spend | — Pending |
| Supplier can reply to reviews | Gives suppliers recourse without a formal dispute mechanism | — Pending |
| "Starting at" pricing option | PH suppliers often don't publish fixed prices publicly | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-11 after initialization*
