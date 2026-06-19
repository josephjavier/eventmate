/**
 * D-06 / RSVP-04: RSVP deadline gate
 *
 * Wave-0 failing-first spec. The function under test is created in Wave 8
 * (lib/rsvp.ts). These tests remain RED until that wave lands.
 *
 * Requirement: Guests can update RSVP response until a client-set deadline.
 * After deadline, RSVP page locks with "RSVP closed."
 *
 * Function signature: isRsvpDeadlinePassed(deadline: string | null, now?: Date): boolean
 */
import { describe, it, expect } from "vitest";
import { isRsvpDeadlinePassed } from "@/lib/rsvp";

describe("RSVP deadline gate (D-06 / RSVP-04)", () => {
  describe("when deadline has passed", () => {
    it("returns locked=true when rsvp_deadline is yesterday", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const deadline = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
      expect(isRsvpDeadlinePassed(deadline)).toBe(true);
    });

    it("returns locked=true for a deadline well in the past", () => {
      expect(isRsvpDeadlinePassed("2020-01-01")).toBe(true);
    });
  });

  describe("when deadline is today or in the future", () => {
    it("returns locked=false when rsvp_deadline is today", () => {
      const today = new Date();
      const deadline = today.toISOString().split("T")[0];
      expect(isRsvpDeadlinePassed(deadline)).toBe(false);
    });

    it("returns locked=false when rsvp_deadline is in the future", () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      const deadline = future.toISOString().split("T")[0];
      expect(isRsvpDeadlinePassed(deadline)).toBe(false);
    });
  });

  describe("when deadline is null", () => {
    it("returns locked=false when no deadline is set", () => {
      expect(isRsvpDeadlinePassed(null)).toBe(false);
    });
  });

  describe("with explicit 'now' parameter (time-travel for testing)", () => {
    it("returns locked=true when now is after the deadline", () => {
      const now = new Date("2026-12-31");
      expect(isRsvpDeadlinePassed("2026-06-01", now)).toBe(true);
    });

    it("returns locked=false when now is before the deadline", () => {
      const now = new Date("2026-01-01");
      expect(isRsvpDeadlinePassed("2026-12-31", now)).toBe(false);
    });
  });
});
