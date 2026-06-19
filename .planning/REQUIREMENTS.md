# Requirements: EventMate

**Defined:** 2026-06-11
**Core Value:** A couple planning their wedding should never need to leave the app — every supplier, every peso, every guest, and every contract lives in one place.

---

## v1 Requirements

### Authentication (AUTH)

- [ ] **AUTH-01**: User (client) can create an account with email and password
- [ ] **AUTH-02**: User can log in and remain logged in across browser sessions
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: User can reset their password via an email link
- [ ] **AUTH-05**: Supplier can log in with credentials provided by the admin
- [ ] **AUTH-06**: Admin can log in to the admin panel with a separate admin account
- [x] **AUTH-07**: Guest can access the RSVP page via a shareable link without creating an account

### Event Management (EVENT)

- [ ] **EVENT-01**: Client can create one active event with type (Wedding), date, and time
- [ ] **EVENT-02**: Client can add multiple locations to an event (each with name, address, and role e.g. "Church", "Reception")
- [ ] **EVENT-03**: Client can edit event details (date, time, locations) after creation
- [ ] **EVENT-04**: Client dashboard shows event countdown, checklist completion percentage, and budget summary

### Co-Planner / Partner Access (COPL)

- [ ] **COPL-01**: Client can invite a partner/co-planner by email to share the event
- [ ] **COPL-02**: Invited co-planner receives an email invitation and can accept to gain access
- [ ] **COPL-03**: Co-planner has full edit access to the shared event (checklist, budget, guests, files)

### Checklist (CHECK)

- [ ] **CHECK-01**: Client can start from a pre-built Philippine wedding checklist template
- [ ] **CHECK-02**: Client can add custom items to the checklist at any time
- [ ] **CHECK-03**: Client can remove or rename any checklist item
- [ ] **CHECK-04**: Checklist supports supplier task items — each linked to a supplier (platform or offline) with status: Pending → Inquired → Booked ✓
- [ ] **CHECK-05**: Checklist supports personal task items — plain to-dos with no supplier, status: Pending → Done ✓
- [ ] **CHECK-06**: When a supplier confirms a booking, the linked checklist item automatically updates to Booked ✓
- [ ] **CHECK-07**: Pre-built wedding template includes PH-specific items (church/ceremony, barong/gown, CENOMAR/PSA requirements, etc.)

### Budget Tracking (BUDG)

- [ ] **BUDG-01**: Client can set a total event budget in Philippine Peso (₱)
- [ ] **BUDG-02**: Client can allocate a budget amount per checklist category
- [ ] **BUDG-03**: Each supplier expense entry records: total package price, deposit paid (amount + date), remaining balance, and balance due date
- [ ] **BUDG-04**: Client can upload a receipt (image or PDF) attached to each payment entry
- [ ] **BUDG-05**: Budget dashboard shows: total budget / total committed / total paid / remaining balance
- [ ] **BUDG-06**: Client sees a visual alert when a category exceeds its allocated budget

### File Storage (FILE)

- [ ] **FILE-01**: Client can upload files (PDF, JPG, PNG) tagged to a supplier or checklist item
- [ ] **FILE-02**: Client can upload general event files not tied to a specific supplier
- [ ] **FILE-03**: Client can view and download any of their uploaded files
- [ ] **FILE-04**: Accepted file types are PDF, JPG, and PNG (no video)

### Supplier Discovery (DISC)

- [ ] **DISC-01**: Client can browse platform suppliers filtered by category (e.g. Photography, Catering)
- [ ] **DISC-02**: Client can filter suppliers by location / city
- [ ] **DISC-03**: Client can filter suppliers by availability on their specific event date and time
- [ ] **DISC-04**: Client can filter suppliers by price range
- [ ] **DISC-05**: Client can search for a supplier by name
- [ ] **DISC-06**: Client can view a supplier's full profile: business details, packages, portfolio photos, and reviews
- [ ] **DISC-07**: Client can manually add an offline supplier (name, contact, category, price, notes) to any checklist item for suppliers not yet on the platform

### Supplier Profile & Packages (SUPP)

- [ ] **SUPP-01**: Supplier can set up their profile with business name, description, service categories, service area, contact details, portfolio photos (images only), and social media links
- [ ] **SUPP-02**: Supplier can define one or more packages with name, description, and pricing (fixed ₱ amount or "starting at ₱X")
- [ ] **SUPP-03**: Supplier can define optional add-ons per package with individual pricing
- [ ] **SUPP-04**: Supplier profile and packages are publicly visible to logged-in clients

### Bookings & Availability (BOOK)

- [ ] **BOOK-01**: Supplier can view all client inquiry threads in their dashboard with status (New, Replied, Booked, Declined)
- [ ] **BOOK-02**: Supplier can mark a client as "Booked" — this atomically: creates the booking, blocks the event date/time on the supplier's calendar, notifies the client by email, and updates the linked checklist item to Booked ✓
- [ ] **BOOK-03**: Supplier can mark an inquiry as "Not Available" to decline — client is notified by email
- [ ] **BOOK-04**: Supplier can manually block or unblock dates on their availability calendar
- [ ] **BOOK-05**: Availability filter in supplier discovery excludes suppliers with a confirmed booking on the client's event date and time

### AI Inquiry Assistant (AINQ)

- [ ] **AINQ-01**: Each platform supplier profile has an AI-powered inquiry chat accessible to logged-in clients
- [ ] **AINQ-02**: AI is provided the supplier's packages, prices, and blocked/available dates as context
- [ ] **AINQ-03**: AI is provided the client's event type, date, time, locations, and budget as context
- [ ] **AINQ-04**: Supplier can read and reply manually in any inquiry thread alongside the AI
- [ ] **AINQ-05**: AI inquiry responses stream to the client (not batched) to handle server timeout constraints
- [ ] **AINQ-06**: AI is instructed via system prompt that it cannot confirm bookings — the supplier always confirms
- [ ] **AINQ-07**: AI inquiry is rate-limited per client to protect the free-tier API quota

### Guest List & RSVP (RSVP)

- [x] **RSVP-01**: Client can add guests by name to the event guest list
- [x] **RSVP-02**: Client can mark any guest as having a +1 and record the +1's name
- [x] **RSVP-03**: Client can generate a shareable RSVP link for the event
- [x] **RSVP-04**: Guest can open the RSVP link, search their name (with a secondary disambiguating field for common Filipino names), and select Going / Not Going — no account required
- [x] **RSVP-05**: A guest with a +1 can enter the +1's name and RSVP response in the same flow
- [x] **RSVP-06**: Client can optionally enable meal preference collection per event; guests select their meal in the RSVP flow when enabled
- [x] **RSVP-07**: Client can view a live RSVP summary: total invited / confirmed / declined / pending
- [x] **RSVP-08**: Client can manually override any guest's RSVP status

### Supplier Reviews (REVW)

- [ ] **REVW-01**: Client can leave a rating (1–5 stars) and written review for a platform supplier after the event date has passed
- [ ] **REVW-02**: Only clients who have a confirmed booking with a supplier through the app can leave a review for that supplier
- [ ] **REVW-03**: Supplier can post one public reply to each review on their profile
- [ ] **REVW-04**: Reviews and supplier replies are visible on the supplier's public profile

### Notifications (NOTF)

- [ ] **NOTF-01**: Client receives an email when a supplier confirms their booking
- [ ] **NOTF-02**: Client receives an email when a supplier marks their inquiry as Not Available
- [ ] **NOTF-03**: Supplier receives an email when a new client inquiry arrives
- [ ] **NOTF-04**: Invited co-planner receives an email invitation with a link to join the event

### Admin Panel (ADMIN)

- [ ] **ADMIN-01**: Admin can create a supplier account (email + temporary password) via the admin panel
- [ ] **ADMIN-02**: Admin can activate or deactivate a supplier's profile
- [ ] **ADMIN-03**: Admin can manage supplier categories (add, rename, reorder)
- [ ] **ADMIN-04**: Admin can view all registered client accounts and their events
- [ ] **ADMIN-05**: Admin can view basic platform statistics: total clients, suppliers, bookings, and inquiries

---

## v2 Requirements

### Multiple Events
- **MEVT-01**: Client can manage multiple active events under one account
- **MEVT-02**: Coordinators and wedding planners can manage events on behalf of clients

### Expanded Event Types
- **EVTP-01**: Birthday party checklist template available
- **EVTP-02**: Corporate event checklist template available

### Post-Event
- **POST-01**: Event automatically moves to an archived state after the event date passes
- **POST-02**: Client can browse archived events as a permanent record

### Mobile App
- **MOBL-01**: iOS application with feature parity to web v1
- **MOBL-02**: Android application with feature parity to web v1

### Enhanced Supplier Discovery
- **ESUPP-01**: Supplier can self-register and go through an approval workflow (no longer invite-only)
- **ESUPP-02**: Supplier availability calendar syncs with Google Calendar

### Enhanced Guest Management
- **GUST-01**: Seating chart tool — assign guests to tables
- **GUST-02**: AI-generated RSVP landing page with custom design for the couple

### Enhanced AI
- **EAINQ-01**: AI responds in Filipino (Tagalog) when client messages in Tagalog
- **EAINQ-02**: AI-assisted supplier page builder — AI helps supplier write their profile and packages

### Collaboration
- **COLB-01**: In-app cancellation flow — either party can initiate a cancellation with automated status updates
- **COLB-02**: Coordinator role — third party can be granted access to manage the event alongside the couple

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing | Legal/financial risk; budget *tracking* is the value, not payments |
| Real-time chat infrastructure | AI + manual reply thread covers the need without full chat infra |
| Video uploads for supplier portfolio | Storage costs; photos only for v1 |
| In-app cancellation flow | Manual process sufficient for early stage; v2 |
| Multi-language / Tagalog UI | PH market is English-comfortable; v2 |
| Gift registry | Separate product category; out of scope entirely |
| Wedding website builder | Scope creep; out of scope entirely |
| Seating chart (v1) | Complex UI; v2 after basic guest list ships |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 2 | Pending |
| AUTH-06 | Phase 2 | Pending |
| AUTH-07 | Phase 1 | Pending |
| EVENT-01 | Phase 1 | Pending |
| EVENT-02 | Phase 1 | Pending |
| EVENT-03 | Phase 1 | Pending |
| EVENT-04 | Phase 1 | Pending |
| COPL-01 | Phase 1 | Pending |
| COPL-02 | Phase 1 | Pending |
| COPL-03 | Phase 1 | Pending |
| CHECK-01 | Phase 1 | Pending |
| CHECK-02 | Phase 1 | Pending |
| CHECK-03 | Phase 1 | Pending |
| CHECK-04 | Phase 1 | Pending |
| CHECK-05 | Phase 1 | Pending |
| CHECK-06 | Phase 1 | Pending |
| CHECK-07 | Phase 1 | Pending |
| BUDG-01 | Phase 1 | Pending |
| BUDG-02 | Phase 1 | Pending |
| BUDG-03 | Phase 1 | Pending |
| BUDG-04 | Phase 1 | Pending |
| BUDG-05 | Phase 1 | Pending |
| BUDG-06 | Phase 1 | Pending |
| FILE-01 | Phase 1 | Pending |
| FILE-02 | Phase 1 | Pending |
| FILE-03 | Phase 1 | Pending |
| FILE-04 | Phase 1 | Pending |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |
| DISC-04 | Phase 3 | Pending |
| DISC-05 | Phase 3 | Pending |
| DISC-06 | Phase 3 | Pending |
| DISC-07 | Phase 1 | Pending |
| SUPP-01 | Phase 2 | Pending |
| SUPP-02 | Phase 2 | Pending |
| SUPP-03 | Phase 2 | Pending |
| SUPP-04 | Phase 2 | Pending |
| BOOK-01 | Phase 4 | Pending |
| BOOK-02 | Phase 4 | Pending |
| BOOK-03 | Phase 4 | Pending |
| BOOK-04 | Phase 2 | Pending |
| BOOK-05 | Phase 3 | Pending |
| AINQ-01 | Phase 4 | Pending |
| AINQ-02 | Phase 4 | Pending |
| AINQ-03 | Phase 4 | Pending |
| AINQ-04 | Phase 4 | Pending |
| AINQ-05 | Phase 4 | Pending |
| AINQ-06 | Phase 4 | Pending |
| AINQ-07 | Phase 4 | Pending |
| RSVP-01 | Phase 1 | Pending |
| RSVP-02 | Phase 1 | Pending |
| RSVP-03 | Phase 1 | Pending |
| RSVP-04 | Phase 1 | Pending |
| RSVP-05 | Phase 1 | Pending |
| RSVP-06 | Phase 1 | Pending |
| RSVP-07 | Phase 1 | Pending |
| RSVP-08 | Phase 1 | Pending |
| REVW-01 | Phase 5 | Pending |
| REVW-02 | Phase 5 | Pending |
| REVW-03 | Phase 5 | Pending |
| REVW-04 | Phase 5 | Pending |
| NOTF-01 | Phase 4 | Pending |
| NOTF-02 | Phase 4 | Pending |
| NOTF-03 | Phase 4 | Pending |
| NOTF-04 | Phase 1 | Pending |
| ADMIN-01 | Phase 2 | Pending |
| ADMIN-02 | Phase 2 | Pending |
| ADMIN-03 | Phase 2 | Pending |
| ADMIN-04 | Phase 2 | Pending |
| ADMIN-05 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 75 total (note: initial estimate of 57 was a count error)
- Mapped to phases: 75/75
- Phase 1 — Foundation & Planning Tools: AUTH-01–04, AUTH-07, EVENT-01–04, COPL-01–03, CHECK-01–07, BUDG-01–06, FILE-01–04, RSVP-01–08, DISC-07, NOTF-04 (39 requirements)
- Phase 2 — Admin Panel & Supplier System: AUTH-05–06, ADMIN-01–05, SUPP-01–04, BOOK-04 (12 requirements)
- Phase 3 — Supplier Discovery: DISC-01–06, BOOK-05 (7 requirements)
- Phase 4 — Inquiry, AI & Booking: AINQ-01–07, BOOK-01–03, NOTF-01–03 (13 requirements)
- Phase 5 — Reviews: REVW-01–04 (4 requirements)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-11*
*Last updated: 2026-06-11 — traceability populated after roadmap creation*
