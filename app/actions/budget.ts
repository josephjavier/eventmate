"use server"

/**
 * app/actions/budget.ts
 * Server Actions for the wedding budget feature.
 *
 * DUAL AUTH LAYER (CLAUDE.md §Architecture Decisions #5):
 * Every action calls verifySession() independently — never rely on middleware alone.
 *
 * INTEGER CENTAVOS (CLAUDE.md §Architecture Decisions #1, T-1-03):
 * All monetary values stored as INTEGER centavos. Use phpToCentavos() (Math.round(x*100))
 * before every DB insert. NEVER store floats.
 *
 * BUDG-01: setBudget — sets events.total_budget as INTEGER centavos
 * BUDG-02: upsertCategory — upserts budget_categories.allocated_amount as INTEGER centavos
 * BUDG-03: createExpense — inserts expenses with total/deposit/remaining (all INTEGER centavos)
 *          remaining_balance computed as total - deposit (never user-supplied)
 * BUDG-04: attachReceipt — inserts receipt_files; server-side MIME validation (pdf/jpeg/png)
 * T-1-01:  verifySession() on every action (cross-event access prevention via RLS + DAL)
 * T-1-03:  phpToCentavos / Math.round used for ALL money conversions; no float stored
 * T-1-11:  attachReceipt rejects MIME types outside pdf/jpeg/png
 */

import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { phpToCentavos } from "@/lib/utils";
import {
  setBudgetSchema,
  categorySchema,
  expenseSchema,
  ALLOWED_RECEIPT_MIMES,
} from "@/lib/schemas/budget";

// ─── setBudget ────────────────────────────────────────────────────────────────

/**
 * setBudget — updates events.total_budget for the authenticated user's event.
 * Stores as INTEGER centavos (phpToCentavos converts PHP float to centavos).
 *
 * BUDG-01: couple can set a total wedding budget in pesos.
 */
export async function setBudget(eventId: string, phpAmount: number) {
  const user = await verifySession();
  const supabase = await createClient();

  const parsed = setBudgetSchema.safeParse({ total_budget: phpAmount });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid budget amount" };
  }

  // T-1-03: Convert to INTEGER centavos — never store float
  const budgetCentavos = phpToCentavos(parsed.data.total_budget);

  const { error } = await supabase
    .from("events")
    .update({ total_budget: budgetCentavos })
    .eq("id", eventId)
    .eq("client_id", user.id); // belt-and-suspenders: RLS also enforces ownership

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/budget");
  return { success: true };
}

// ─── upsertCategory ───────────────────────────────────────────────────────────

/**
 * upsertCategory — creates or updates a budget_categories row for a given category.
 * Stores allocated_amount as INTEGER centavos.
 *
 * BUDG-02: couple can allocate a budget amount per category.
 * Upserts on (event_id, category) — the schema UNIQUE constraint ensures idempotency.
 */
export async function upsertCategory(
  eventId: string,
  category: string,
  allocatedPhp: number
) {
  const user = await verifySession();
  const supabase = await createClient();

  const parsed = categorySchema.safeParse({ category, allocated: allocatedPhp });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid category data" };
  }

  // T-1-03: Convert to INTEGER centavos — never store float
  const allocatedCentavos = phpToCentavos(parsed.data.allocated);

  // Verify event ownership before upsert (belt-and-suspenders; RLS also enforces)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .single();

  if (!event) {
    return { error: "Event not found" };
  }

  const { error } = await supabase
    .from("budget_categories")
    .upsert(
      {
        event_id: eventId,
        category: parsed.data.category,
        allocated_amount: allocatedCentavos,
      },
      { onConflict: "event_id,category" }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/budget");
  return { success: true };
}

// ─── createExpense ────────────────────────────────────────────────────────────

/**
 * createExpense — inserts a new expense row.
 * BUDG-03: records total price, deposit paid (+ date), remaining balance, balance due date.
 *
 * remaining_balance = total_amount - deposit_paid (computed here, never user-supplied).
 * All amounts converted via Math.round(x * 100) — INTEGER centavos (T-1-03).
 */
export async function createExpense(
  eventId: string,
  data: {
    supplier_name: string;
    total_amount: number;
    deposit_paid: number;
    deposit_paid_date?: string;
    balance_due_date?: string;
    checklist_item_id?: string;
  }
) {
  const user = await verifySession();
  const supabase = await createClient();

  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid expense data" };
  }

  // Verify event ownership (belt-and-suspenders; RLS also enforces)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .single();

  if (!event) {
    return { error: "Event not found" };
  }

  // T-1-03: Convert PHP amounts to INTEGER centavos using Math.round — never store float
  const totalAmountCentavos = Math.round(parsed.data.total_amount * 100);
  const depositPaidCentavos = Math.round(parsed.data.deposit_paid * 100);
  // remaining computed server-side — user never supplies this directly
  const remainingCentavos = totalAmountCentavos - depositPaidCentavos;

  const { error } = await supabase.from("expenses").insert({
    event_id: eventId,
    supplier_name: parsed.data.supplier_name,
    total_amount: totalAmountCentavos,
    deposit_paid: depositPaidCentavos,
    remaining_balance: remainingCentavos,
    deposit_paid_date: parsed.data.deposit_paid_date ?? null,
    balance_due_date: parsed.data.balance_due_date ?? null,
    checklist_item_id: parsed.data.checklist_item_id ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/budget");
  return { success: true };
}

// ─── updateExpense ────────────────────────────────────────────────────────────

/**
 * updateExpense — updates an existing expense row.
 * Re-computes remaining_balance = total - deposit on every update.
 */
export async function updateExpense(
  expenseId: string,
  data: {
    supplier_name?: string;
    total_amount?: number;
    deposit_paid?: number;
    deposit_paid_date?: string;
    balance_due_date?: string;
    checklist_item_id?: string;
  }
) {
  const user = await verifySession();
  const supabase = await createClient();

  // Fetch current expense to get base values for partial update
  const { data: current } = await supabase
    .from("expenses")
    .select("total_amount, deposit_paid")
    .eq("id", expenseId)
    .single();

  if (!current) {
    return { error: "Expense not found" };
  }

  // Convert incoming PHP amounts (if provided) to centavos; use DB values otherwise
  const totalAmountCentavos =
    data.total_amount !== undefined
      ? Math.round(data.total_amount * 100)
      : current.total_amount;

  const depositPaidCentavos =
    data.deposit_paid !== undefined
      ? Math.round(data.deposit_paid * 100)
      : current.deposit_paid;

  const remainingCentavos = totalAmountCentavos - depositPaidCentavos;

  // RLS on expenses ensures only the event owner / co-planner can update
  const { error } = await supabase
    .from("expenses")
    .update({
      total_amount: totalAmountCentavos,
      deposit_paid: depositPaidCentavos,
      remaining_balance: remainingCentavos,
      supplier_name: data.supplier_name,
      deposit_paid_date: data.deposit_paid_date,
      balance_due_date: data.balance_due_date,
      checklist_item_id: data.checklist_item_id,
    })
    .eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/budget");
  return { success: true };
}

// ─── deleteExpense ────────────────────────────────────────────────────────────

/**
 * deleteExpense — permanently removes an expense and any attached receipt_files
 * (ON DELETE CASCADE on the FK handles receipt_files cleanup).
 */
export async function deleteExpense(expenseId: string) {
  const user = await verifySession();
  const supabase = await createClient();

  // RLS on expenses enforces event access
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/budget");
  return { success: true };
}

// ─── attachReceipt ────────────────────────────────────────────────────────────

/**
 * attachReceipt — inserts a receipt_files row after the file has been uploaded
 * to the 'receipts' Supabase Storage bucket.
 *
 * BUDG-04: couple can attach a receipt (PDF/JPG/PNG) to an expense.
 * T-1-11: MIME type is validated server-side; only pdf/jpeg/png accepted.
 */
export async function attachReceipt(
  expenseId: string,
  storagePath: string,
  fileName: string,
  mimeType: string
) {
  const user = await verifySession();
  const supabase = await createClient();

  // T-1-11: Server-side MIME validation — reject anything outside pdf/jpeg/png
  if (!(ALLOWED_RECEIPT_MIMES as readonly string[]).includes(mimeType)) {
    return {
      error: `Invalid file type. Only PDF, JPEG, and PNG files are accepted. Got: ${mimeType}`,
    };
  }

  if (!storagePath || !fileName) {
    return { error: "Storage path and file name are required" };
  }

  // RLS on receipt_files joins through expenses to check event access
  const { error } = await supabase.from("receipt_files").insert({
    expense_id: expenseId,
    storage_path: storagePath,
    file_name: fileName,
    mime_type: mimeType,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/budget");
  return { success: true };
}
