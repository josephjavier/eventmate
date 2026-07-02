/**
 * e2e/support/seed.ts
 * Run-scoped seeding + teardown built on the service-role client.
 *
 * Isolation model:
 *   - Users are created pre-confirmed via `auth.admin.createUser({ email_confirm: true })`
 *     so tests can log in immediately (no email-confirmation round-trip).
 *   - Every user lives in the `e2e+` namespace with a run-scoped email.
 *   - Teardown deletes the seeded auth user; profiles → events → locations →
 *     guests → rsvp_tokens → rsvp_responses all cascade (ON DELETE CASCADE),
 *     so one delete removes the entire object graph a test created.
 *
 * Fixtures call `deleteUser()` in their teardown for fast, precise cleanup;
 * global-teardown additionally runs `sweepE2EUsers()` as a safety net.
 */

import { admin } from "./supabase-admin";
import { e2eEmail, isE2EEmail } from "./run-context";
import type { Database } from "@/types/database";
import { customAlphabet } from "nanoid";

type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
type LocationInsert = Database["public"]["Tables"]["event_locations"]["Insert"];
type GuestInsert = Database["public"]["Tables"]["guests"]["Insert"];
type GuestRow = Database["public"]["Tables"]["guests"]["Row"];

// nanoid(20) — matches the app's RSVP token length convention.
const tokenId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-",
  20,
);

// Per-call uniqueness so concurrent tests sharing a label never collide on email.
const uniq = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 5);

export interface SeededUser {
  userId: string;
  email: string;
  password: string;
}

export interface SeededEvent {
  owner: SeededUser;
  eventId: string;
  token: string;
  guests: GuestRow[];
}

/** Create a pre-confirmed client user in the E2E namespace. */
export async function seedClientUser(
  label: string,
  opts: { password?: string; consent?: boolean } = {},
): Promise<SeededUser> {
  // Append per-call uniqueness so two tests with the same label don't collide.
  const email = e2eEmail(`${label}-${uniq()}`);
  const password = opts.password ?? "E2ePassw0rd!seed";

  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`[seed] createUser failed for ${email}: ${error?.message}`);
  }
  const userId = data.user.id;

  // The handle_new_user() trigger already inserted the profile row (role=client).
  // Record consent for realism (RA 10173) when requested.
  if (opts.consent !== false) {
    await admin()
      .from("profiles")
      .update({ consent_given_at: new Date().toISOString() })
      .eq("id", userId);
  }

  return { userId, email, password };
}

/** Insert an event owned by the given client. Returns the new event id. */
export async function seedEvent(
  clientId: string,
  event: Omit<EventInsert, "client_id">,
): Promise<string> {
  const { data, error } = await admin()
    .from("events")
    .insert({ ...event, client_id: clientId })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(`[seed] insert event failed: ${error?.message}`);
  }
  return data.id;
}

/** Insert event locations (ceremony/reception, etc.). */
export async function seedLocations(
  eventId: string,
  locations: Omit<LocationInsert, "event_id">[],
): Promise<void> {
  if (locations.length === 0) return;
  const { error } = await admin()
    .from("event_locations")
    .insert(locations.map((l) => ({ ...l, event_id: eventId })));
  if (error) throw new Error(`[seed] insert locations failed: ${error.message}`);
}

/** Insert guests. Returns the created rows (with ids) in insertion order. */
export async function seedGuests(
  eventId: string,
  guests: Omit<GuestInsert, "event_id">[],
): Promise<GuestRow[]> {
  const { data, error } = await admin()
    .from("guests")
    .insert(guests.map((g) => ({ ...g, event_id: eventId })))
    .select("*");
  if (error || !data) {
    throw new Error(`[seed] insert guests failed: ${error?.message}`);
  }
  return data;
}

/** Insert an RSVP token for the event. Returns the token string. */
export async function seedRsvpToken(
  eventId: string,
  token: string = tokenId(),
): Promise<string> {
  const { error } = await admin()
    .from("rsvp_tokens")
    .insert({ event_id: eventId, token });
  if (error) throw new Error(`[seed] insert rsvp_token failed: ${error.message}`);
  return token;
}

/**
 * Composite seed: a confirmed owner + event + locations + guests + RSVP token.
 * The typical entry point for RSVP UI and API specs.
 */
export async function seedFullEvent(input: {
  label: string;
  event: Omit<EventInsert, "client_id">;
  locations?: Omit<LocationInsert, "event_id">[];
  guests?: Omit<GuestInsert, "event_id">[];
}): Promise<SeededEvent> {
  const owner = await seedClientUser(input.label);
  const eventId = await seedEvent(owner.userId, input.event);
  await seedLocations(eventId, input.locations ?? []);
  const guests = await seedGuests(eventId, input.guests ?? []);
  const token = await seedRsvpToken(eventId);
  return { owner, eventId, token, guests };
}

/** Delete a seeded user — cascades to all owned event data. Never throws. */
export async function deleteUser(userId: string): Promise<void> {
  const { error } = await admin().auth.admin.deleteUser(userId);
  if (error) {
    // Cleanup is best-effort; the sweep in global-teardown is the safety net.
    console.warn(`[seed] deleteUser(${userId}) failed: ${error.message}`);
  }
}

/**
 * Safety-net teardown: delete EVERY user in the `e2e+` namespace, including
 * stragglers from a crashed run. Paginates through the admin user list.
 */
export async function sweepE2EUsers(): Promise<number> {
  let deleted = 0;
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await admin().auth.admin.listUsers({ page, perPage });
    if (error) {
      console.warn(`[seed] sweep listUsers failed: ${error.message}`);
      break;
    }
    const users = data.users;
    if (users.length === 0) break;

    for (const u of users) {
      if (isE2EEmail(u.email)) {
        await deleteUser(u.id);
        deleted++;
      }
    }

    if (users.length < perPage) break;
    page++;
  }
  return deleted;
}
