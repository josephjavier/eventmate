/**
 * e2e/fixtures/data/events.ts
 * Static event + location payloads used by the seeder.
 *
 * NOTE (CLAUDE.md #1): all monetary values are INTEGER centavos — ₱500,000.00
 * is 50_000_000, never 500000.0. Test data must model money the same way the DB does.
 */

/** ISO `yyyy-mm-dd` for a date `days` from today (dates are stored as DATE). */
export function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const weddingEvent = {
  title: "Maria & Jose — Forever Starts Here",
  event_type: "wedding",
  event_date: futureDate(240), // ~8 months out → dashboard countdown is positive
  event_time: "15:00:00",
  total_budget: 50_000_000, // ₱500,000.00 in centavos
  rsvp_deadline: futureDate(120), // RSVP still OPEN
  meal_preference_enabled: true, // exercises the RSVP-06 meal-preference branch
} as const;

/** A separate event whose RSVP window has already closed (deadline in the past). */
export const closedRsvpEvent = {
  title: "Anna & Paolo — Thank You",
  event_type: "wedding",
  event_date: futureDate(10),
  rsvp_deadline: futureDate(-5), // deadline PASSED → RSVP closed state
  meal_preference_enabled: false,
} as const;

export const ceremonyLocation = {
  label: "Ceremony",
  role: "ceremony",
  venue_name: "Manila Cathedral",
  address: "Cabildo St, Intramuros, Manila",
  location_time: "15:00:00",
} as const;

export const receptionLocation = {
  label: "Reception",
  role: "reception",
  venue_name: "The Peninsula Manila",
  address: "Ayala Ave, Makati",
  location_time: "18:00:00",
} as const;
