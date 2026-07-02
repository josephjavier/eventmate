---
name: playwright-e2e
description: >-
  Author and run EventMate's Playwright E2E + API tests. Use whenever adding or
  changing browser end-to-end tests, API/Route-Handler tests, page objects, test
  fixtures, or seed data under e2e/ — or when a phase needs E2E coverage. Encodes
  the project's Page Object Model + fixture conventions and the run-scoped
  seed/teardown isolation model.
---

# Playwright E2E — EventMate conventions

EventMate is protected by Playwright E2E + API tests. This suite follows the
**Page Object Model (POM)**, keeps **all test data in fixtures**, and runs
**local-first** (`next dev` on localhost against the existing cloud Supabase).
Follow these conventions exactly so tests stay consistent and safe.

## Layout

```
playwright.config.ts        # projects: setup → ui, + api; webServer boots `next dev`
e2e/
  fixtures/
    base.ts                 # custom test() — import { test, expect } from here (NOT @playwright/test)
    data/                   # ALL test data lives here (users, events, guests)
  pages/                    # Page Objects (POM); one class per page/route
  components/               # reusable component objects (dialogs, topbar)
  api/                      # typed API clients over APIRequestContext
  specs/ui/                 # browser E2E specs           → `ui` project
  specs/api/                # API/Route-Handler specs     → `api` project
  setup/                    # auth.setup.ts (storageState), global-teardown.ts
  support/                  # env, run-context, supabase-admin, seed, paths
  tsconfig.json             # type-checks the suite (npx tsc -p e2e/tsconfig.json)
```

## Non-negotiable rules

1. **Import the custom test.** Specs do `import { test, expect } from "../../fixtures/base"` —
   never from `@playwright/test` directly. That's how they get page objects + seeded data.
2. **No selectors in specs.** All locators live in a Page Object under `e2e/pages/`.
   Prefer role/label/text locators tied to the UI-SPEC locked copy over CSS/testid.
3. **No literal test data in specs.** Static payloads go in `e2e/fixtures/data/*`;
   dynamic/unique values come from `support/run-context.ts`. Money is INTEGER centavos
   (₱500,000 → `50_000_000`), matching the DB.
4. **Seed via fixtures; never hand-write DB rows in a spec.** Use the `seededClient`
   / `seededEvent` fixtures (or add a new fixture in `base.ts`) built on `support/seed.ts`.
5. **Isolation = run-scoped seed + teardown.** Users are created pre-confirmed in the
   `e2e+…@eventmate.test` namespace via the service-role admin client. Fixtures delete
   the owning user in teardown; `auth.users → profiles → events → children` cascades
   clean everything. `global-teardown` sweeps the whole `e2e+` namespace as a safety net.
   **Never** seed outside this namespace and never delete non-`e2e+` data.
6. **API tests target Route Handlers** (`app/api/**/route.ts`) via `e2e/api/*` clients.
   Server Actions aren't REST-addressable — cover those through UI specs. For RLS/policy
   behavior, test at the DB layer as the authenticated user via `support/auth-client.ts`
   `signInAsUser()` (a real user JWT — the service-role `admin()` bypasses RLS and would
   hide policy bugs). See `specs/api/events-create.spec.ts` for the pattern.
7. **Authed specs reuse the session.** Opt in with `test.use({ storageState: AUTH_FILE })`
   (see `dashboard.spec.ts`). `auth.setup.ts` logs in once and saves it. Anonymous specs
   (login, signup, public RSVP) need no storageState.

## Adding a new test

- **New page/route** → add a Page Object in `e2e/pages/` extending `BasePage`; expose
  intent-revealing methods + `Locator` fields.
- **New data** → add to `e2e/fixtures/data/`; wire a seed helper in `support/seed.ts` if
  it touches new tables, then expose it as a fixture in `fixtures/base.ts`.
- **New spec** → put UI specs in `specs/ui/`, API specs in `specs/api/`; import `{ test, expect }`
  from `fixtures/base`.
- Each feature phase should ship specs covering its ROADMAP success criteria before it's "done".

## Prerequisites & running

- `.env.local` must contain `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  (same values the app uses). The suite loads them via `@next/env`.
- First-time: `npx playwright install chromium`.

```
npm run test:e2e         # everything (boots next dev via webServer)
npm run test:api         # API specs only (fast; no browser, no auth setup)
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:headed  # headed browser run of the ui project
npm run test:e2e:report  # open the last HTML report
npx tsc -p e2e/tsconfig.json --noEmit   # type-check the suite
```

Vitest (`tests/`, unit) and Playwright (`e2e/`, E2E) are separate runners; `vitest.config.ts`
excludes `e2e/**` so the two don't collide.
