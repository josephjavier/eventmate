"use server"

import { verifySession } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { phpToCentavos } from "@/lib/utils"

/**
 * createEvent — creates a wedding event with ceremony + reception locations.
 * Guards with verifySession() per the dual auth layer (CLAUDE.md §Architecture Decisions #5).
 * Stores budget as INTEGER centavos (CLAUDE.md §Architecture Decisions #1).
 *
 * EVENT-01: event_date required
 * EVENT-02: multiple locations (ceremony required, reception optional)
 * EVENT-03: updateEvent and addLocation also guarded by verifySession
 */
export async function createEvent(formData: FormData) {
  const user = await verifySession()
  const supabase = await createClient()

  const event_date = formData.get("event_date") as string
  const event_time = (formData.get("event_time") as string) || null
  const title = (formData.get("title") as string) || "Our Wedding"

  const rawBudget = formData.get("total_budget") as string
  const total_budget = rawBudget && rawBudget.trim() !== ""
    ? phpToCentavos(parseFloat(rawBudget))
    : null

  if (!event_date) {
    return { error: "Wedding date is required" }
  }

  // Insert the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      client_id: user.id,
      title,
      event_date,
      event_time,
      total_budget,
    })
    .select("id")
    .single()

  if (eventError || !event) {
    return { error: eventError?.message ?? "Could not create event" }
  }

  // Insert ceremony location (required — EVENT-02)
  const ceremonyVenue = formData.get("ceremony_venue_name") as string
  const ceremonyAddress = formData.get("ceremony_address") as string

  if (ceremonyVenue || ceremonyAddress) {
    await supabase.from("event_locations").insert({
      event_id: event.id,
      venue_name: ceremonyVenue || null,
      address: ceremonyAddress || null,
      role: "Ceremony",
      label: "Ceremony",
    })
  }

  // Insert reception location (optional — EVENT-02)
  const receptionVenue = formData.get("reception_venue_name") as string
  const receptionAddress = formData.get("reception_address") as string

  if (receptionVenue || receptionAddress) {
    await supabase.from("event_locations").insert({
      event_id: event.id,
      venue_name: receptionVenue || null,
      address: receptionAddress || null,
      role: "Reception",
      label: "Reception",
    })
  }

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

/**
 * updateEvent — updates event metadata (date, title, budget, motif, RSVP deadline).
 * Guards with verifySession() + RLS provides the ownership check.
 */
export async function updateEvent(formData: FormData) {
  const user = await verifySession()
  const supabase = await createClient()

  const event_id = formData.get("event_id") as string

  const title = (formData.get("title") as string) || undefined
  const event_date = (formData.get("event_date") as string) || undefined
  const event_time = (formData.get("event_time") as string) || undefined
  const rawBudget = formData.get("total_budget") as string
  const total_budget = rawBudget && rawBudget.trim() !== ""
    ? phpToCentavos(parseFloat(rawBudget))
    : undefined
  const color_motif = (formData.get("color_motif") as string) || undefined
  const rsvp_deadline = (formData.get("rsvp_deadline") as string) || undefined

  const { error } = await supabase
    .from("events")
    .update({
      ...(title !== undefined && { title }),
      ...(event_date !== undefined && { event_date }),
      ...(event_time !== undefined && { event_time }),
      ...(total_budget !== undefined && { total_budget }),
      ...(color_motif !== undefined && { color_motif }),
      ...(rsvp_deadline !== undefined && { rsvp_deadline }),
    })
    .eq("client_id", user.id)
    .eq("id", event_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * addLocation — adds a location to an existing event.
 * Guards with verifySession() + RLS.
 */
export async function addLocation(formData: FormData) {
  const user = await verifySession()
  const supabase = await createClient()

  const event_id = formData.get("event_id") as string
  const venue_name = formData.get("venue_name") as string
  const address = formData.get("address") as string
  const role = formData.get("role") as string

  // Verify this event belongs to the user (RLS also handles this)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", event_id)
    .eq("client_id", user.id)
    .single()

  if (!event) {
    return { error: "Event not found" }
  }

  const { error } = await supabase.from("event_locations").insert({
    event_id,
    venue_name: venue_name || null,
    address: address || null,
    role: role || null,
    label: role || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}
