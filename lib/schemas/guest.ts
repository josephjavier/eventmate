/**
 * lib/schemas/guest.ts
 * Zod v4 schemas for guest management and RSVP operations.
 *
 * RSVP-01: Couple can add guests with full name, optional nickname, and +1
 * RSVP-02: Couple can set a per-guest +1 and optional +1 name
 * RSVP-07: Couple can see RSVP summary (Invited / Going / Not Going / Pending)
 * RSVP-08: Couple can manually override any guest's RSVP status
 * D-05: Guest has full_name (required) + nickname (optional) for Filipino naming conventions
 * D-06: RSVP deadline is a date set by the client couple
 */
import { z } from "zod";

// ─── addGuestSchema ───────────────────────────────────────────────────────────

/**
 * Schema for adding a new guest to the guest list.
 *
 * RSVP-01: full_name is required; nickname is optional (D-05).
 * RSVP-02: has_plus_one flag; plus_one_name is optional even when +1 is enabled.
 */
export const addGuestSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  nickname: z.string().optional(),
  has_plus_one: z.boolean().optional().default(false),
  plus_one_name: z.string().optional(),
});

/**
 * AddGuestFormValues uses z.input to get the "before default" types for react-hook-form.
 * This ensures `has_plus_one` is typed as `boolean | undefined` in form state,
 * while the schema output always has `boolean` (via .default(false)).
 */
export type AddGuestFormValues = z.input<typeof addGuestSchema>;

// ─── updateGuestSchema ────────────────────────────────────────────────────────

/**
 * Schema for editing an existing guest record.
 * Same fields as addGuestSchema — all updates go through the same validation.
 */
export const updateGuestSchema = addGuestSchema;

export type UpdateGuestFormValues = z.input<typeof updateGuestSchema>;

// ─── overrideRsvpSchema ───────────────────────────────────────────────────────

/**
 * Schema for client-side manual RSVP status override.
 *
 * RSVP-08: Couple can override any guest's RSVP status (attending / not_attending / pending).
 * 'pending' resets the response back to unanswered state.
 */
export const overrideRsvpSchema = z.object({
  status: z.enum(["attending", "not_attending", "pending"]),
});

export type OverrideRsvpFormValues = z.infer<typeof overrideRsvpSchema>;

// ─── rsvpDeadlineSchema ───────────────────────────────────────────────────────

/**
 * Schema for setting the RSVP deadline date.
 *
 * D-06: Client can set a deadline date (YYYY-MM-DD) after which the RSVP page locks.
 * Deadline day is inclusive — guests can still RSVP on the deadline day itself.
 */
export const rsvpDeadlineSchema = z.object({
  date: z.string().min(1, "Deadline date is required"),
});

export type RsvpDeadlineFormValues = z.infer<typeof rsvpDeadlineSchema>;
