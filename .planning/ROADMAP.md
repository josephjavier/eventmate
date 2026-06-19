# Roadmap: EventMate

## Overview

EventMate is built in five vertical slices, each delivering a complete, user-facing capability. Phase 1 — the most critical — makes the app fully useful to a couple before a single platform supplier exists, solving the cold-start problem. Phase 2 unlocks the marketplace by onboarding suppliers through an invite-only admin panel. Phase 3 exposes those suppliers to clients through filtered discovery. Phase 4 adds the app's key differentiator: AI-powered inquiry with streaming responses and atomic booking confirmation. Phase 5 closes the loop with verified post-event reviews. All 75 v1 requirements map to exactly one phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Planning Tools** - Fully functional planning app — auth, event setup, checklist with offline supplier entry, budget, file storage, guest list, and RSVP — useful before any platform supplier is onboarded
- [ ] **Phase 2: Admin Panel & Supplier System** - Invite-only supplier onboarding via admin panel, supplier profile and package setup, and availability calendar management
- [ ] **Phase 3: Supplier Discovery** - Clients can browse and filter platform suppliers by category, location, price, and availability on their specific event date
- [ ] **Phase 4: Inquiry, AI & Booking** - AI-powered streaming inquiry chat, supplier manual reply, atomic booking confirmation, and booking-related email notifications
- [ ] **Phase 5: Reviews** - Verified post-event reviews gated to confirmed bookings, with supplier reply capability

## Phase Details

### Phase 1: Foundation & Planning Tools
**Goal**: A couple can fully plan their wedding — checklist, budget, guests, and files — before any platform supplier is onboarded
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-07, EVENT-01, EVENT-02, EVENT-03, EVENT-04, COPL-01, COPL-02, COPL-03, CHECK-01, CHECK-02, CHECK-03, CHECK-04, CHECK-05, CHECK-06, CHECK-07, BUDG-01, BUDG-02, BUDG-03, BUDG-04, BUDG-05, BUDG-06, FILE-01, FILE-02, FILE-03, FILE-04, RSVP-01, RSVP-02, RSVP-03, RSVP-04, RSVP-05, RSVP-06, RSVP-07, RSVP-08, DISC-07, NOTF-04
**Success Criteria** (what must be TRUE):
  1. A couple can register, create their wedding event with a date, time, and multiple locations (ceremony, reception), and see a live countdown dashboard with checklist completion percentage and budget summary
  2. Couple can work through a pre-built Philippine wedding checklist, add or remove custom items, and attach an offline supplier (found via Facebook or referrals) to any checklist item — the app delivers full planning value before any platform supplier is onboarded
  3. Couple can set a total budget, allocate amounts per checklist category, enter deposit paid and remaining balance per supplier expense, and see a visual alert when any category exceeds its allocated amount
  4. Couple can upload contracts, receipts, and quotations (PDF, JPG, PNG) tagged to a supplier or checklist item, and download any uploaded file at any time
  5. A guest opens a shareable RSVP link without creating an account, searches their name, and responds Going or Not Going; the couple sees a live RSVP summary and can manually override any guest's status
**Plans**: 9 plans (Walking Skeleton Waves 1-4, feature slices Waves 5-6)

Plans:
- [x] 01-01-PLAN.md — Project scaffold, dependencies, Vitest harness (Wave 1)
- [ ] 01-02-PLAN.md — DB schema + RLS migration + schema push (Wave 2)
- [ ] 01-03-PLAN.md — Core library: Supabase clients, DAL, currency/token utils, middleware (Wave 3)
- [ ] 01-04-PLAN.md — Auth + onboarding + dashboard shell + Vercel deploy (closes skeleton) (Wave 4)
- [ ] 01-05-PLAN.md — Checklist slice: PH template, custom items, offline supplier (Wave 5)
- [ ] 01-06-PLAN.md — Budget slice: centavos tracking, allocation, over-budget alert (Wave 5)
- [ ] 01-07-PLAN.md — File storage slice: private bucket, dropzone, signed URLs (Wave 5)
- [ ] 01-08-PLAN.md — Guest list + public RSVP slice (Wave 5)
- [ ] 01-09-PLAN.md — Co-planner invite + RSVP notification email (Wave 6)
**UI hint**: yes

### Phase 2: Admin Panel & Supplier System
**Goal**: Admin can onboard vetted suppliers who then build their full profiles, packages, and availability calendar on the platform
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-05, AUTH-06, ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, SUPP-01, SUPP-02, SUPP-03, SUPP-04, BOOK-04
**Success Criteria** (what must be TRUE):
  1. Admin can log in to the admin panel, create a supplier account with invite-only credentials, manage supplier categories (add, rename, reorder), and view platform stats (total clients, suppliers, bookings, inquiries)
  2. Admin can activate or deactivate any supplier profile and view all registered client accounts with their events
  3. Supplier can log in with admin-provided credentials and set up their full profile — business name, description, service categories, service area, portfolio photos, contact details, and social links
  4. Supplier can define packages with fixed or "starting at ₱X" pricing and optional add-ons, and manage their availability calendar by manually blocking or unblocking specific dates
**Plans**: TBD
**UI hint**: yes

### Phase 3: Supplier Discovery
**Goal**: Clients can browse, filter, and search platform suppliers to find the right match for their wedding
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, BOOK-05
**Success Criteria** (what must be TRUE):
  1. Client can browse all platform suppliers and filter simultaneously by category (e.g., Photography, Catering), city, and price range
  2. Client can filter suppliers by availability on their specific event date and time — unavailable suppliers are excluded from results
  3. Client can search for a supplier by name and view their full profile showing business details, packages, portfolio photos, and reviews
**Plans**: TBD
**UI hint**: yes

### Phase 4: Inquiry, AI & Booking
**Goal**: Clients can inquire with platform suppliers through an AI-powered streaming chat, and suppliers can confirm bookings atomically — updating the checklist, blocking their calendar, and notifying the client in a single operation
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: AINQ-01, AINQ-02, AINQ-03, AINQ-04, AINQ-05, AINQ-06, AINQ-07, BOOK-01, BOOK-02, BOOK-03, NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. Client can open an AI-powered inquiry chat on any supplier profile and receive streaming responses (tokens appear as typed) that reference the supplier's packages, prices, and the client's event date, locations, and budget
  2. The AI will not confirm any booking — it explicitly tells the client that only the supplier confirms; clients who hit the per-day rate limit see a clear "AI temporarily unavailable" message rather than a generic error
  3. Supplier can view all inquiry threads in their dashboard, reply manually in any thread, and mark a client as Booked with one action — which atomically blocks their calendar date, updates the linked checklist item to Booked, and emails the client a confirmation
  4. Client receives an email when a supplier confirms their booking or marks them as Not Available; supplier receives an email when a new client inquiry arrives
**Plans**: TBD
**UI hint**: yes

### Phase 5: Reviews
**Goal**: Clients can leave verified post-event supplier reviews that build trust for future couples choosing suppliers on the platform
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: REVW-01, REVW-02, REVW-03, REVW-04
**Success Criteria** (what must be TRUE):
  1. After the event date has passed, a client with a confirmed booking through the app can submit a 1–5 star rating and written review for that supplier
  2. A client without a confirmed booking through the app cannot access the review submission form for any supplier — the action is simply not available to them
  3. Supplier can post one public reply per review on their profile
  4. All reviews and supplier replies are visible to any logged-in client viewing the supplier's public profile
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Planning Tools | 1/9 | In Progress | - |
| 2. Admin Panel & Supplier System | 0/TBD | Not started | - |
| 3. Supplier Discovery | 0/TBD | Not started | - |
| 4. Inquiry, AI & Booking | 0/TBD | Not started | - |
| 5. Reviews | 0/TBD | Not started | - |
