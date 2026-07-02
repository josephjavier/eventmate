/**
 * e2e/specs/api/rsvp-search.spec.ts
 * API tests for GET /api/rsvp/[token]/search — enumeration guard, matching,
 * field minimization (T-1-12), and invalid-token handling.
 */

import { test, expect } from "../../fixtures/base";

const PUBLIC_FIELDS = ["full_name", "has_plus_one", "id", "nickname"];

test.describe("API: RSVP guest search", () => {
  test("returns empty for queries under 2 chars (enumeration guard)", async ({
    rsvpApi,
    seededEvent,
  }) => {
    const res = await rsvpApi.search(seededEvent.token, "M");
    expect(res.status()).toBe(200);
    expect((await res.json()).guests).toEqual([]);
  });

  test("matches by full name, caps at 5, and exposes only public fields", async ({
    rsvpApi,
    seededEvent,
  }) => {
    const res = await rsvpApi.search(seededEvent.token, "Maria");
    expect(res.status()).toBe(200);

    const { guests } = await res.json();
    expect(guests.length).toBeGreaterThanOrEqual(2); // two "Maria Santos"
    expect(guests.length).toBeLessThanOrEqual(5);

    // T-1-12: no contact info leaks — only the four whitelisted fields
    for (const g of guests) {
      expect(Object.keys(g).sort()).toEqual(PUBLIC_FIELDS);
    }
  });

  test("matches by nickname (D-05)", async ({ rsvpApi, seededEvent }) => {
    const res = await rsvpApi.search(seededEvent.token, "Johnny");
    const { guests } = await res.json();
    expect(guests.some((g: { full_name: string }) => g.full_name === "Juan Dela Cruz")).toBe(true);
  });

  test("returns 404 for an invalid token", async ({ rsvpApi }) => {
    const res = await rsvpApi.search("not-a-real-token", "Maria");
    expect(res.status()).toBe(404);
  });
});
