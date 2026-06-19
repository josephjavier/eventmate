/**
 * lib/schemas/budget.ts
 * Zod v4 schemas for budget CRUD and the isOverBudget pure helper.
 *
 * BUDG-01: All amounts are non-negative numbers (stored as INTEGER centavos by Server Actions)
 * BUDG-02: categorySchema validates category allocation input
 * BUDG-03: expenseSchema validates expense entry with deposit/balance/dates
 * BUDG-04: attachReceipt validated by ALLOWED_RECEIPT_MIMES (pdf/jpeg/png)
 * BUDG-05: isOverBudget(spent, allocated) compares centavos integers
 * T-1-03:  Float rounding prevented by Math.round in Server Actions; never in schema
 *
 * Architecture (CLAUDE.md #1): All monetary inputs here are PHP amounts (user input).
 * Server Actions convert to INTEGER centavos via phpToCentavos() before DB insert.
 */
import { z } from "zod";

// ─── Allowed receipt MIME types (BUDG-04, T-1-11) ────────────────────────────
export const ALLOWED_RECEIPT_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

// ─── Set Total Budget Schema (BUDG-01) ───────────────────────────────────────

export const setBudgetSchema = z.object({
  total_budget: z
    .number()
    .min(0, "Budget must be a non-negative number"),
});

export type SetBudgetFormValues = z.infer<typeof setBudgetSchema>;

// ─── Category Allocation Schema (BUDG-02) ────────────────────────────────────

export const categorySchema = z.object({
  category: z.string().min(1, "Category is required"),
  allocated: z
    .number()
    .min(0, "Allocated amount must be a non-negative number"),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

// ─── Expense Schema (BUDG-03) ────────────────────────────────────────────────
// total_amount and deposit_paid are PHP amounts (floats from user input).
// remaining_balance is computed server-side: total - deposit (never user-supplied).

export const expenseSchema = z.object({
  supplier_name: z
    .string()
    .min(1, "Supplier name is required"),
  total_amount: z
    .number()
    .min(0, "Total amount must be a non-negative number"),
  deposit_paid: z
    .number()
    .min(0, "Deposit paid must be a non-negative number"),
  deposit_paid_date: z.string().optional(),  // ISO date string
  balance_due_date: z.string().optional(),   // ISO date string
  checklist_item_id: z.string().uuid().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// ─── isOverBudget (BUDG-05, T-1-03) ─────────────────────────────────────────
// Pure helper — used by both UI (CategoryList) and budget.test.ts.
// All amounts in INTEGER centavos. Returns true when spent STRICTLY exceeds allocated.

/**
 * Returns true when category spending strictly exceeds its allocated budget.
 *
 * @param spentCentavos   - SUM(expenses.total_amount) for the category (centavos)
 * @param allocatedCentavos - budget_categories.allocated_amount (centavos)
 */
export function isOverBudget(
  spentCentavos: number,
  allocatedCentavos: number
): boolean {
  return spentCentavos > allocatedCentavos;
}
