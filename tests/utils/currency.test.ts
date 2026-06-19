/**
 * BUDG-01: INTEGER centavos arithmetic
 *
 * Wave-0 failing-first spec. The functions under test are created in Wave 3
 * (lib/utils.ts). These tests will remain RED until that wave lands.
 *
 * Requirement: All monetary values stored as INTEGER centavos. ₱50,000 = 5000000.
 */
import { describe, it, expect } from "vitest";
import { phpToCentavos, centavosToPhp, formatPHP } from "@/lib/utils";

describe("currency utilities (BUDG-01)", () => {
  describe("phpToCentavos", () => {
    it("converts ₱50,000 to 5000000 centavos", () => {
      expect(phpToCentavos(50000)).toBe(5000000);
    });

    it("converts ₱1 to 100 centavos", () => {
      expect(phpToCentavos(1)).toBe(100);
    });

    it("rounds fractional pesos correctly (₱0.005 → 1 centavo)", () => {
      expect(phpToCentavos(0.005)).toBe(1);
    });

    it("handles large wedding budgets (₱500,000 → 50000000)", () => {
      expect(phpToCentavos(500000)).toBe(50000000);
    });
  });

  describe("centavosToPhp", () => {
    it("converts 5000000 centavos to ₱50,000", () => {
      expect(centavosToPhp(5000000)).toBe(50000);
    });

    it("converts 100 centavos to ₱1", () => {
      expect(centavosToPhp(100)).toBe(1);
    });
  });

  describe("formatPHP", () => {
    it("formats 5000000 centavos as a string containing '50,000'", () => {
      expect(formatPHP(5000000)).toMatch(/50,000/);
    });

    it("formats 0 centavos as a string containing '0'", () => {
      expect(formatPHP(0)).toMatch(/0/);
    });
  });
});
