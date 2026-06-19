/**
 * lib/schemas/event.ts
 * Zod v4 schemas for event creation and location forms.
 * EVENT-01: Event must have a date
 * EVENT-02: Multiple event locations (ceremony + reception)
 */
import { z } from "zod"

export const createEventSchema = z.object({
  title: z.string().optional().default("Our Wedding"),
  event_date: z.string().min(1, "Wedding date is required"),
  event_time: z.string().optional(),
  total_budget: z.string().optional(),
})

export type CreateEventFormValues = z.infer<typeof createEventSchema>

export const locationSchema = z.object({
  venue_name: z.string().optional(),
  address: z.string().optional(),
  role: z.string().optional(),
})

export type LocationFormValues = z.infer<typeof locationSchema>

export const updateEventSchema = z.object({
  title: z.string().optional(),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  total_budget: z.string().optional(),
  color_motif: z.string().optional(),
  rsvp_deadline: z.string().optional(),
})

export type UpdateEventFormValues = z.infer<typeof updateEventSchema>
