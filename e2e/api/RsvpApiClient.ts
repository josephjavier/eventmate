/**
 * e2e/api/RsvpApiClient.ts
 * Typed wrapper over Playwright's APIRequestContext for the public RSVP
 * Route Handlers. API specs assert on the returned APIResponse directly
 * (status + body), so this stays a thin, intent-revealing transport layer.
 *
 * Endpoints:
 *   GET  /api/rsvp/:token/search?q=   → { guests: GuestSearchResult[] }
 *   POST /api/rsvp/:token/respond      → { ok: true } | { error }
 */

import type { APIRequestContext, APIResponse } from "@playwright/test";

export interface GuestSearchResult {
  id: string;
  full_name: string;
  nickname: string | null;
  has_plus_one: boolean;
}

export interface RespondBody {
  guest_id?: string;
  status?: string;
  plus_one_attending?: boolean;
  plus_one_name?: string | null;
  meal_preference?: string;
}

export class RsvpApiClient {
  constructor(private readonly request: APIRequestContext) {}

  /** Guest name/nickname search. baseURL is applied by the Playwright project. */
  search(token: string, q: string): Promise<APIResponse> {
    return this.request.get(`/api/rsvp/${token}/search`, { params: { q } });
  }

  /** Submit an RSVP response. */
  respond(token: string, body: RespondBody): Promise<APIResponse> {
    return this.request.post(`/api/rsvp/${token}/respond`, { data: body });
  }
}
