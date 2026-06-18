---
phase: 1
slug: foundation-planning-tools
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | 00 | 0 | AUTH-01 | T-1-01 | Password schema rejects weak passwords | unit | `npx vitest run tests/schemas/auth.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-02 | 00 | 0 | BUDG-01 | — | `phpToCentavos(50000)` returns `5000000` | unit | `npx vitest run tests/utils/currency.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-03 | 00 | 0 | BUDG-01 | — | `formatPHP(5000000)` returns `"₱ 50,000"` | unit | `npx vitest run tests/utils/currency.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-04 | 00 | 0 | RSVP-03 | T-1-02 | RSVP token is 20 chars, URL-safe | unit | `npx vitest run tests/utils/token.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-05 | 00 | 0 | DISC-07 | — | Offline supplier schema validates name + category required | unit | `npx vitest run tests/schemas/checklist.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-06 | 00 | 0 | RSVP-04 | — | RSVP deadline gate locks when deadline < today | unit | `npx vitest run tests/utils/rsvp.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — framework install: `npm install -D vitest @testing-library/react jsdom`
- [ ] `tests/schemas/auth.test.ts` — stubs for AUTH-01 password validation
- [ ] `tests/utils/currency.test.ts` — covers BUDG-01 centavos arithmetic (phpToCentavos, formatPHP)
- [ ] `tests/utils/token.test.ts` — covers RSVP-03 token format (nanoid length + URL-safe chars)
- [ ] `tests/utils/rsvp.test.ts` — covers D-06 RSVP deadline gate logic
- [ ] `tests/schemas/checklist.test.ts` — covers DISC-07 offline supplier schema validation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Signup → email verification → login flow | AUTH-01, AUTH-02 | Requires real Supabase Auth email delivery | Create account, check email, click link, confirm login persists |
| Password reset email delivery | AUTH-04 | Requires real email delivery | Trigger reset, check inbox, confirm link works |
| RSVP link opens without login | AUTH-07 | Requires browser session isolation | Open link in incognito, confirm no auth redirect |
| Co-planner invitation email received | COPL-02, NOTF-04 | Requires Resend delivery | Invite email, check inbox, confirm accept link works |
| RSVP notification email to client | NOTF-04 | Requires Resend delivery | Guest submits RSVP, confirm client receives email |
| File download via signed URL | FILE-03 | Requires Supabase Storage integration | Upload file, click download, confirm file content |
| Dashboard countdown timer shows correct days | EVENT-04 | Requires visual inspection for hydration check | Create event with future date, confirm countdown displays without React hydration error |
| Co-planner edit access (RLS) | COPL-03 | Requires two authenticated browser sessions | Log in as co-planner, confirm full edit access to checklist/budget/guests/files |
| Supabase keep-alive cron fires | — | Requires time-based verification | Check cron job status after 3+ days; confirm project not paused |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
