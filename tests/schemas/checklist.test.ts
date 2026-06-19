/**
 * DISC-07: Offline supplier schema validation
 *
 * Wave-0 failing-first spec. The schema under test is created in Wave 3
 * (lib/schemas/checklist.ts). These tests remain RED until that wave lands.
 *
 * Requirement: Client can add offline supplier (not on platform) to checklist item.
 * Required fields: name (non-empty), category (non-empty).
 */
import { describe, it, expect } from "vitest";
import { offlineSupplierSchema } from "@/lib/schemas/checklist";

describe("offline supplier schema (DISC-07)", () => {
  describe("name validation", () => {
    it("rejects empty name", () => {
      const result = offlineSupplierSchema.safeParse({
        name: "",
        category: "Photography",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing name", () => {
      const result = offlineSupplierSchema.safeParse({
        category: "Photography",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid supplier name", () => {
      const result = offlineSupplierSchema.safeParse({
        name: "Juan dela Cruz Photography",
        category: "Photography",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("category validation", () => {
    it("rejects empty category", () => {
      const result = offlineSupplierSchema.safeParse({
        name: "Juan dela Cruz Photography",
        category: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing category", () => {
      const result = offlineSupplierSchema.safeParse({
        name: "Juan dela Cruz Photography",
      });
      expect(result.success).toBe(false);
    });

    it("accepts a valid PH wedding supplier category", () => {
      const result = offlineSupplierSchema.safeParse({
        name: "Ate Nena's Catering",
        category: "Catering",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("optional fields", () => {
    it("accepts record with optional contact_name", () => {
      const result = offlineSupplierSchema.safeParse({
        name: "Santos Flowers",
        category: "Florist",
        contact_name: "Maria Santos",
      });
      expect(result.success).toBe(true);
    });

    it("accepts record without optional fields", () => {
      const result = offlineSupplierSchema.safeParse({
        name: "Santos Flowers",
        category: "Florist",
      });
      expect(result.success).toBe(true);
    });
  });
});
