# Feature Landscape

**Domain:** Wedding / event planning platform (client + supplier two-sided marketplace)
**Market:** Philippines
**Researched:** 2026-06-11
**Confidence:** MEDIUM-HIGH — based on direct product knowledge of WeddingWire, The Knot, Zola, Bridebook, Joy, and Appy Couple; web tools unavailable during this session; Philippines-specific patterns from training data on the PH wedding market

---

## Platform Reference: What Each Major App Has

Understanding what exists lets us separate table stakes from traps.

| Feature | WeddingWire / The Knot | Zola | Bridebook | Joy | Appy Couple |
|---------|------------------------|------|-----------|-----|-------------|
| Checklist / timeline | Yes | Yes | Yes | Yes | Partial |
| Budget tracker | Yes | Yes | Yes | Yes | No |
| Guest list | Yes | Yes | Yes | Yes | Yes |
| RSVP (no guest login) | Partial | Yes | Partial | Yes (pioneered) | Yes |
| Vendor/supplier marketplace | Yes (core business) | Yes | Yes | No | No |
| Supplier reviews | Yes (core business) | Yes | Yes | No | No |
| Wedding website builder | Yes | Yes (core) | Yes | Yes (core) | Yes (core) |
| Registry | No | Yes (core) | No | No | No |
| Seating chart | Yes | Yes | No | No | No |
| Partner / co-planner access | Yes | Yes | Yes | Yes | Yes |
| Paper stationery | Yes | Yes | No | No | No |
| Guest photo sharing | No | No | No | Yes (signature) | Yes |
| Day-of push notifications | No | No | No | Yes | Yes |
| AI supplier inquiry | No | No | No | No | No |
| Offline supplier entry | No | No | Partial | No | No |
| Deposit + balance tracking | No | No | No | No | No |

**Key observation:** EventMate's planned scope covers all true table stakes for the planning tool layer and adds real differentiators (AI inquiry, offline suppliers, deposit tracking) that no major platform currently has.

---

## Table Stakes

Features users expect from any wedding planning app. Missing = product feels incomplete or users return to spreadsheets.

### For Clients

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Event setup (date, type, locations) | Foundation for everything else | Low | First thing users do on any platform |
| Dashboard countdown + progress summary | Couples obsessively track days remaining | Low | Checklist % + budget summary + days left |
| Pre-built wedding checklist template | No one wants to build a 50-item list from scratch | Medium | Template must cover PH-specific items (church booking, coordinator, barong/gown, etc.) |
| Custom checklist items | Every wedding is different | Low | Add/remove/rename items |
| Checklist task status tracking | Progress visibility is the core motivation to open the app | Low | Two-state for personal tasks; three-state for supplier tasks |
| Budget tracker with categories | Every couple asks "are we on budget?" constantly | Medium | Category allocation, committed vs. paid breakdown |
| Deposit + remaining balance per supplier | PH suppliers require deposits; tracking both is the actual use case | Medium | Due date for balance is critical for PH market |
| Category overspend alert | Prevents unpleasant surprises late in planning | Low | Simple threshold comparison, no ML needed |
| Guest list management | Required for any RSVP flow | Low | Name, +1, meal preference toggle |
| RSVP via shareable link (no guest login) | Guest accounts create abandonment; no-login is now the baseline expectation | Medium | Joy popularized this; now expected |
| Supplier browse with category + location + price filter | Discovery is one of the top two reasons couples open planning apps | Medium-High | Must cover all PH supplier categories |
| Supplier profile (bio, packages, portfolio, contact) | Clients need enough info to decide whether to inquire | Medium | Photos, packages with "starting at" option, social links |
| Supplier availability indicator | Before inquiring, clients want to know if the date is even open | Low | Binary: Available / Booked on your date (or "Not set") |
| Supplier inquiry / messaging thread | All booking conversations need a home | Medium | Async thread; AI layer sits on top |
| File storage (contracts, quotations, receipts) | PH couples accumulate PDFs and photos from suppliers; currently scattered across email/Messenger | Medium | Tagged to supplier or checklist item |
| Supplier reviews (verified, post-event only) | Trust signal for new users discovering suppliers; expected on any marketplace | Medium | Gate to verified bookings only — lower volume, higher trust |
| Offline supplier entry | Couples discover suppliers outside the platform (Facebook, referrals); they need one place to track everything | Low | Name, category, contact, price notes — no profile required |
| Email notifications | Web-only app has no push notifications; email is the only async channel | Low-Medium | Inquiry replies, booking confirmations, RSVP updates, budget alerts |
| Partner / co-planner access | Wedding planning is a joint activity; single-user accounts create a coordination problem between couples | Medium | Shared event access; both partners see all data; notifications go to both |

**Gap identified:** Partner access and email notifications are not explicitly listed in PROJECT.md Active requirements. Both are table stakes and should be added.

### For Suppliers

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Supplier profile setup | Without a profile there is nothing to show clients | Medium | Business name, bio, categories, service area, contact, social links |
| Package definition with pricing | The package model is how PH suppliers think about their offerings | Medium | Fixed or "starting at"; add-ons optional |
| Portfolio photo upload | Couples decide to inquire primarily based on photos | Low | Images only (no video in v1) |
| Inquiry dashboard (all threads) | Suppliers need to see all active conversations in one place | Medium | List of threads with client name, event date, last message |
| Manual reply in inquiry thread | AI handles initial fielding; supplier closes with human judgment | Medium | Simple text reply; shares thread with client |
| Booking confirmation action | Supplier owns the ground truth on their own availability | Low | "Mark as Booked" button triggers date block + client notification |
| Availability calendar management | Suppliers need to reflect reality (may have bookings from other sources) | Medium | Manual date blocking + auto-block on booking confirmation |
| "Not Available" / decline action | Supplier needs to close threads they cannot serve | Low | Single action; notifies client |

### For Admin

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Supplier account creation (invite-only) | Quality control mechanism for early stage | Low | Create account + send invite link |
| Supplier activation / deactivation | Remove problematic suppliers without account deletion | Low | Toggle visible flag |
| Category management | Supplier categories need to evolve as the platform matures | Low | CRUD for category labels |
| Basic platform stats | Developer needs visibility into usage | Low | User count, event count, inquiry count, booking count |

---

## Differentiators

Features that set EventMate apart from existing platforms. Not universally expected, but create real competitive advantage in the PH market.

| Feature | Value Proposition | Complexity | Available in Competing Platforms? | Notes |
|---------|-------------------|------------|----------------------------------|-------|
| AI-powered supplier inquiry (context-aware) | Instant answers about packages, pricing, and availability without waiting for supplier reply; AI knows the couple's event details | High | No — none of the major platforms have this | Context injection: supplier packages + client event date/budget/locations. Rate-limited to control Gemini API cost. Supplier always confirms — AI cannot book. |
| Offline supplier tracking alongside platform suppliers | Couples find suppliers everywhere (Facebook, Instagram, referrals, bridal fairs); they need one tracker, not two | Low | No — WeddingWire/The Knot only show their advertisers; Bridebook partially | Form entry: name, category, contact, price, notes. Appears in same checklist view as platform suppliers. |
| Checklist item auto-updates on supplier confirmation | Reduces manual status tracking; planning state stays accurate without effort | Medium | No — no platform ties their checklist to booking confirmations | Requires webhook/event from booking action to checklist item update |
| Deposit + balance tracking with due dates | PH suppliers require deposits; tracking "how much is left and when is it due" is the actual mental burden | Medium | No — all budget trackers are generic expense categories | Linked to supplier booking; due date field prevents missed balance payments |
| Budget tracker linked to booking confirmation flow | Committed spend auto-registers when supplier is marked booked | Medium | No — budget and vendor tools are disconnected on every major platform | Can be light integration: booking confirmation prompts client to log the expense |
| "Starting at" package pricing | PH suppliers rarely publish complete price lists publicly; "starting at" reflects reality | Low | No — most platforms require a fixed price or nothing | Toggle per package |
| Verified-only reviews gated to confirmed bookings | Produces higher-trust reviews than open review systems | Low | Partial — some platforms do this, but not all | The constraint is a feature: fewer but more credible reviews |
| Philippines-first supplier categories | International platforms do not cover: hosts/emcees, barong/gown, church venue booking, hair & makeup travel-to-venue model, sound and lights AV rental, full vs. day-of coordinator | Low | No international platform serves PH well | Category list is configuration, not code |
| Bootstrap cold-start via offline suppliers | App is useful from day one even before a single platform supplier is onboarded | Low | No | Offline suppliers make the checklist and budget tracker work immediately |

### Philippines-Market Context (Informs Differentiator Depth)

These are not features, but they explain why the differentiators above matter more in PH than in US/UK markets:

- **Deposit culture**: 30-50% deposit on booking is standard PH practice; balance due 30-90 days before event. No international platform tracks this correctly.
- **Package culture**: PH suppliers package their services (photographer + video + same-day edit + debut album = one package). Itemized à la carte pricing is rare.
- **Facebook-first discovery**: Most PH suppliers maintain Facebook pages as their primary web presence. Many have no website. Social links on supplier profile are not decorative — they are the discovery path clients already use.
- **Supplier communication via Messenger**: PH couples currently use Facebook Messenger to inquire with suppliers. The AI inquiry thread intercepts this workflow inside the app — a direct substitute for the existing behavior.
- **June–December peak season**: High-volume season creates supplier scarcity, making availability checking a high-stakes feature.
- **Multi-location weddings**: Ceremony (church) + reception (venue) + getting-ready location are often three distinct addresses. Multiple locations per event is correctly planned.
- **Coordinator as orchestrator**: Full wedding coordinators in PH manage all other suppliers. Couples who hire a coordinator may use EventMate less intensively — design the app to be useful with or without a coordinator.

---

## Anti-Features

Things to deliberately NOT build. Each one is a scope trap that looks useful but costs more than it returns.

### Anti-Feature 1: Wedding Website Builder
**What it is:** A tool that lets couples create a public-facing wedding website (custom URL, theme, photo gallery, RSVP embed, accommodation info, schedule).

**Why it looks tempting:** Every major platform has it. Zola's whole brand started as a website + registry tool. Joy is a website builder first.

**Why it's a trap:**
- It is an entire separate product: custom domain/DNS management, SSL provisioning, theme engine, rich text editor, photo gallery, mobile preview, password protection, SEO meta tags, guest-facing separate from planning-facing.
- Building a website builder that doesn't feel cheap is a 3-6 month project for a solo developer.
- EventMate's value is planning and supplier discovery — the website is a marketing artifact, not a planning tool.
- Supabase free tier storage would be consumed by guest-facing photo galleries immediately.

**What to do instead:** Add a "Wedding Website" field on the event setup form — a URL where clients paste their Joy/Appy Couple/Google Sites link. Costs one database column.

---

### Anti-Feature 2: Gift Registry
**What it is:** A system where couples create a wish list of gifts (physical products, cash funds, experiences) and guests purchase from it.

**Why it looks tempting:** Zola is famous for it. It seems like a natural extension of event planning.

**Why it's a trap:**
- Registry is a separate business, not a feature: requires merchant relationships, payment processing, logistics, returns, inventory management, and tax handling.
- Zola is essentially an e-commerce company that also offers planning tools — not the other way around.
- Philippines gift culture for weddings often involves cash gifts (loot bags, cash envelopes) rather than registry-based giving.

**What to do instead:** One URL field: "Registry link" on the event, so clients can link to an external registry if they want.

---

### Anti-Feature 3: Seating Chart Tool
**What it is:** A drag-and-drop canvas where couples arrange guests at tables, assign seats, manage table shapes and sizes.

**Why it looks tempting:** WeddingWire and The Knot both have it. Guest list is already built, so it seems like a short hop.

**Why it's a trap:**
- Drag-and-drop canvas UI is notoriously difficult to build correctly across browsers and touch devices.
- Even the major platforms' seating chart tools are widely criticized as buggy and frustrating.
- Most couples end up using a printed diagram, whiteboard, or Excel spreadsheet anyway.
- The value per hour of engineering time is extremely low.
- Caterers and venues have their own seating layouts — couples mostly need a guest count, not a seat assignment.

**What to do instead:** Guest count (already derived from guest list) is the data caterers actually need. RSVP summary with final head count is sufficient.

---

### Anti-Feature 4: Guest Photo Sharing / Photo Wall
**What it is:** A shared gallery where guests upload photos during and after the wedding, viewable by all attendees.

**Why it looks tempting:** Joy's signature feature. Emotionally appealing — "all your wedding photos in one place."

**Why it's a trap:**
- Requires guest uploads, which means storage costs at scale. Supabase free tier is 1GB — one wedding's guest photos can easily exceed this.
- Requires moderation (inappropriate uploads happen).
- Requires image optimization pipeline (guests upload full-resolution phone photos).
- This is a post-event feature; EventMate's value is pre-event planning.
- Existing solutions (Google Photos shared albums, Dropbox) already solve this well.

**What to do instead:** Suggest a Google Photos shared album. One sentence in the app: "Share your wedding photos with guests using [Google Photos link]."

---

### Anti-Feature 5: Day-of Push Notification Coordinator
**What it is:** A system that sends timed push notifications to guests on the wedding day — "Ceremony starts in 30 minutes," "Reception doors open at 6 PM."

**Why it looks tempting:** Joy and Appy Couple have this. It sounds like a premium experience.

**Why it's a trap:**
- Requires Web Push notification infrastructure or a native mobile app (which is out of scope for v1).
- Browser-based push notifications have poor reliability and require explicit opt-in from each guest.
- This is a different product from a planning tool — it is an event coordination tool.
- Guests are usually notified by the couple/coordinator directly; this solves a problem that is already handled.

**What to do instead:** A printable "day-of schedule" export from the checklist — a simple PDF of the timeline. Zero infrastructure cost.

---

### Anti-Feature 6: Open Supplier Self-Registration
**What it is:** Any supplier can create a profile on the platform without invitation.

**Why it looks tempting:** Scales faster; less admin burden; more supplier listings.

**Why it's a trap:**
- Open registration creates spam profiles, fake accounts, and quality dilution immediately.
- Moderation at scale requires tooling and human review time.
- For a new platform, a small set of quality suppliers outperforms a large set of unreliable ones.
- Trust is the primary reason clients would choose EventMate over a Google search.

**What to do instead:** Invite-only through v1 and v2. Build a waitlist form for interested suppliers. Open only when review/verification infrastructure is in place.

---

### Anti-Feature 7: In-App Payment Processing
**What it is:** Clients pay suppliers through the platform using GCash, PayMaya, credit card, or bank transfer.

**Why it looks tempting:** "One place for everything" — money is part of the planning flow.

**Why it's a trap:**
- Payment gateway integration (GCash, PayMaya, Stripe PH) requires BSP registration considerations, KYC, PCI DSS compliance, escrow mechanics, and dispute handling.
- This is not a feature — it is a separate regulated business line.
- Philippines payment preferences vary by supplier; some prefer direct bank transfer, others GCash, others cash.
- Early-stage legal and financial risk is not worth taking.

**What to do instead:** Track the payments (already planned — deposit paid, remaining balance, due date). The money moves outside the app. The tracking inside the app is the value.

---

### Anti-Feature 8: Social / Community Features
**What it is:** Inspiration boards, "real weddings" galleries, Q&A community forums, couple profiles, and social sharing.

**Why it looks tempting:** WeddingWire and The Knot have massive content libraries and community boards. They drive enormous SEO traffic.

**Why it's a trap:**
- Community requires content moderation at scale — a full-time job.
- "Real weddings" galleries are an SEO play for platforms with existing traffic. EventMate starts with no traffic to leverage.
- Pinterest, Instagram, and TikTok have already won the wedding inspiration market. Competing is not realistic.
- Building community dilutes focus from the planning tool, which is the core value.

**What to do instead:** Supplier portfolio photos serve as the "inspiration" layer. Clients discover aesthetics through supplier profiles. No separate inspiration product needed.

---

### Anti-Feature 9: Expanded AI Features (General Wedding Planner AI)
**What it is:** AI that helps with wedding style recommendations, vendor shortlisting ("find me three photographers under ₱50K who shoot in Boracay"), mood board generation, or general wedding planning Q&A.

**Why it looks tempting:** The AI inquiry assistant is already planned — it seems like a natural expansion.

**Why it's a trap:**
- The planned AI has a clear, bounded scope: answer supplier-specific questions using supplier package data and client event context. This is tractable with Gemini 1.5 Flash.
- A general wedding planner AI requires broad training, safety filtering, and unpredictable API consumption — costs explode quickly on a free tier.
- "AI-powered" features require constant prompt maintenance and output validation.
- The highest-value AI use case (supplier inquiry assistant) is already planned. More AI is not better.

**What to do instead:** Nail the scoped AI inquiry assistant. Expand AI scope only after that feature is validated and API cost is understood.

---

### Anti-Feature 10: Multi-Event Support (v1)
**What it is:** One client account managing multiple events (e.g., an engagement party, a bridal shower, and the wedding).

**Why it looks tempting:** Seems like more value.

**Why it's a trap:**
- Increases data model complexity everywhere: every feature that references "the event" must now handle "which event."
- The primary use case (wedding planning) is a single-event, multi-month planning journey.
- Couples who need to plan an engagement party will use a group chat; they don't need a full planning platform for it.

**What to do instead:** Single event per account in v1. Architecture should be event-scoped (not user-scoped) internally so v2 multi-event is a real option if demand exists.

---

## Feature Dependencies

Understanding which features block others matters for phase ordering.

```
Event setup (date, type, locations)
  └── Dashboard countdown
  └── Checklist template (date-aware timeline)
  └── AI inquiry context (event date + locations injected)
  └── RSVP link generation (links back to event)
  └── Budget category setup

Guest list
  └── RSVP shareable link (guests search their name from this list)
  └── RSVP summary (counts derive from guest list)

Supplier onboarding (admin creates supplier accounts)
  └── Supplier profile setup
      └── Package definition
          └── AI inquiry (AI reads package data)
          └── Supplier availability calendar
              └── Availability indicator on client browse ("booked on your date")
      └── Portfolio photos
          └── Client browse / discovery

Client inquiry thread (created when client contacts supplier)
  └── AI reply (reads supplier packages + client event data)
  └── Manual supplier reply
  └── Booking confirmation action (supplier marks as Booked)
      └── Date auto-blocked on supplier calendar
      └── Client checklist item auto-updated to Booked
      └── Client notification (email)
      └── Budget entry prompt (optional: did you add this to your budget?)

Event date passes
  └── Review submission unlocked (client can review booked suppliers)
      └── Supplier can post one reply per review

File upload
  └── Supplier or checklist item must exist (for tagging)
```

---

## MVP Recommendation

### Prioritize in this order

**Phase 1 — Core planning tools (app useful before any supplier onboards)**
1. Event setup (date, type, locations)
2. Dashboard with countdown
3. Checklist (template + custom items + status tracking)
4. Budget tracker (categories + deposit/balance/due date)
5. Guest list + RSVP shareable link
6. File storage (tagged to supplier or checklist item)
7. Offline supplier entry

Rationale: The bootstrap cold-start strategy requires the planning tools to be fully useful before a single platform supplier exists. Couples can use the app to track all their suppliers from day one, even if they found them on Facebook.

**Phase 2 — Supplier marketplace (value unlocks when first suppliers are onboarded)**
1. Admin: supplier account creation, activation
2. Supplier profile, packages, portfolio photos
3. Supplier availability calendar
4. Client browse + filter + supplier profile view
5. Inquiry thread (async, with AI assistant)
6. Booking confirmation flow (supplier marks as Booked → auto-updates checklist + budget prompt)
7. Email notifications (booking confirmed, inquiry reply received)

**Phase 3 — Trust and retention layer**
1. Verified reviews (post-event, booking-gated)
2. Partner / co-planner access (shared event)
3. Supplier review reply

**Defer to v2+**
- Partner access could be pulled into Phase 3 or Phase 2 if partner-less planning proves painful in early user testing
- Seating chart: do not build
- Wedding website: do not build
- Guest photo sharing: do not build
- Day-of coordinator: do not build

---

## Gaps to Address in Phase-Specific Research

| Topic | Gap | Notes |
|-------|-----|-------|
| Partner / co-planner access | Not in current PROJECT.md Active requirements | Two users sharing one event raises questions about permission model, notification routing, and auth flow |
| Email notification design | Resend is the planned tool but notification triggers and templates are not specified | What events trigger email? How are email preferences managed? |
| Availability calendar UX | How suppliers indicate "I'm available" vs. "I'm not" is underspecified | Manual date blocking works; consider whether "available by default, block specific dates" vs. "unavailable by default, mark available" fits PH supplier mental model better |
| Checklist template content | The PH-specific wedding checklist items are not enumerated | Church booking steps, legal requirements (CENOMAR, banns), barong/gown fitting timelines differ from US templates used by most template resources |
| AI inquiry rate limiting UX | Rate limit is planned but how to communicate it to clients is not | Does the client see "X inquiries remaining today" or just hit a wall? |
| Review timing edge cases | "After event date passes" — how long after? What if supplier is booked but event is 18 months away? | Need a clear unlock rule |
