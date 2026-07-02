/**
 * e2e/fixtures/data/guests.ts
 * Static guest list for RSVP specs.
 *
 * Deliberately includes the "Maria Santos" name collision (CLAUDE.md pitfall:
 * Filipino name collisions) so specs can assert the nickname disambiguation
 * path (D-05) — two guests share a full name, distinguished only by nickname.
 */

export const guests = [
  { full_name: "Maria Santos", nickname: "Maria", has_plus_one: true },
  { full_name: "Maria Santos", nickname: "Tita Cora", has_plus_one: false }, // collision
  { full_name: "Juan Dela Cruz", nickname: "Johnny", has_plus_one: false },
  { full_name: "Ramon Bautista", nickname: null, has_plus_one: true },
] as const;

/** Convenience accessors for specs (index into the seeded rows in this order). */
export const GUEST = {
  mariaWithPlusOne: 0,
  titaCora: 1,
  juan: 2,
  ramon: 3,
} as const;
