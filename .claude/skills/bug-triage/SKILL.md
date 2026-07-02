---
name: bug-triage
description: >-
  MANDATORY first step for diagnosing anything broken in EventMate — consult this
  skill BEFORE reading code or proposing a fix. Use it whenever a test is failing or
  flaky, a bug or regression is reported, or the app behaves wrong and the cause
  isn't obvious — including when the user only pastes an error or stack trace, or
  says "this test is red", "why is X broken", "the insert/query/RLS is being denied",
  "it works locally but the e2e fails", or "users say their edits don't save". Do NOT
  start ad-hoc debugging first: in this repo, jumping straight to a fix has
  repeatedly misdiagnosed the cause (e.g. blaming auth/RLS when the real culprit was
  an INSERT…RETURNING re-read, or "fixing" a flaky test that was a real bug). This
  skill enforces reproduce → get ground truth via probes → isolate → fix the right
  layer → guard with a regression test. Especially for Supabase RLS / Server Action /
  Postgres / Playwright failures where the surface error misleads. NOT for writing
  new tests or features, code review, refactors, or explaining a concept — only for
  diagnosing something that is actually broken.
---

# Bug Triage — make the system tell you the truth

The one rule: **never fix on a theory.** A plausible cause is a hypothesis, not a
diagnosis. Every step below exists to replace a guess with evidence, and to end
with a fix that's verified and guarded so the bug can't silently come back.

This is a project skill for EventMate (Next.js 15 App Router · Supabase/RLS ·
Playwright E2E+API under `e2e/` · Vitest under `tests/`). It pairs with the
`playwright-e2e` skill (POM, fixtures, run-scoped seed/teardown) — read that when
you touch tests.

Work in four phases. Don't skip ahead — most wasted debugging time comes from
theorizing at phase 3 before doing phases 1–2.

---

## Phase 1 — Reproduce & triage

**Reproduce deterministically first.** Run the failing test in isolation, single
worker, so you know it's real and not a parallel/ordering flake:

```
npx playwright test --project=ui e2e/specs/ui/<file>.spec.ts --workers=1
# API/RLS-layer: --project=api ;  unit: npx vitest run tests/<file>
```

If it only fails in the full run, the bug is interaction/shared-state, not the
unit under test — investigate the interaction, not the test.

**Triage: test defect vs product bug.** Not every red test is a product bug. A
brittle selector, wrong assertion, or bad fixture is the *test's* fault — fix it
in the test and move on. Everything else is a product bug; keep going.
> Worked example: our auth spec used `getByRole('heading', {name:'Welcome back'})`,
> but shadcn `CardTitle` renders a `<div>`, not a heading — a test defect, fixed
> with `getByText`. The onboarding failure was a real product bug — investigated below.

## Phase 2 — Get ground truth (the core of this skill)

**Read the captured evidence, not just the error line.** A generic failure
(`waitForURL timeout`) usually hides a specific one. Playwright saves a page
snapshot per failure:

```
e2e/.results/<test-dir>/error-context.md   # rendered DOM/aria snapshot
e2e/.results/<test-dir>/test-failed-1.png  # screenshot
```

> The onboarding timeout was really the page showing
> `new row violates row-level security policy for table "events"` — invisible in
> the test log, obvious in the snapshot.

**List hypotheses, then rule them out with evidence — one at a time.** Write down
the candidates before touching code. For the createEvent bug they were: (a) insert
runs as `anon`; (b) RLS policy drift; (c) a restrictive policy; (d) `INSERT … RETURNING`
denied by the SELECT policy. Each got tested, not assumed.

**Make the system report ground truth.** Instead of speculating about state,
inject a temporary probe that surfaces it, then read it back from the snapshot or
logs. Prefer probes over reasoning. Useful probes for Supabase/RLS:

- **authenticated vs anon** — from the *same* client/request, do a read whose RLS
  is `id = auth.uid()` (e.g. `select id from profiles`). Rows back ⇒ authenticated
  and `auth.uid()` is what you think; empty ⇒ effectively `anon`. This single probe
  killed the "anon insert" theory (the client *was* authenticated).
- **the real error** — return/log the full PostgREST error (`code`, `message`,
  `details`, `hint`), not just `.message`. `42501` = RLS/insufficient-privilege.
- **identity match** — log `auth.uid()`-side value vs the value you're writing
  (e.g. `client_id`), to confirm a `WITH CHECK (col = auth.uid())` should pass.

Temporary-diagnostic pattern (surface it where the test already captures output —
e.g. the returned error a Server Action renders on the page):

```ts
// TEMP DIAGNOSTIC — remove before finishing
const probe = await supabase.from("profiles").select("id")   // authed? = rows
return { error: `DIAG rows=${probe.data?.length} err=${probe.error?.code}:${probe.error?.message}` }
```

**Isolate with the minimal reproduction.** Strip the failing operation to its
smallest form. A **bare** `insert` (no `.select()`) returning `201` proved the
`INSERT` and its `WITH CHECK` were fine — the failure was the `.select()` turning
it into `INSERT … RETURNING`, re-read under the SELECT policy
`user_can_access_event(id)`, a `STABLE SECURITY DEFINER` helper that can't see the
just-inserted row mid-statement. Minimal isolation, not theory, pinned it.

**Abandon contradicted hypotheses — stay willing to be wrong.** This diagnosis
pivoted twice: "policy drift" died when the user's `pg_policies` output showed the
policy was correct; "anon/timing" died when an authenticated early read returned a
row. When evidence contradicts your theory, drop the theory, don't defend it.

**Ask the user for access you don't have.** You can't introspect everything. We
couldn't read `pg_policies` through the service client, so we asked the user to run
a query in the Supabase SQL editor. A 30-second question beats an hour of guessing.

## Phase 3 — Fix

**Fix at the right layer; prefer the minimal, verifiable fix.** There's usually an
app-side and an infra-side fix. Favor the one you can apply and verify *now*, and
note the alternative. For createEvent: the app fix (bare insert + a **separate**
read for the id — a new statement sees the committed row) beat a DB policy
migration, because it needed no external apply and could be re-run to green
immediately. The RLS policy was correct and left untouched.

**Verify a fix on ONE site before propagating.** If the same pattern appears in
many files, fix *one*, re-run, and confirm before rolling out. We applied a
candidate (`getAuthedClient`) to a single action, saw it *not* work, and therefore
did **not** touch the other five files. Mass edits on an unverified theory create
churn and hide the real cause.

**Revert wrong-turn changes.** When a hypothesis fails, undo its code (and all
temporary diagnostics) so the final diff is *only* the real fix. Leaving dead
experiments around confuses reviewers and future debuggers.

## Phase 4 — Lock it in

**Every bug ships with a regression test** (standing rule for this repo). Add a
test that fails on the bug and passes on the fix. Prefer defense in depth:

- an **end-to-end** guard through the real flow (e.g. `e2e/specs/ui/onboarding.spec.ts`
  — the wizard must reach the countdown), and
- a **fast, precise lower-layer** guard (e.g. `e2e/specs/api/events-create.spec.ts`).

For RLS/policy bugs, the lower-layer test must run **as the authenticated user**
(real JWT via `e2e/support/auth-client.ts` `signInAsUser`) — the service-role
`admin()` client bypasses RLS and would hide the bug. See the `playwright-e2e`
skill for POM/fixtures/seed conventions.

**Document the why, in three places:**
- an **inline comment** at the fix explaining the trap (the highest-value doc — it
  stops someone reintroducing it; e.g. "no `.select()` here: RETURNING re-reads
  under a self-referential SELECT policy"),
- **`.planning/STATE.md`** — symptom → what was ruled out → root cause → fix →
  verification, and
- a **memory** with the reusable lesson, not just this instance.

---

## Heuristics worth remembering

- **A generic failure hides a specific one.** Timeouts, "something went wrong",
  500s — go find the concrete error (snapshot, response body, DB log) first.
- **"Authenticated but denied" ≠ "anon".** Prove which with a same-context read
  probe before assuming an auth problem.
- **An `INSERT … RETURNING` RLS failure can be the SELECT/RETURNING policy, not the
  `WITH CHECK`.** A bare insert isolates which — don't assume it's the insert check.
- **Make the system tell you the truth.** A five-line probe beats a paragraph of
  speculation every time.
- **The error message names a table/operation, not always the cause.** "violates
  RLS policy for table X" told us the table, not which policy (insert vs select).
