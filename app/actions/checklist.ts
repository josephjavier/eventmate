"use server"

/**
 * app/actions/checklist.ts
 * Server Actions for the wedding checklist.
 *
 * DUAL AUTH LAYER (CLAUDE.md §Architecture Decisions #5):
 * Every action calls verifySession() independently — never rely on middleware alone.
 *
 * RLS on checklist_items scoped to user_can_access_event(event_id).
 *
 * CHECK-01: Load Philippine wedding template on demand (D-13 — not auto-loaded)
 * CHECK-02: Add custom checklist item
 * CHECK-03: Delete item freely (D-14)
 * CHECK-04: Update item status (supplier: pending→inquired→booked; personal: pending→done)
 * CHECK-05: Rename item
 * DISC-07: Attach offline supplier (name + category required; price stored as centavos)
 * T-1-01: verifySession() on every action (cross-event access prevention)
 * T-1-08: offlineSupplierSchema validates input server-side; price via phpToCentavos
 * T-1-10: updateStatus enforces allowed transitions per item_type
 */

import { verifySession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { phpToCentavos } from "@/lib/utils"
import { CHECKLIST_TEMPLATE } from "@/lib/checklist-template"
import { offlineSupplierSchema, checklistItemSchema } from "@/lib/schemas/checklist"

// ─── Valid status sets per item_type (T-1-10) ─────────────────────────────────

const SUPPLIER_STATUSES = ["pending", "inquired", "booked"] as const
const PERSONAL_STATUSES = ["pending", "done"] as const

type SupplierStatus = (typeof SUPPLIER_STATUSES)[number]
type PersonalStatus = (typeof PERSONAL_STATUSES)[number]

// ─── loadTemplate ─────────────────────────────────────────────────────────────

/**
 * loadTemplate — bulk-inserts CHECKLIST_TEMPLATE rows into checklist_items
 * for the user's event. Only called on explicit user action (D-13 — not auto-loaded).
 *
 * Idempotent: if checklist already has items, returns early without duplicating.
 */
export async function loadTemplate(eventId: string) {
  const user = await verifySession()
  const supabase = await createClient()

  // Verify this event belongs to the current user (RLS also enforces this)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .single()

  if (!event) {
    return { error: "Event not found" }
  }

  // Guard: do not load template if items already exist
  const { count } = await supabase
    .from("checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)

  if (count && count > 0) {
    return { error: "Checklist already has items" }
  }

  const rows = CHECKLIST_TEMPLATE.map((item) => ({
    event_id: eventId,
    category: item.category,
    title: item.title,
    item_type: item.item_type,
    sort_order: item.sort_order,
    status: "pending",
  }))

  const { error } = await supabase.from("checklist_items").insert(rows)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/event/checklist")
  return { success: true }
}

// ─── addItem ──────────────────────────────────────────────────────────────────

/**
 * addItem — adds a custom checklist item to the event.
 * CHECK-02: Client can add a custom item.
 */
export async function addItem(formData: FormData) {
  const user = await verifySession()
  const supabase = await createClient()

  const parsed = checklistItemSchema.safeParse({
    title: formData.get("title"),
    item_type: formData.get("item_type") ?? "supplier_task",
    category: formData.get("category") ?? undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const eventId = formData.get("event_id") as string

  // Verify event ownership (RLS also enforces)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .single()

  if (!event) {
    return { error: "Event not found" }
  }

  // Determine next sort_order
  const { data: last } = await supabase
    .from("checklist_items")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (last?.sort_order ?? 0) + 1

  const { error } = await supabase.from("checklist_items").insert({
    event_id: eventId,
    title: parsed.data.title,
    item_type: parsed.data.item_type,
    category: parsed.data.category ?? null,
    sort_order: nextOrder,
    status: "pending",
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/event/checklist")
  return { success: true }
}

// ─── renameItem ───────────────────────────────────────────────────────────────

/**
 * renameItem — renames a checklist item.
 * CHECK-02: Client can rename a custom item.
 */
export async function renameItem(itemId: string, title: string) {
  await verifySession()
  const supabase = await createClient()

  if (!title || title.trim() === "") {
    return { error: "Title is required" }
  }

  // RLS policy on checklist_items ensures user can only update their own event items
  const { error } = await supabase
    .from("checklist_items")
    .update({ title: title.trim() })
    .eq("id", itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/event/checklist")
  return { success: true }
}

// ─── deleteItem ───────────────────────────────────────────────────────────────

/**
 * deleteItem — permanently deletes a checklist item.
 * CHECK-03: Client can delete any item freely (D-14 — nothing is locked).
 */
export async function deleteItem(itemId: string) {
  await verifySession()
  const supabase = await createClient()

  // RLS policy on checklist_items ensures user can only delete their own event items
  const { error } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/event/checklist")
  return { success: true }
}

// ─── updateStatus ─────────────────────────────────────────────────────────────

/**
 * updateStatus — updates the status of a checklist item.
 * CHECK-04: Supplier task: pending → inquired → booked.
 * CHECK-04: Personal task: pending → done.
 * T-1-10: Enforces allowed status set per item_type; DB CHECK constraint backs it.
 */
export async function updateStatus(
  itemId: string,
  status: string
) {
  await verifySession()
  const supabase = await createClient()

  // Fetch the item to determine item_type for status validation (T-1-10)
  const { data: item } = await supabase
    .from("checklist_items")
    .select("item_type")
    .eq("id", itemId)
    .single()

  if (!item) {
    return { error: "Item not found" }
  }

  // Enforce status flow per item_type (T-1-10)
  if (item.item_type === "supplier_task") {
    if (!SUPPLIER_STATUSES.includes(status as SupplierStatus)) {
      return {
        error: `Invalid status for supplier task. Allowed: ${SUPPLIER_STATUSES.join(", ")}`,
      }
    }
  } else if (item.item_type === "personal_task") {
    if (!PERSONAL_STATUSES.includes(status as PersonalStatus)) {
      return {
        error: `Invalid status for personal task. Allowed: ${PERSONAL_STATUSES.join(", ")}`,
      }
    }
  } else {
    return { error: "Unknown item type" }
  }

  const { error } = await supabase
    .from("checklist_items")
    .update({ status })
    .eq("id", itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/event/checklist")
  return { success: true }
}

// ─── attachOfflineSupplier ───────────────────────────────────────────────────

/**
 * attachOfflineSupplier — attaches an offline supplier to a checklist item.
 * DISC-07: name + category required; contact/price/notes optional.
 * T-1-08: offlineSupplierSchema validates server-side; price stored via phpToCentavos (INTEGER centavos).
 */
export async function attachOfflineSupplier(
  itemId: string,
  data: {
    name: string
    category: string
    contact?: string
    contact_name?: string
    price?: number
    notes?: string
  }
) {
  await verifySession()
  const supabase = await createClient()

  // Server-side validation (T-1-08)
  const parsed = offlineSupplierSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid supplier data" }
  }

  const { name, category, contact, contact_name, price, notes } = parsed.data

  // Combine contact_name and contact into the single contact field
  const contactValue = contact_name ?? contact ?? null

  // Price: convert PHP float to centavos INTEGER (CLAUDE.md #1, T-1-08)
  const priceCentavos = price != null ? phpToCentavos(price) : null

  // RLS ensures user can only update checklist items on their own event
  const { error } = await supabase
    .from("checklist_items")
    .update({
      offline_supplier_name: name,
      offline_supplier_category: category,
      offline_supplier_contact: contactValue,
      offline_supplier_price: priceCentavos,
      offline_supplier_notes: notes ?? null,
    })
    .eq("id", itemId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/event/checklist")
  return { success: true }
}
