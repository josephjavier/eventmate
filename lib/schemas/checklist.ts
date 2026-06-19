/**
 * lib/schemas/checklist.ts
 * Zod v4 schemas for checklist item CRUD and offline supplier attachment.
 *
 * CHECK-01–07: Checklist CRUD validation
 * DISC-07: Offline supplier attachment — name + category required
 * T-1-08: offlineSupplierSchema validates server-side; price via phpToCentavos
 */
import { z } from "zod"

// ─── Offline Supplier Schema (DISC-07, T-1-08) ──────────────────────────────
// Required: name (non-empty), category (non-empty)
// Optional: contact_name, contact, price (PHP float → stored as centavos), notes

export const offlineSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  category: z.string().min(1, "Category is required"),
  contact_name: z.string().optional(),
  contact: z.string().optional(),
  price: z
    .number()
    .positive("Price must be a positive number")
    .optional(),
  notes: z.string().optional(),
})

export type OfflineSupplierFormValues = z.infer<typeof offlineSupplierSchema>

// ─── Checklist Item Schema ────────────────────────────────────────────────────

export const checklistItemSchema = z.object({
  title: z.string().min(1, "Item title is required"),
  item_type: z.enum(["supplier_task", "personal_task"]),
  category: z.string().optional(),
})

export type ChecklistItemFormValues = z.infer<typeof checklistItemSchema>

// ─── Rename Item Schema ───────────────────────────────────────────────────────

export const renameItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
})

export type RenameItemFormValues = z.infer<typeof renameItemSchema>
