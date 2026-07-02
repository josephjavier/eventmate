/**
 * e2e/specs/api/events-create.spec.ts
 * Focused API-level RLS regression for the createEvent bug.
 *
 * Bug: createEvent chained `.insert().select()` (INSERT ... RETURNING), which
 * re-reads the new row under the events SELECT policy `user_can_access_event(id)`.
 * That STABLE SECURITY DEFINER helper cannot see the row being inserted in the same
 * statement, so RETURNING was denied as an RLS violation. Fix: bare insert, then a
 * SEPARATE read (app/actions/events.ts). Also guarded end-to-end by
 * e2e/specs/ui/onboarding.spec.ts; this is the fast, precise DB-layer guard.
 *
 * These run as the AUTHENTICATED user (real JWT) so RLS is enforced — the
 * service-role admin client would bypass RLS and hide the bug.
 */

import { test, expect } from "../../fixtures/base";
import { signInAsUser } from "../../support/auth-client";
import { weddingEvent } from "../../fixtures/data/events";

test.describe("API: event creation under RLS", () => {
  test("owner can create an event (bare insert) and read it back — the createEvent path", async ({
    seededClient,
  }) => {
    const db = await signInAsUser(seededClient.email, seededClient.password);

    // Fixed pattern step 1: bare insert (NO .select()/RETURNING).
    const insert = await db.from("events").insert({
      client_id: seededClient.userId,
      title: weddingEvent.title,
      event_date: weddingEvent.event_date,
    });
    expect(insert.error, insert.error?.message).toBeNull();

    // Fixed pattern step 2: a SEPARATE read sees the committed row under RLS.
    const read = await db
      .from("events")
      .select("id, title")
      .eq("client_id", seededClient.userId)
      .single();
    expect(read.error, read.error?.message).toBeNull();
    expect(read.data?.title).toBe(weddingEvent.title);
    expect(read.data?.id).toBeTruthy();
  });

  test("INSERT ... RETURNING on events is rejected under RLS — the trap the fix avoids", async ({
    seededClient,
  }) => {
    const db = await signInAsUser(seededClient.email, seededClient.password);

    // Chaining .select() re-reads the new row under user_can_access_event(id),
    // which cannot see it mid-statement. This is the exact failure createEvent
    // avoids. If the events SELECT policy is ever relaxed to permit this (e.g.
    // `client_id = auth.uid() OR user_can_access_event(id)`), update this test.
    const returning = await db
      .from("events")
      .insert({ client_id: seededClient.userId, event_date: weddingEvent.event_date })
      .select("id")
      .single();

    expect(returning.error?.code).toBe("42501");
  });
});
