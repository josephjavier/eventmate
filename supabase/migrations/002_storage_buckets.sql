-- =============================================================================
-- Migration: 002_storage_buckets.sql
-- Phase:     1 — Foundation & Planning Tools
-- Purpose:   Create three private Supabase Storage buckets with RLS policies
-- Author:    EventMate GSD Executor
-- Created:   2026-06-19
--
-- Buckets:
--   event-files  — contracts, quotations, general event documents (FILE-01, FILE-02)
--   receipts     — payment receipt uploads (BUDG-04)
--   event-media  — attire reference photos, up to 2 per event (D-10)
--
-- IMPORTANT — Object path convention (enforced by RLS policies below):
--   Every object stored in these buckets MUST use the event_id as the FIRST
--   path segment. Example:
--     event-files/<event_id>/<filename>
--     receipts/<event_id>/<filename>
--     event-media/<event_id>/<filename>
--
--   The RLS policy extracts the event_id via:
--     (storage.foldername(name))[1]::uuid
--   and passes it to user_can_access_event() for authorization.
--
--   Upload code in Wave 3/5/7 MUST follow this convention. Never store objects
--   at the root of a bucket or under any other structure — the RLS will reject them.
--
-- Architecture constraints (CLAUDE.md — NON-NEGOTIABLE):
--   #4  T-1-04: All three buckets are PRIVATE (public = false). No exceptions.
--   #6  RLS on storage.objects gated on user_can_access_event().
--   #7  Service role key is never NEXT_PUBLIC_ — download signed URLs are generated
--       server-side; never expose bucket URLs directly to the browser.
-- =============================================================================


-- =============================================================================
-- BUCKET DEFINITIONS
--   public = false → Private bucket. Supabase Storage will not serve objects
--   without authorization (RLS check or signed URL from service client).
--   NOT a supplier-portfolio bucket — that is Phase 2.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('event-files',  'event-files',  false),   -- contracts, quotations, general docs
  ('receipts',     'receipts',     false),   -- payment receipts (BUDG-04)
  ('event-media',  'event-media',  false)    -- attire reference photos (D-10)
ON CONFLICT (id) DO NOTHING;   -- idempotent: safe to re-run migration


-- =============================================================================
-- STORAGE.OBJECTS RLS POLICIES
--
-- Path convention reminder (see header):
--   <bucket>/<event_id>/<filename>
--
-- The helper public.user_can_access_event() is defined in 001_create_tables.sql
-- and must be applied BEFORE this migration (migrations run in filename order).
--
-- Policy structure: separate INSERT / SELECT / DELETE policies per bucket so
-- each operation is explicit and auditable.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- event-files bucket
-- ---------------------------------------------------------------------------

CREATE POLICY "event_files_insert"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-files'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "event_files_select"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-files'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "event_files_delete"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-files'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );


-- ---------------------------------------------------------------------------
-- receipts bucket
-- ---------------------------------------------------------------------------

CREATE POLICY "receipts_insert"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "receipts_select"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "receipts_delete"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );


-- ---------------------------------------------------------------------------
-- event-media bucket
-- ---------------------------------------------------------------------------

CREATE POLICY "event_media_insert"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'event-media'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "event_media_select"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'event-media'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "event_media_delete"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-media'
    AND public.user_can_access_event((storage.foldername(name))[1]::uuid)
  );
