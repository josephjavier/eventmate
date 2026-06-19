// lib/rsvp.ts
// RSVP token generation and deadline utilities.
//
// These are used by:
//   - app/actions/guests.ts    (generateRsvpToken when creating rsvp_tokens row)
//   - app/rsvp/[token]/page.tsx  (isRsvpDeadlinePassed for deadline gate)
//   - app/api/rsvp/[token]/respond/route.ts  (isRsvpDeadlinePassed to reject late submissions)
import { nanoid } from "nanoid";

/**
 * Generate a cryptographically random 20-character URL-safe RSVP token.
 *
 * Uses nanoid(20) which produces characters from [A-Za-z0-9_-].
 * This is shorter than a UUID (36 chars) and safe for use in URLs.
 *
 * @returns 20-character URL-safe token string
 */
export function generateRsvpToken(): string {
  return nanoid(20);
}

/**
 * Check whether the RSVP deadline has passed.
 *
 * The deadline date (YYYY-MM-DD) is treated as inclusive — guests can still
 * RSVP on the deadline day itself. The deadline passes at the end of that day
 * (i.e., when `now` is on a date strictly after the deadline date).
 *
 * @param deadline - RSVP deadline date string in YYYY-MM-DD format, or null
 * @param now - Current date/time (defaults to new Date()); injectable for testing
 * @returns true when the deadline has passed and RSVP should be locked
 */
export function isRsvpDeadlinePassed(
  deadline: string | null,
  now: Date = new Date()
): boolean {
  // No deadline set — RSVP is always open
  if (deadline === null) {
    return false;
  }

  // Extract YYYY-MM-DD from `now` in local time to compare with the deadline date.
  // We compare date strings directly to avoid timezone issues with time-of-day.
  const nowDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD in UTC

  // Deadline has passed when today (UTC) is strictly after the deadline date.
  // On the deadline day itself, RSVP is still open (nowDateStr === deadline → false).
  return nowDateStr > deadline;
}
