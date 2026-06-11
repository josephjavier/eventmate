# Phase 1: Foundation & Planning Tools - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-11
**Phase:** 1 — Foundation & Planning Tools
**Areas discussed:** Signup → event flow, RSVP name disambiguation, Checklist default template

---

## Signup → Event Flow

### Q1: How does a couple reach their event after signup?

| Option | Description | Selected |
|--------|-------------|----------|
| Guided wizard | Signup immediately flows into a 3-step wizard | ✓ (initially) |
| Empty dashboard + CTA | Signup lands on blank dashboard | |
| You decide | Claude picks based on UX best practices | |

**Initial choice:** Guided wizard

---

### Q2: What does the wizard collect at minimum?

| Option | Description | Selected |
|--------|-------------|----------|
| Date + first location only | Minimum viable; gets couple to dashboard fastest | ✓ |
| Date + all locations upfront | Requires ceremony + reception before proceeding | |
| Full setup: date, locations, budget | Longest wizard — risks abandonment | |

**User's choice:** Date + first location only

---

### Q3: After the wizard, where does the couple land?

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard | Natural starting point for all future sessions | ✓ |
| Checklist page | Gets them into core workflow immediately | |
| You decide | Claude picks | |

**User's choice:** Dashboard

---

### Q4: Where does the wizard live in the route structure?

| Option | Description | Selected |
|--------|-------------|----------|
| /onboarding/* (separate route group) | Clean separation — wizard runs once | ✓ |
| /(client)/setup/* | Inside client route group | |
| You decide | Claude picks | |

**User's choice:** /onboarding/*

---

### Conflict Resolved: Wizard optional vs forced

Later during the Checklist discussion, the user revised this decision:

> "I am imagining that the client will just create account on our application and just browse the available supplier and no event for them yet. We don't need them to force to have an event before browsing on our application."

| Option | Description | Selected |
|--------|-------------|----------|
| Wizard is optional, not forced | Signup = account only; dashboard shows 'Create your event' CTA | ✓ |
| Wizard is required during signup | Cannot reach dashboard without completing event setup | |
| You decide | Claude resolves | |

**Final decision:** Wizard is optional. Signup creates an account only. Post-signup dashboard prominently shows "Create your event" CTA without forcing it.

**Notes:** User added — "we will need to show easily and encourage them to create an event" — the empty state design should be encouraging, not just an empty page.

---

## RSVP Name Disambiguation

### Q1: What secondary field disambiguates common Filipino names?

| Option | Description | Selected |
|--------|-------------|----------|
| Mobile number last 4 digits | Familiar to Filipinos (GCash, banks) | |
| Table number (client pre-assigns) | Only works if seating assigned early | |
| Show all matches, let guest pick visually | No extra field needed | |

**User's choice (freeform "Other"):** Smart search — guest types name, suggestions appear, guest selects theirs. No secondary verification field. Prioritizes simplicity for seniors and less tech-savvy guests. User acknowledged the risk (anyone with the link can search names) but accepted it in favor of accessibility.

---

### Q2: Should the client see an audit trail per RSVP response?

| Option | Description | Selected |
|--------|-------------|----------|
| Just the RSVP status | No timestamp, simpler schema | |
| Status + response timestamp | Record when each response was submitted | ✓ |
| You decide | Claude picks | |

**User's choice:** Status + response timestamp

**Notes:** User added — guests can change their RSVP response within a client-set deadline ("Please finalize your answer until June 15, 2027").

---

### Q3: What happens when the RSVP link is opened after the deadline?

| Option | Description | Selected |
|--------|-------------|----------|
| Page locks — 'RSVP closed' message | Polite closed message; client retains manual override | ✓ |
| Read-only — guest sees status but can't change it | Adds complexity for minimal benefit | |
| You decide | Claude picks | |

**User's choice:** Page locks with "RSVP closed" message

**Notes:** User also specified the RSVP closed page should display: event location(s), schedules, color motif, and attire reference photos (mentioned "animated pics"). Client retains manual override of any guest's status after close. Animated images deferred (see Deferred Ideas).

---

### Q4: Color motif and attire photos — scope now or defer?

| Option | Description | Selected |
|--------|-------------|----------|
| Add to event setup in Phase 1 | Event model gains color motif + up to 2 attire photos | ✓ |
| Defer to a later phase | RSVP closed page shows location/schedule only | |
| You decide | Claude picks | |

**User's choice:** Add to event setup in Phase 1

---

### Q5: RSVP disambiguation — final approach (follow-up discussion)

User asked for a better UX suggestion after acknowledging that phone numbers are tedious and pure search is risky.

**Claude's suggestion:** Optional nickname field on each guest record. Nickname appears alongside full name in search results when duplicates exist (e.g., "Maria Santos (Tita)" vs "Maria Santos (officemate)"). Filipinos naturally use nicknames — more recognizable than legal names.

| Option | Description | Selected |
|--------|-------------|----------|
| Optional nickname + notification on RSVP change | Nickname disambiguates; client notified on every change | ✓ |
| Pure smart search, no disambiguation | No extra fields; accept the risk | |
| You decide | Claude picks | |

**User's choice:** Optional nickname + notification

**Notes:** User confirmed: "nicknames are more frequently used and can be more accurate." Guest record has full name + nickname. RSVP search works on both. Client notified when any RSVP is submitted or updated.

---

## Checklist Default Template

### Q1: How should the default template be structured?

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by supplier category | Standard, familiar categories | ✓ |
| Chronological by typical booking timeline | Opinionated but reflects real PH order | |
| You decide | Claude picks | |

**User's choice:** Grouped by supplier category

---

### Q2: Which personal tasks should ship in the default template?

| Option | Description | Selected |
|--------|-------------|----------|
| Legal documents | Marriage license, CENOMAR, PSA certs, baptismal certs | ✓ |
| Pre-wedding milestones | Pre-Cana, prenuptial agreement, prenup photoshoot | ✓ |
| Day-of personal items | Vows, rings, sponsors, entourage | ✓ |
| Honeymoon & post-wedding | Honeymoon booking, send-off, name change | |

**User's choice:** Legal documents, Pre-wedding milestones, Day-of personal items (not Honeymoon/post-wedding)

---

### Q3: Can couples see and delete supplier categories?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — all visible, couple removes what they don't need | Follows CHECK-03 | ✓ |
| Template wizard — pick categories first | More tailored, but adds setup friction | |
| You decide | Claude picks | |

**User's choice:** All categories visible, couple removes freely

---

### Q4: Does the template auto-load or is it triggered?

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-loads on first checklist visit | No extra step | |
| Couple clicks 'Start from template' button | Deliberate; allows building from scratch | ✓ (via freeform) |
| You decide | Claude picks | |

**User's choice (freeform "Other"):** "Client clicks 'create event' > 'start from template'." Template is triggered, not automatic.

---

## Claude's Discretion

- RSVP change notification channel (email via Resend vs in-app notification)
- Color motif input UI (text input vs color picker vs both)
- Checklist template seeding mechanism (SQL seed file vs application code vs admin-inserted)
- Post-signup landing page empty state copy and design

## Deferred Ideas

- Animated attire photos on RSVP closed page — user mentioned "animated pics"; deferred to a design pass. Phase 1 uses static JPG/PNG uploads.
- Honeymoon / post-wedding personal tasks — not in default template; couple adds manually
- Per-guest RSVP lock — not in Phase 1; client manual override covers the need
- Table assignment / seating chart — explicitly out of scope for v1 (PROJECT.md)
