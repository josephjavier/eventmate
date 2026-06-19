---
phase: 01-foundation-planning-tools
plan: "05"
subsystem: checklist
tags: [checklist, template, offline-supplier, server-actions, tdd]
dependency_graph:
  requires: ["01-04"]
  provides: [checklist-slice, offline-supplier-attachment, ph-wedding-template]
  affects: [dashboard-summary-widgets, booking-confirmation-rpc]
tech_stack:
  added:
    - "shadcn Collapsible component"
  patterns:
    - "Server Action + form action for loadTemplate (progressive enhancement)"
    - "Client Component dialog wrappers imported into Server Component page"
    - "react-hook-form + zodResolver on all mutating dialogs"
    - "Integer centavos via phpToCentavos in attachOfflineSupplier"
key_files:
  created:
    - lib/checklist-template.ts
    - lib/schemas/checklist.ts
    - app/actions/checklist.ts
    - app/(client)/event/checklist/page.tsx
    - components/checklist/ChecklistView.tsx
    - components/checklist/ChecklistItemRow.tsx
    - components/checklist/AddItemDialog.tsx
    - components/checklist/OfflineSupplierDialog.tsx
    - components/checklist/AddItemTrigger.tsx
    - components/ui/collapsible.tsx
  modified: []
decisions:
  - "LoadTemplateButton uses a native <form action={serverAction}> for progressive enhancement — no client JS required to load the template"
  - "AddItemTrigger is a separate 'use client' component imported into the Server Component page, enabling dialog state without making the whole page a client component"
  - "offlineSupplierSchema includes contact_name (matches Wave-0 test spec) alongside contact to handle both field names gracefully"
  - "ChecklistItemRow uses local useState for optimistic status/title updates — no full page rerender on badge click"
  - "Collapsible component installed from shadcn registry (not pre-installed in Wave 0)"
metrics:
  duration_minutes: 7
  completed_date: "2026-06-19"
  tasks_completed: 2
  files_created: 10
  files_modified: 0
---

# Phase 1 Plan 05: Checklist Slice Summary

**One-liner:** Philippine wedding checklist with 14 supplier categories + Personal Tasks template loaded on demand, offline supplier attachment with centavos price storage, and full CRUD backed by RLS-scoped Server Actions.

## What Was Built

### Task 1: Template constant, schemas, and Server Actions (TDD)

**RED phase:** `tests/schemas/checklist.test.ts` already existed (Wave-0 failing spec) — import of `@/lib/schemas/checklist` was failing, confirming RED state.

**GREEN phase:**

- **`lib/checklist-template.ts`** — `CHECKLIST_TEMPLATE` with 25 items:
  - 14 D-11 supplier categories in exact order (Photography through Wedding Coordinator)
  - D-12 Personal Tasks — Legal sub-group: Marriage license, CENOMAR (PSA), Birth certificates (PSA), Baptismal certificates
  - D-12 Personal Tasks — Pre-wedding sub-group: Pre-Cana, Prenuptial agreement (if needed), Prenuptial photoshoot
  - D-12 Personal Tasks — Day-of sub-group: Prepare vows, Wedding rings, Secondary sponsors list, Entourage assignments
  - Sort orders: 1–14 (supplier), 100–123 (personal, with gaps between sub-groups)

- **`lib/schemas/checklist.ts`** — Zod v4 schemas:
  - `offlineSupplierSchema`: name + category required; contact_name, contact, price (positive number), notes optional
  - `checklistItemSchema`: title required, item_type enum ('supplier_task' | 'personal_task'), category optional
  - `renameItemSchema`: title required

- **`app/actions/checklist.ts`** — Server Actions (all call `verifySession()` first):
  - `loadTemplate(eventId)`: bulk-inserts CHECKLIST_TEMPLATE rows; idempotent guard (skips if items exist)
  - `addItem(formData)`: adds custom item with next sort_order
  - `renameItem(itemId, title)`: updates title, validated
  - `deleteItem(itemId)`: permanent delete (D-14 — freely deletable)
  - `updateStatus(itemId, status)`: enforces supplier flow (pending/inquired/booked) and personal flow (pending/done) per T-1-10
  - `attachOfflineSupplier(itemId, data)`: validates offlineSupplierSchema, stores price via `phpToCentavos` as INTEGER centavos (T-1-08)
  - All actions call `revalidatePath('/event/checklist')` after mutations

All 8 tests in `tests/schemas/checklist.test.ts` pass.

### Task 2: Checklist page + components

- **`app/(client)/event/checklist/page.tsx`** — Server Component:
  - `assertRole('client')` for dual auth layer
  - No-event state with link to `/onboarding`
  - Empty checklist state (D-13): exact locked copy ("Your checklist is empty" + body), `LoadTemplateButton` form action wired to `loadTemplate`, `AddItemTrigger`
  - Non-empty: `ChecklistView` with page-level `AddItemTrigger`
  - `LoadTemplateButton` uses `<form action={serverAction}>` for progressive enhancement

- **`components/checklist/ChecklistView.tsx`** — `'use client'`:
  - Groups items by category (preserving sort_order)
  - Overall progress bar with accent fill (#BE3C5E)
  - Per-category `Collapsible` groups with name, item count badge, per-category progress bar, and per-category "Add Item" trigger

- **`components/checklist/ChecklistItemRow.tsx`** — `'use client'`:
  - Personal tasks: `Checkbox` toggling pending ↔ done with optimistic state
  - Supplier tasks: clickable status badge cycling pending → inquired → booked
  - Locked badge variants: Pending=outline, Inquired=secondary, Booked=accent fill
  - Done/Booked titles get line-through via `cn()`
  - Action menu (DropdownMenu) with Rename, Add/Edit Supplier, Delete
  - Delete confirm dialog with exact UI-SPEC copy
  - All icon-only buttons have `aria-label`

- **`components/checklist/AddItemDialog.tsx`** — `'use client'`:
  - react-hook-form + zodResolver form with title + item_type select + optional category
  - Sonner toast on success (4s) / error (6s)

- **`components/checklist/OfflineSupplierDialog.tsx`** — `'use client'`:
  - Exact UI-SPEC locked copy: "Add a Supplier" heading, "For suppliers you found on Facebook, Instagram, or by referral." body, "Supplier name" label, "Add Supplier" submit
  - Fields: name (required), category (required), contact (optional), notes (optional)

- **`components/checklist/AddItemTrigger.tsx`** — `'use client'`:
  - Standalone client component that holds dialog open state, imported into Server Component page

- **`components/ui/collapsible.tsx`** — installed via `npx shadcn@latest add collapsible`

## Verification

```
npx vitest run tests/schemas/checklist.test.ts  → 8/8 passed
npx vitest run                                   → 34/34 passed (all test files)
npx tsc --noEmit                                → 0 errors
```

All success criteria confirmed:
- `lib/checklist-template.ts` contains CENOMAR (PSA) and Pre-Cana entries
- `app/(client)/event/checklist/page.tsx` calls `assertRole('client')` and wires `loadTemplate`, `addItem`, `deleteItem`, `attachOfflineSupplier`
- Page contains exact D-13 button label "Start from the Philippine wedding template"
- Supplier-task status badges use locked variants (Pending outline / Inquired secondary / Booked accent)
- Offline-supplier dialog uses exact UI-SPEC "Add a Supplier" copy and requires name + category
- All icon-only action buttons have `aria-label`s

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 (TDD GREEN) | 232b331 | feat(01-05): PH wedding template, checklist schemas, and Server Actions |
| Task 2 | f4a23fd | feat(01-05): checklist page and components |

## Deviations from Plan

### Auto-additions

**1. [Rule 2 - Missing functionality] Added `AddItemTrigger` client component**
- **Found during:** Task 2
- **Issue:** The checklist page is a Server Component, but the "Add Item" button needs to open a dialog (client-side state). The plan listed `AddItemDialog.tsx` but did not account for the Server/Client boundary — a pure Server Component cannot hold `useState` for dialog open state.
- **Fix:** Created `components/checklist/AddItemTrigger.tsx` as a minimal `'use client'` wrapper that holds dialog open state and imports `AddItemDialog`. Server Component page imports `AddItemTrigger`.
- **Files modified:** `components/checklist/AddItemTrigger.tsx` (new)
- **Commit:** f4a23fd

**2. [Rule 2 - Missing functionality] Added `collapsible` shadcn component**
- **Found during:** Task 2
- **Issue:** `ChecklistView.tsx` uses `Collapsible` from shadcn but it was not pre-installed in Wave 0.
- **Fix:** Ran `npx shadcn@latest add collapsible` — component created at `components/ui/collapsible.tsx`.
- **Files modified:** `components/ui/collapsible.tsx` (new)
- **Commit:** f4a23fd

## Known Stubs

None. All data is wired from the database through Server Actions and Server Component queries. No hardcoded empty values flow to the UI.

## Threat Flags

No new threat surface beyond what is covered in the plan's threat model. All checklist mutations are RLS-scoped via `user_can_access_event(event_id)` + `verifySession()` in every Server Action (T-1-01). Offline supplier price stored as INTEGER centavos via `phpToCentavos` (T-1-08). Status transitions enforce allowed sets per `item_type` (T-1-10).

## Self-Check: PASSED

Files created (verified):
- `lib/checklist-template.ts` ✓
- `lib/schemas/checklist.ts` ✓
- `app/actions/checklist.ts` ✓
- `app/(client)/event/checklist/page.tsx` ✓
- `components/checklist/ChecklistView.tsx` ✓
- `components/checklist/ChecklistItemRow.tsx` ✓
- `components/checklist/AddItemDialog.tsx` ✓
- `components/checklist/OfflineSupplierDialog.tsx` ✓
- `components/checklist/AddItemTrigger.tsx` ✓

Commits verified:
- 232b331 ✓ (feat(01-05): PH wedding template, checklist schemas, and Server Actions)
- f4a23fd ✓ (feat(01-05): checklist page and components)
