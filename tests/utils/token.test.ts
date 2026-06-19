/**
 * RSVP-03: RSVP token generation
 *
 * Wave-0 failing-first spec. The function under test is created in Wave 3
 * (lib/utils.ts or lib/rsvp.ts). These tests remain RED until that wave lands.
 *
 * Requirement: RSVP token is nanoid(20) — 20 URL-safe characters.
 */
import { describe, it, expect } from "vitest";
import { generateRsvpToken } from "@/lib/rsvp";

describe("RSVP token generation (RSVP-03)", () => {
  it("generates a token with exactly 20 characters", () => {
    const token = generateRsvpToken();
    expect(token).toHaveLength(20);
  });

  it("generates a URL-safe token (only A-Z, a-z, 0-9, _, -)", () => {
    const token = generateRsvpToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{20}$/);
  });

  it("generates unique tokens on successive calls", () => {
    const token1 = generateRsvpToken();
    const token2 = generateRsvpToken();
    expect(token1).not.toBe(token2);
  });
});
