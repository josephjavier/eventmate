/**
 * BUDG-01, BUDG-02, BUDG-03: Budget centavos math + isOverBudget helper
 *
 * TDD RED phase — these tests import from modules not yet created:
 *   - lib/schemas/budget.ts (isOverBudget)
 *   - app/actions/budget.ts (Server Actions — only pure-logic exports tested here)
 *
 * Requirement: All money stored as INTEGER centavos. remaining_balance = total - deposit.
 */
import { describe, it, expect } from "vitest";
import { isOverBudget } from "@/lib/schemas/budget";
import { phpToCentavos, centavosToPhp } from "@/lib/utils";

describe("budget centavos math (BUDG-01, BUDG-03)", () => {
  describe("remaining_balance computation", () => {
    it("remaining = total - deposit (₱50,000 total - ₱15,000 deposit = ₱35,000)", () => {
      const total = phpToCentavos(50000); // 5000000
      const deposit = phpToCentavos(15000); // 1500000
      const remaining = total - deposit; // 3500000
      expect(remaining).toBe(3500000);
    });

    it("remaining = 0 when deposit equals total", () => {
      const total = phpToCentavos(20000); // 2000000
      const deposit = phpToCentavos(20000); // 2000000
      expect(total - deposit).toBe(0);
    });

    it("converts centavos back to PHP for display", () => {
      const remainingCentavos = 3500000;
      expect(centavosToPhp(remainingCentavos)).toBe(35000);
    });

    it("handles large wedding budgets without rounding (₱500,000)", () => {
      const total = phpToCentavos(500000); // 50000000
      const deposit = phpToCentavos(100000); // 10000000
      const remaining = total - deposit;
      expect(remaining).toBe(40000000);
    });
  });

  describe("isOverBudget (BUDG-05)", () => {
    it("returns true when spent > allocated", () => {
      expect(isOverBudget(6000000, 5000000)).toBe(true); // ₱60k > ₱50k
    });

    it("returns false when spent < allocated", () => {
      expect(isOverBudget(4000000, 5000000)).toBe(false); // ₱40k < ₱50k
    });

    it("returns false when spent === allocated (exactly at limit)", () => {
      expect(isOverBudget(5000000, 5000000)).toBe(false); // equal is not over
    });

    it("returns false when spent = 0 and allocated > 0", () => {
      expect(isOverBudget(0, 5000000)).toBe(false);
    });

    it("returns false when both are 0 (unallocated category)", () => {
      expect(isOverBudget(0, 0)).toBe(false);
    });

    it("works with realistic PH wedding amounts (₱85,000 spent vs ₱80,000 allocated)", () => {
      const spent = phpToCentavos(85000); // 8500000
      const allocated = phpToCentavos(80000); // 8000000
      expect(isOverBudget(spent, allocated)).toBe(true);
    });
  });
});
