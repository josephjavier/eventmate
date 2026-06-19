---
phase: 01
plan: 06
subsystem: budget
status: complete
completed_date: "2026-06-19"
duration_minutes: 6
tags: [budget, centavos, currency, server-actions, zod, tdd]

dependency_graph:
  requires: ["01-04"]
  provides: ["budget-slice", "CurrencyInput", "setBudget", "createExpense"]
  affects: ["01-07", "01-08"]

tech_stack:
  added: []
  patterns:
    - "INTEGER centavos end-to-end (phpToCentavos in Server Actions, formatPHP in display)"
    - "isOverBudget(spent, allocated) pure helper shared by UI + tests"
    - "CurrencyInput: text/inputMode=numeric, format-on-blur, emits PHP float, Server Action converts"
    - "Server Component budget page with 'use client' trigger wrappers for dialogs"
    - "react-dropzone for receipt upload (PDF/JPG/PNG only, 10MB limit)"

key_files:
  created:
    - lib/schemas/budget.ts
    - app/actions/budget.ts
    - app/(client)/event/budget/page.tsx
    - app/(client)/event/budget/SetBudgetTrigger.tsx
    - app/(client)/event/budget/AddExpenseTrigger.tsx
    - components/budget/CurrencyInput.tsx
    - components/budget/BudgetSummary.tsx
    - components/budget/CategoryList.tsx
    - components/budget/CategoryAllocationDialog.tsx
    - components/budget/ExpenseDialog.tsx
    - tests/utils/budget.test.ts
  modified: []

decisions:
  - "SetBudgetTrigger and AddExpenseTrigger are separate 'use client' files (same pattern as AddItemTrigger in 01-05) — allows budget page.tsx to remain a Server Component"
  - "CurrencyInput emits PHP float on every change; phpToCentavos conversion happens in Server Actions only — keeps the component reusable and centavos logic co-located with DB writes"
  - "isOverBudget exported from lib/schemas/budget.ts (not lib/utils.ts) — co-located with the budget domain, testable without importing utils"
  - "Per-category expense tracking requires a category field on the expenses table (not present in v1 schema) — CategoryList shows allocated amount per category but spentCentavos=0 as a known stub (documented below)"

metrics:
  duration_minutes: 6
  completed_date: "2026-06-19"
  tasks_completed: 2
  files_created: 11
---

# Phase 1 Plan 06: Budget Slice Summary

**One-liner:** GCash-inspired budget slice with INTEGER centavos end-to-end — set total budget, allocate per category (with over-budget badge), track deposit/balance/due-date expenses, attach PDF/JPG/PNG receipts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Budget test: isOverBudget + centavos math | 77f783f | tests/utils/budget.test.ts |
| 1 (GREEN) | Budget schemas + Server Actions | ff0844a | lib/schemas/budget.ts, app/actions/budget.ts |
| 2 | Budget page + components | e29c4b8 | 8 files (page + 5 components + 2 triggers) |

## What Was Built

### lib/schemas/budget.ts
- `setBudgetSchema` — non-negative total budget
- `categorySchema` — category name + non-negative allocated amount
- `expenseSchema` — supplier_name, total_amount, deposit_paid, optional dates + checklist_item_id
- `ALLOWED_RECEIPT_MIMES` — pdf/jpeg/png constant shared by server + client
- `isOverBudget(spent, allocated)` — pure helper, returns `spent > allocated` (strictly over)

### app/actions/budget.ts
- `setBudget(eventId, phpAmount)` — updates events.total_budget as INTEGER centavos
- `upsertCategory(eventId, category, allocatedPhp)` — upserts budget_categories.allocated_amount
- `createExpense(eventId, data)` — inserts expense; remaining = total - deposit (server-computed)
- `updateExpense(expenseId, data)` — partial update; re-computes remaining_balance
- `deleteExpense(expenseId)` — cascade deletes receipt_files via FK ON DELETE CASCADE
- `attachReceipt(expenseId, storagePath, fileName, mimeType)` — server MIME validation

### components/budget/CurrencyInput.tsx
- `type="text"` + `inputMode="numeric"` (numeric keyboard on mobile)
- Placeholder: `"e.g., ₱ 50,000"` (UI-SPEC locked)
- Format on blur: `Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 })` — no decimals for whole pesos
- Emits PHP float via onChange; Server Action converts to centavos

### components/budget/BudgetSummary.tsx
- 4 StatCards in responsive grid (2-col mobile, 4-col desktop)
- Labels: Total Budget / Committed / Paid / Remaining (UI-SPEC locked)
- Remaining uses destructive color when negative (over budget)

### components/budget/CategoryList.tsx
- Per-category rows: name + allocated (formatPHP) + spent (formatPHP) + progress bar
- Progress bar: `[&>div]:bg-primary` when under, `[&>div]:bg-destructive` when over
- "Over budget by ₱X,XXX" destructive Badge inline (BUDG-06, informational, non-blocking)
- "Edit" button per row opens `CategoryAllocationDialog` (BUDG-02)

### components/budget/CategoryAllocationDialog.tsx
- Dialog with `CurrencyInput` labeled "Allocated amount (₱)"
- Initializes from `centavosToPhp(allocatedAmountCentavos)` prop
- On submit: calls `upsertCategory(eventId, category, phpAmount)` — Server Action converts to centavos
- sonner toast "Allocation updated" on success

### components/budget/ExpenseDialog.tsx
- Fields: Supplier name, Total package price, Deposit paid, Date paid, Remaining balance (read-only/auto), Balance due date (UI-SPEC exact labels)
- Remaining balance auto-derived: `max(0, totalPhp - depositPhp)` — never user-supplied
- react-dropzone receipt upload: PDF/JPG/PNG, 10 MB max, client-side type validation
- Upload to `receipts/{event_id}/{timestamp}_{filename}` Supabase Storage path

### app/(client)/event/budget/page.tsx
- `assertRole('client')` — auth + role guard
- Empty state (no event): redirect CTA to `/onboarding`
- Empty state (no budget): "No budget set yet" + SetBudgetTrigger CTA
- With budget: BudgetSummary + CategoryList + AddExpenseTrigger
- Expense list inline with total / paid amounts via Intl.NumberFormat

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| `spentCentavos: 0` per category | app/(client)/event/budget/page.tsx | ~114 | The `expenses` table has no `category` column in v1 schema — per-category spending sum requires either a `category` FK on expenses or a join via `checklist_item_id → checklist_items.category`. CategoryList shows allocated amounts correctly; spent amounts are always 0 until a category column is added to expenses (planned for Phase 2 or a future plan). Budget totals in BudgetSummary are correct (they aggregate all expenses). |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript error in updateExpense — `Record<string, unknown>` incompatible with typed Supabase update**
- **Found during:** Task 1 (tsc --noEmit after implementing Server Actions)
- **Issue:** Supabase typed client rejects `Record<string, unknown>` for `.update()` payload — required strict typed object
- **Fix:** Replaced dynamic payload accumulation with a single typed object literal including all fields (undefined values are ignored by Supabase)
- **Files modified:** app/actions/budget.ts
- **Commit:** ff0844a (same commit as the fix, pre-commit tsc check)

**2. [Rule 2 - Missing functionality] Added SetBudgetTrigger + AddExpenseTrigger as separate client wrappers**
- **Found during:** Task 2 design — budget page.tsx is a Server Component but dialogs require client state
- **Pattern:** Same approach as `AddItemTrigger` from plan 01-05 (documented in STATE.md under decisions)
- **Files added:** app/(client)/event/budget/SetBudgetTrigger.tsx, AddExpenseTrigger.tsx
- **Not in plan but required** for Server Component architecture

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED | 77f783f — `test(01-06): add failing tests for budget centavos math + isOverBudget` | PASS |
| GREEN | ff0844a — `feat(01-06): budget schemas + Server Actions (centavos-correct)` | PASS |
| REFACTOR | None needed — code was clean post-GREEN | N/A |

## Threat Surface Scan

No new network endpoints added. Budget actions all go through authenticated Server Actions with verifySession() + RLS. No new trust boundary surface beyond what the threat model covers.

## Self-Check: PASSED

- [x] lib/schemas/budget.ts exists
- [x] app/actions/budget.ts exists with setBudget, upsertCategory, createExpense, updateExpense, deleteExpense, attachReceipt
- [x] app/(client)/event/budget/page.tsx exists with assertRole
- [x] components/budget/CurrencyInput.tsx exists with inputMode="numeric"
- [x] components/budget/BudgetSummary.tsx exists with formatPHP
- [x] components/budget/CategoryList.tsx exists with "Over budget" + CategoryAllocationDialog
- [x] components/budget/CategoryAllocationDialog.tsx exists with upsertCategory + phpToCentavos
- [x] components/budget/ExpenseDialog.tsx exists with react-dropzone + exact UI-SPEC labels
- [x] tests/utils/budget.test.ts — 10/10 pass
- [x] npx vitest run — 44/44 pass (all 6 test files green)
- [x] npx tsc --noEmit — exits 0
- [x] Commits: 77f783f (RED), ff0844a (GREEN/feat), e29c4b8 (UI components)
