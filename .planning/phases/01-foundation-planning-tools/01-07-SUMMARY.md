---
phase: 01
plan: 07
subsystem: file-storage
tags: [files, storage, supabase-storage, react-dropzone, signed-url, server-actions, tdd]
dependency_graph:
  requires: ["01-04"]
  provides: ["file-upload-slice", "event-files-page", "signed-url-downloads"]
  affects: ["01-09"]
tech_stack:
  added: []
  patterns:
    - "react-dropzone with PDF/JPG/PNG MIME guard (client-side, T-1-11)"
    - "Service client for createSignedUrl (server-side, FILE-03)"
    - "Event-id-first storage path convention (RLS boundary)"
    - "TDD RED/GREEN: schema tests written before implementation"
key_files:
  created:
    - lib/schemas/file.ts
    - app/actions/files.ts
    - app/(client)/event/files/page.tsx
    - components/files/FileDropzone.tsx
    - components/files/FileGrid.tsx
    - components/files/FileCard.tsx
    - tests/schemas/file.test.ts
  modified: []
decisions:
  - "getSignedUrl uses service client (not user session client) — only service role can sign private Storage objects"
  - "deleteFile removes storage object first, then DB row (recoverable-state ordering)"
  - "FileDropzone uploads directly from browser client to Supabase Storage, then calls saveFilePath Server Action to record the row"
  - "ACCEPTED_MIME and MAX_FILE_BYTES in lib/schemas/file.ts — single source of truth for both react-dropzone accept prop and Server Action re-validation"
metrics:
  duration_minutes: 6
  completed_date: "2026-06-19"
  tasks_completed: 2
  files_created: 7
---

# Phase 1 Plan 07: File Storage Slice Summary

**One-liner:** Private event-files bucket with react-dropzone PDF/JPG/PNG upload, signed-URL downloads, and server-side MIME re-validation via service-role client.

## What Was Built

### Task 1: File schema + Server Actions (TDD)

**`lib/schemas/file.ts`**
- `ACCEPTED_MIME` constant: `['application/pdf', 'image/jpeg', 'image/png']`
- `MAX_FILE_BYTES` constant: `10 * 1024 * 1024` (10 MB)
- `fileMetaSchema` (Zod v4): validates `file_name`, `mime_type` (refined to ACCEPTED_MIME), `size` (<= MAX_FILE_BYTES), `checklist_item_id` (optional UUID), `supplier_label` (optional string)

**`app/actions/files.ts`** — three Server Actions, all calling `verifySession()` first:
- `saveFilePath(eventId, data)`: server-side MIME re-check against ACCEPTED_MIME (T-1-11), event ownership verification, inserts into `event_files`
- `getSignedUrl(fileId)`: RLS-scoped row lookup via session client → service client calls `createSignedUrl` with 60-minute expiry (FILE-03)
- `deleteFile(fileId)`: RLS-scoped row lookup, removes storage object via service client, then deletes DB row

**`tests/schemas/file.test.ts`** — 20 tests:
- MIME validation: pdf/jpg/png pass; video/mp4, text/plain, zip, empty string fail
- Size validation: exactly 10MB passes; 11MB fails; small files pass
- Optional fields: no tags (general upload), UUID checklist_item_id, supplier_label, both tags
- Constants: ACCEPTED_MIME contents, MAX_FILE_BYTES value

### Task 2: Files page + UI components

**`app/(client)/event/files/page.tsx`** (Server Component):
- `assertRole('client')` on first line (CLAUDE.md dual auth)
- Fetches event by `client_id`, then all `event_files` ordered by `uploaded_at desc`
- No-event state with link to `/onboarding`
- Empty file state: exact UI-SPEC copy "No files uploaded yet" / "Upload contracts, receipts, and quotations to keep everything in one place."
- With files: `FileDropzone` at top + `FileGrid` below

**`components/files/FileDropzone.tsx`** (`'use client'`):
- react-dropzone with `accept` limited to PDF/JPG/PNG and `maxSize = MAX_FILE_BYTES`
- Dashed border (muted); accent color (`#BE3C5E`) + soft background on drag-over
- Min-height 96px (UI-SPEC §Spacing Scale exception)
- Exact UI-SPEC copy: "Drag and drop a file here, or click to browse" + "PDF, JPG, or PNG — up to 10 MB"
- Upload flow: browser client uploads to `event-files/<event_id>/<uuid>-<filename>`, then calls `saveFilePath` Server Action
- Error toasts: exact UI-SPEC Global Error State copy for wrong type / too large
- Upload progress: spinner + filename display during upload
- Cleanup: removes storage object if `saveFilePath` fails (no orphaned objects)

**`components/files/FileCard.tsx`** (`'use client'`):
- File type icon: `FileText` (PDF, red), `Image` (JPG/PNG, blue), `File` (other, muted)
- Truncated filename with `title` attribute for full name on hover
- Upload date formatted via `date-fns`
- Tag display (supplier_label or checklist_item_id indicator)
- Download button: `aria-label="Download file"` → calls `getSignedUrl`, opens in new tab
- Delete button: `aria-label="Delete file"` → opens confirm Dialog
- Delete Dialog: exact UI-SPEC copy — "Delete this file?" / "This action cannot be undone." / "Delete File"

**`components/files/FileGrid.tsx`** (Server-compatible, no directives):
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (UI-SPEC: 3-col desktop, 1-col mobile)
- Maps `FileCardProps[]` to `FileCard` instances

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired. The files page fetches real rows from `event_files`, downloads use real signed URLs, and deletes remove both storage objects and DB rows.

## Threat Flags

No new threat surface beyond what is in the plan's threat model. All three threat register items (T-1-11, T-1-01, T-1-04) are mitigated:
- T-1-11: MIME validated by react-dropzone client-side AND `saveFilePath` server-side
- T-1-01: `getSignedUrl` row lookup is RLS-scoped; 60-minute signed URL expiry
- T-1-04: Bucket is private; all downloads via `createSignedUrl` — no public URLs anywhere in the codebase

## Self-Check: PASSED

Files exist:
- lib/schemas/file.ts ✓
- app/actions/files.ts ✓
- app/(client)/event/files/page.tsx ✓
- components/files/FileDropzone.tsx ✓
- components/files/FileGrid.tsx ✓
- components/files/FileCard.tsx ✓
- tests/schemas/file.test.ts ✓

Commits exist:
- 9cfe08c: feat(01-07): file schema, Server Actions, and TDD tests ✓
- 24d3e7e: feat(01-07): files page, FileDropzone, FileGrid, FileCard UI components ✓

Test suite: 64 tests passed (7 test files) ✓
TypeScript: npx tsc --noEmit exits 0 ✓
