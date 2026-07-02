/**
 * e2e/specs/api/rsvp-respond.spec.ts
 * API tests for POST /api/rsvp/[token]/respond — input validation, the happy
 * path, cross-event tampering (T-1-13), and invalid-token handling.
 */

import { randomUUID } from "node:crypto";
import { test, expect } from "../../fixtures/base";
import { GUEST } from "../../fixtures/data/guests";

test.describe("API: RSVP respond", () => {
  test("returns 400 when required fields are missing", async ({ rsvpApi, seededEvent }) => {
    const res = await rsvpApi.respond(seededEvent.token, {});
    expect(res.status()).toBe(400);
  });

  test("returns 400 for an invalid status value", async ({ rsvpApi, seededEvent }) => {
    const res = await rsvpApi.respond(seededEvent.token, {
      guest_id: seededEvent.guests[GUEST.juan].id,
      status: "maybe",
    });
    expect(res.status()).toBe(400);
  });

  test("records a valid response (upsert)", async ({ rsvpApi, seededEvent }) => {
    const res = await rsvpApi.respond(seededEvent.token, {
      guest_id: seededEvent.guests[GUEST.juan].id,
      status: "not_attending",
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test("returns 403 for a guest_id not on this event (T-1-13)", async ({
    rsvpApi,
    seededEvent,
  }) => {
    const res = await rsvpApi.respond(seededEvent.token, {
      guest_id: randomUUID(),
      status: "attending",
    });
    expect(res.status()).toBe(403);
  });

  test("returns 404 for an invalid token", async ({ rsvpApi, seededEvent }) => {
    const res = await rsvpApi.respond("not-a-real-token", {
      guest_id: seededEvent.guests[GUEST.juan].id,
      status: "attending",
    });
    expect(res.status()).toBe(404);
  });
});
