-- =============================================================================
-- Migration: 001_create_tables.sql
-- Phase:     1 — Foundation & Planning Tools
-- Purpose:   All Phase 1 tables + RLS policies + user_can_access_event() helper
--            + profiles auto-create trigger
-- Author:    EventMate GSD Executor
-- Created:   2026-06-19
--
-- Architecture constraints (CLAUDE.md — NON-NEGOTIABLE):
--   1. ALL monetary columns are INTEGER (centavos). ₱1 = 100. NEVER numeric/decimal.
--   6. RLS enabled in the SAME migration as every CREATE TABLE. Never as a follow-up.
--   8. RSVP page uses token auth; token stored in rsvp_tokens.token.
--
-- Table creation order (FK dependency order):
--   profiles → events → event_invitations → [helper function]
--   → event_locations → checklist_items → budget_categories → expenses
--   → receipt_files → guests → rsvp_tokens → rsvp_responses → event_files
-- =============================================================================


-- =============================================================================
-- 1. PROFILES
--    Extends auth.users with role + consent tracking (RA 10173).
--    Auto-created via trigger on auth.users INSERT.
-- =============================================================================

CREATE TABLE profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role              text NOT NULL DEFAULT 'client'
                    CHECK (role IN ('client', 'supplier', 'admin')),
  full_name         text,
  consent_given_at  timestamptz,   -- RA 10173: Philippine Data Privacy Act
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile row only
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 2. EVENTS
--    One active event per client (UNIQUE on client_id — EVENT-01).
--    total_budget is INTEGER centavos (CLAUDE.md decision #1).
--    D-10 additions: color_motif, attire_photo_1_path, attire_photo_2_path.
--    D-06 addition: rsvp_deadline.
-- =============================================================================

CREATE TABLE events (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                    text,
  event_type               text NOT NULL DEFAULT 'wedding',
  event_date               date,
  event_time               time,
  total_budget             INTEGER,   -- centavos (CLAUDE.md #1: NEVER numeric/decimal)
  color_motif              text,      -- D-10: e.g. "Dusty Rose" or "#D4A5A5"
  attire_photo_1_path      text,      -- D-10: Supabase Storage path in event-media bucket
  attire_photo_2_path      text,      -- D-10: Supabase Storage path in event-media bucket
  rsvp_deadline            date,      -- D-06: RSVP page locks after this date
  meal_preference_enabled  boolean NOT NULL DEFAULT false,  -- RSVP-06
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id)        -- EVENT-01: one active event per client account (v1)
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Event owner has full access to their event row.
-- Co-planner access is handled via user_can_access_event() after it is defined below.
-- For the events table itself, we apply a combined policy after the helper is created.

-- (Event-level RLS policies are added AFTER user_can_access_event() is defined, below.)


-- =============================================================================
-- 3. EVENT_INVITATIONS
--    Co-planner invitation system (COPL-01, COPL-02, COPL-03).
--    Must be created BEFORE user_can_access_event() because the helper references it.
-- =============================================================================

CREATE TABLE event_invitations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  invitee_email     text NOT NULL,
  user_id           uuid REFERENCES profiles(id) ON DELETE SET NULL,  -- set on accept
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted')),
  invitation_token  text NOT NULL UNIQUE,   -- nanoid(20) for /invite/[token]
  invited_at        timestamptz NOT NULL DEFAULT now(),
  accepted_at       timestamptz,
  UNIQUE(event_id, invitee_email)   -- prevent duplicate invitations to same email
);

ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- Event owner can manage all invitations for their event
CREATE POLICY "owner_manage_invitations" ON event_invitations
  FOR ALL TO authenticated
  USING (
    event_id IN (SELECT id FROM events WHERE client_id = auth.uid())
  )
  WITH CHECK (
    event_id IN (SELECT id FROM events WHERE client_id = auth.uid())
  );

-- Invitee can read their own invitation (used by /invite/[token] accept page)
-- Token lookup is handled at the Route Handler level for security;
-- this policy lets an accepted invitee see the record via their user_id.
CREATE POLICY "invitee_read_own" ON event_invitations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Index for token lookup on the accept page
CREATE INDEX idx_event_invitations_token
  ON event_invitations(invitation_token);

-- Index for quickly finding all invitations for a given event
CREATE INDEX idx_event_invitations_event_id
  ON event_invitations(event_id);


-- =============================================================================
-- 4. user_can_access_event() HELPER FUNCTION
--    SECURITY DEFINER so it can read events + event_invitations regardless of
--    the caller's RLS context. Returns TRUE if the current auth.uid() is either:
--      (a) the event owner (events.client_id = auth.uid()), OR
--      (b) an accepted co-planner (event_invitations.status = 'accepted')
--    All event-scoped table policies reference this helper (COPL-03).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.user_can_access_event(evt_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM events
    WHERE id = evt_id AND client_id = auth.uid()
    UNION
    SELECT 1 FROM event_invitations
    WHERE event_id = evt_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  )
$$;


-- =============================================================================
-- 5. EVENTS RLS POLICIES (defined here, after helper exists)
--    Both event owner AND accepted co-planners can read/modify the event row.
--    INSERT is restricted to the owner (client_id = auth.uid()).
--    SELECT/UPDATE/DELETE use the helper so co-planners can also read/edit.
-- =============================================================================

-- Owner and co-planners can SELECT the event row
CREATE POLICY "event_participants_select" ON events
  FOR SELECT TO authenticated
  USING (public.user_can_access_event(id));

-- Only the owner can INSERT a new event (enforces one-event-per-client too)
CREATE POLICY "event_owner_insert" ON events
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

-- Owner and co-planners can UPDATE the event row
CREATE POLICY "event_participants_update" ON events
  FOR UPDATE TO authenticated
  USING (public.user_can_access_event(id))
  WITH CHECK (public.user_can_access_event(id));

-- Only the owner can DELETE the event
CREATE POLICY "event_owner_delete" ON events
  FOR DELETE TO authenticated
  USING (client_id = auth.uid());


-- =============================================================================
-- 6. EVENT_LOCATIONS
--    Multiple locations per event (EVENT-02).
-- =============================================================================

CREATE TABLE event_locations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label         text,             -- e.g. "Ceremony", "Reception"
  venue_name    text,
  address       text,
  role          text,             -- e.g. "ceremony", "reception"
  location_time time,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_access_locations" ON event_locations
  FOR ALL TO authenticated
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE INDEX idx_event_locations_event_id
  ON event_locations(event_id);


-- =============================================================================
-- 7. CHECKLIST_ITEMS
--    Covers CHECK-04 (supplier tasks), CHECK-05 (personal tasks), CHECK-06 (booking FK),
--    DISC-07 (offline supplier entry).
--    offline_supplier_price is INTEGER centavos (CLAUDE.md #1).
-- =============================================================================

CREATE TABLE checklist_items (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                  uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category                  text,
  title                     text NOT NULL,
  item_type                 text NOT NULL DEFAULT 'personal_task'
                            CHECK (item_type IN ('supplier_task', 'personal_task')),
  status                    text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'inquired', 'booked', 'done')),
  sort_order                integer NOT NULL DEFAULT 0,
  -- Offline supplier fields (DISC-07): client adds supplier not on the platform
  offline_supplier_name     text,
  offline_supplier_contact  text,
  offline_supplier_category text,
  offline_supplier_price    INTEGER,   -- centavos (CLAUDE.md #1)
  offline_supplier_notes    text,
  -- Nullable FK to bookings (Phase 4 will populate this — CHECK-06)
  booking_id                uuid,      -- FK to bookings table added in Phase 4
  created_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_access_checklist" ON checklist_items
  FOR ALL TO authenticated
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE INDEX idx_checklist_items_event_id
  ON checklist_items(event_id);


-- =============================================================================
-- 8. BUDGET_CATEGORIES
--    Per-category budget allocation (BUDG-02).
--    allocated_amount is INTEGER centavos (CLAUDE.md #1).
-- =============================================================================

CREATE TABLE budget_categories (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category          text NOT NULL,
  allocated_amount  INTEGER NOT NULL DEFAULT 0,  -- centavos (CLAUDE.md #1)
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_access_budget_categories" ON budget_categories
  FOR ALL TO authenticated
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE INDEX idx_budget_categories_event_id
  ON budget_categories(event_id);


-- =============================================================================
-- 9. EXPENSES
--    Records payment breakdown per supplier/item (BUDG-03).
--    total_amount, deposit_paid, remaining_balance are all INTEGER centavos.
-- =============================================================================

CREATE TABLE expenses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checklist_item_id   uuid REFERENCES checklist_items(id) ON DELETE SET NULL,
  supplier_name       text,
  total_amount        INTEGER NOT NULL DEFAULT 0,    -- centavos (CLAUDE.md #1)
  deposit_paid        INTEGER NOT NULL DEFAULT 0,    -- centavos (CLAUDE.md #1)
  deposit_paid_date   date,
  remaining_balance   INTEGER NOT NULL DEFAULT 0,    -- centavos (CLAUDE.md #1)
  balance_due_date    date,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_access_expenses" ON expenses
  FOR ALL TO authenticated
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE INDEX idx_expenses_event_id
  ON expenses(event_id);


-- =============================================================================
-- 10. RECEIPT_FILES
--     Payment receipt uploads attached to an expense (BUDG-04).
--     RLS policy joins through expenses to check event access.
-- =============================================================================

CREATE TABLE receipt_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id    uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,   -- path in the 'receipts' Supabase Storage bucket
  file_name     text NOT NULL,
  mime_type     text,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE receipt_files ENABLE ROW LEVEL SECURITY;

-- receipt_files has no direct event_id; join through expenses to check event access
CREATE POLICY "event_participants_access_receipt_files" ON receipt_files
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = receipt_files.expense_id
        AND public.user_can_access_event(e.event_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses e
      WHERE e.id = receipt_files.expense_id
        AND public.user_can_access_event(e.event_id)
    )
  );

CREATE INDEX idx_receipt_files_expense_id
  ON receipt_files(expense_id);


-- =============================================================================
-- 11. GUESTS
--     Guest list management (RSVP-01, RSVP-02).
--     full_name is required; nickname is optional for disambiguation (D-05).
-- =============================================================================

CREATE TABLE guests (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name     text NOT NULL,   -- RSVP-01: required
  nickname      text,            -- D-05: optional disambiguation (e.g. "Tita Cora")
  has_plus_one  boolean NOT NULL DEFAULT false,   -- RSVP-02
  plus_one_name text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_access_guests" ON guests
  FOR ALL TO authenticated
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE INDEX idx_guests_event_id
  ON guests(event_id);


-- =============================================================================
-- 12. RSVP_TOKENS
--     Shareable RSVP link token (RSVP-03). Token is generated by the app
--     using nanoid(20). RLS via event access.
-- =============================================================================

CREATE TABLE rsvp_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,   -- nanoid(20) — URL-safe, cryptographically random
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rsvp_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_access_rsvp_tokens" ON rsvp_tokens
  FOR ALL TO authenticated
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

-- Index for token lookup in public RSVP Route Handler
CREATE INDEX idx_rsvp_tokens_token
  ON rsvp_tokens(token);

CREATE INDEX idx_rsvp_tokens_event_id
  ON rsvp_tokens(event_id);


-- =============================================================================
-- 13. RSVP_RESPONSES
--     Guest RSVP submissions (RSVP-04, RSVP-05, RSVP-06, D-07).
--     UNIQUE(guest_id) enforces one response per guest (with upsert semantics).
--     RLS joins through guests → events since there is no direct event_id.
-- =============================================================================

CREATE TABLE rsvp_responses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id            uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status              text NOT NULL
                      CHECK (status IN ('attending', 'not_attending')),
  plus_one_attending  boolean,
  plus_one_name       text,
  meal_preference     text,        -- RSVP-06: only used when meal_preference_enabled
  responded_at        timestamptz NOT NULL DEFAULT now(),  -- D-07: response timestamp
  UNIQUE(guest_id)    -- one response per guest (upsert on update)
);

ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;

-- rsvp_responses has no direct event_id; join through guests to check event access
CREATE POLICY "event_participants_access_rsvp_responses" ON rsvp_responses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guests g
      WHERE g.id = rsvp_responses.guest_id
        AND public.user_can_access_event(g.event_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM guests g
      WHERE g.id = rsvp_responses.guest_id
        AND public.user_can_access_event(g.event_id)
    )
  );

CREATE INDEX idx_rsvp_responses_guest_id
  ON rsvp_responses(guest_id);


-- =============================================================================
-- 14. EVENT_FILES
--     General event file uploads — contracts, quotations, documents (FILE-01–04).
--     Accepted MIME types: PDF, JPEG, PNG only.
--     checklist_item_id is nullable for general event files (FILE-02).
-- =============================================================================

CREATE TABLE event_files (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checklist_item_id   uuid REFERENCES checklist_items(id) ON DELETE SET NULL,
  supplier_label      text,        -- optional label for display (e.g. supplier name)
  storage_path        text NOT NULL,   -- path in 'event-files' Supabase Storage bucket
  file_name           text NOT NULL,
  mime_type           text
                      CHECK (mime_type IN (
                        'application/pdf',
                        'image/jpeg',
                        'image/png'
                      )),           -- FILE-04: server-side MIME enforcement
  uploaded_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_participants_access_event_files" ON event_files
  FOR ALL TO authenticated
  USING (public.user_can_access_event(event_id))
  WITH CHECK (public.user_can_access_event(event_id));

CREATE INDEX idx_event_files_event_id
  ON event_files(event_id);
