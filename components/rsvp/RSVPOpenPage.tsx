"use client";

/**
 * components/rsvp/RSVPOpenPage.tsx
 * Open RSVP flow — client component for the public RSVP experience.
 *
 * AUTH-07: No authentication — public page accessed via RSVP link.
 * RSVP-04: Guest can search their name (full name or nickname — D-05) and respond.
 * RSVP-05: +1 attending + +1 name captured when guest has_plus_one.
 * RSVP-06: Meal preference field shown when event.meal_preference_enabled.
 *
 * Interaction Contract (UI-SPEC §Interaction Contracts: RSVP Name Search):
 *   - Minimum 2 characters before querying
 *   - 300ms debounce
 *   - Results: "Full Name (Nickname)" format when nickname exists (D-05 disambiguation)
 *   - Maximum 5 results (server enforced, client renders up to 5)
 *
 * UI-SPEC §RSVP Public Page — Open State copy (all locked strings):
 *   - "You're Invited!" heading
 *   - "Find your name" search label
 *   - "Type your name or nickname..." placeholder
 *   - "Search by your full name or the nickname the couple uses for you." hint
 *   - "Name not found. Try a nickname, or ask the couple to add you to the guest list." not-found
 *   - "Going" / "Not Going" response buttons
 *   - "+1 section heading: "Will your +1 be joining?"
 *   - "+1 going: "Yes, they're coming" / "+1 not going: "No, just me"
 *   - "+1 name field label: "+1 Name"
 *   - "Meal Preference" label
 *   - "Confirm RSVP" CTA
 *   - Success: "You're confirmed! See you on the big day." (going) / "Response recorded. Thank you for letting us know." (not going)
 *   - Already responded: "Your response has been recorded. You can update it until the RSVP deadline."
 *
 * Layout: max-w-480px (set in parent page), 44px minimum touch targets (WCAG 2.5.5)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { RsvpEventData } from "@/app/rsvp/[token]/page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GuestSearchResult {
  id: string;
  full_name: string;
  nickname: string | null;
  has_plus_one: boolean;
}

type RsvpStatus = "attending" | "not_attending";
type PlusOneChoice = "yes" | "no" | null;
type SubmitState = "idle" | "submitting" | "success" | "already_responded";

interface RSVPOpenPageProps {
  event: RsvpEventData;
  token: string;
}

// ─── RSVPOpenPage ─────────────────────────────────────────────────────────────

export function RSVPOpenPage({ event, token }: RSVPOpenPageProps) {
  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GuestSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);

  // Guest selection + RSVP state
  const [selectedGuest, setSelectedGuest] = useState<GuestSearchResult | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus | null>(null);
  const [plusOneChoice, setPlusOneChoice] = useState<PlusOneChoice>(null);
  const [plusOneName, setPlusOneName] = useState("");
  const [mealPreference, setMealPreference] = useState("");

  // Submission state
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search ─────────────────────────────────────────────────────────────────

  const runSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSearchResults([]);
        setNoResults(false);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/rsvp/${token}/search?q=${encodeURIComponent(q)}`
        );
        const data = await res.json();
        const results: GuestSearchResult[] = data.guests ?? [];
        setSearchResults(results);
        setNoResults(results.length === 0);
      } catch {
        setSearchResults([]);
        setNoResults(false);
      } finally {
        setIsSearching(false);
      }
    },
    [token]
  );

  // Debounced search — 300ms per UI-SPEC
  useEffect(() => {
    if (selectedGuest) return; // Don't search again once a guest is selected

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setSearchResults([]);
      setNoResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => runSearch(query), 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedGuest, runSearch]);

  // ── Guest selection ────────────────────────────────────────────────────────

  function handleSelectGuest(guest: GuestSearchResult) {
    setSelectedGuest(guest);
    setQuery(guest.full_name); // Fill the search field with their name
    setSearchResults([]); // Hide results
    setNoResults(false);
    setRsvpStatus(null);
    setPlusOneChoice(null);
    setPlusOneName("");
    setMealPreference("");
    setSubmitState("idle");
    setSubmitError(null);
  }

  function handleClearGuest() {
    setSelectedGuest(null);
    setQuery("");
    setSearchResults([]);
    setNoResults(false);
    setRsvpStatus(null);
    setPlusOneChoice(null);
    setPlusOneName("");
    setMealPreference("");
    setSubmitState("idle");
    setSubmitError(null);
  }

  // ── RSVP submission ────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!selectedGuest || !rsvpStatus) return;

    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const body: Record<string, unknown> = {
        guest_id: selectedGuest.id,
        status: rsvpStatus,
      };

      // RSVP-05: +1 data
      if (selectedGuest.has_plus_one) {
        body.plus_one_attending = plusOneChoice === "yes";
        body.plus_one_name =
          plusOneChoice === "yes" ? plusOneName || null : null;
      }

      // RSVP-06: meal preference (server will ignore if not enabled)
      if (event.meal_preference_enabled && mealPreference) {
        body.meal_preference = mealPreference;
      }

      const res = await fetch(`/api/rsvp/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "RSVP has closed") {
          setSubmitError("The RSVP deadline has passed. Please contact the couple directly.");
          setSubmitState("idle");
        } else {
          setSubmitError(data.error ?? "Something went wrong. Please try again.");
          setSubmitState("idle");
        }
        return;
      }

      // Success
      setSubmitState("success");
    } catch {
      setSubmitError("Connection error. Check your internet and try again.");
      setSubmitState("idle");
    }
  }

  // ── Already responded / success view ──────────────────────────────────────

  if (submitState === "success" && selectedGuest && rsvpStatus) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-semibold text-foreground">
          {/* UI-SPEC: page heading */}
          You&apos;re Invited!
        </h1>
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="text-4xl">
            {rsvpStatus === "attending" ? "🎉" : "💌"}
          </div>
          <p className="text-xl font-semibold text-foreground">
            {rsvpStatus === "attending"
              ? /* UI-SPEC: success going */ "You're confirmed! See you on the big day."
              : /* UI-SPEC: success not going */ "Response recorded. Thank you for letting us know."}
          </p>
          {/* UI-SPEC: already responded copy — shown for updates */}
          <p className="text-base font-normal text-muted-foreground">
            Your response has been recorded. You can update it until the RSVP deadline.
          </p>
          <Button
            variant="outline"
            onClick={handleClearGuest}
            className="mt-2"
          >
            Search for another guest
          </Button>
        </div>
      </div>
    );
  }

  // ── Main RSVP flow ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* UI-SPEC: page heading "You're Invited!" */}
      <h1 className="text-3xl font-semibold text-foreground text-center">
        You&apos;re Invited!
      </h1>

      {event.title && (
        <p className="text-base font-normal text-muted-foreground text-center">
          {event.title}
        </p>
      )}

      {/* ── Name search section ─────────────────────────────────────────── */}
      <div className="space-y-2">
        {/* UI-SPEC: "Find your name" label */}
        <Label htmlFor="rsvp-search" className="text-sm font-semibold">
          Find your name
        </Label>
        <div className="relative">
          <Input
            id="rsvp-search"
            type="text"
            value={query}
            onChange={(e) => {
              if (selectedGuest) handleClearGuest();
              setQuery(e.target.value);
            }}
            /* UI-SPEC: "Type your name or nickname..." placeholder */
            placeholder="Type your name or nickname..."
            className="h-11" // 44px touch target per UI-SPEC
            autoComplete="off"
          />
        </div>

        {/* UI-SPEC: "Search by your full name or the nickname the couple uses for you." hint */}
        {!selectedGuest && (
          <p className="text-sm font-normal text-muted-foreground">
            Search by your full name or the nickname the couple uses for you.
          </p>
        )}

        {/* Search results list */}
        {searchResults.length > 0 && !selectedGuest && (
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            {searchResults.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onClick={() => handleSelectGuest(guest)}
                className="w-full text-left px-4 py-3 min-h-[44px] text-base font-normal hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-muted/50"
              >
                {/* D-05: "Full Name (Nickname)" when nickname exists */}
                {guest.full_name}
                {guest.nickname && (
                  <span className="text-muted-foreground ml-1">
                    ({guest.nickname})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Searching indicator */}
        {isSearching && (
          <p className="text-sm font-normal text-muted-foreground">
            Searching...
          </p>
        )}

        {/* UI-SPEC: not found message */}
        {noResults && query.length >= 2 && !selectedGuest && !isSearching && (
          <p className="text-sm font-normal text-muted-foreground">
            Name not found. Try a nickname, or ask the couple to add you to the guest list.
          </p>
        )}
      </div>

      {/* ── RSVP form — revealed after guest selection ───────────────────── */}
      {selectedGuest && (
        <div className="space-y-6">
          {/* Guest identified */}
          <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                Found you!
              </p>
              <p className="text-base font-normal text-foreground">
                {selectedGuest.full_name}
                {selectedGuest.nickname && (
                  <span className="text-muted-foreground ml-1">
                    ({selectedGuest.nickname})
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearGuest}
              className="text-muted-foreground text-sm font-normal shrink-0"
            >
              Not you?
            </Button>
          </div>

          {/* Going / Not Going — 44px touch targets per UI-SPEC */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Will you be attending?</p>
            <div className="flex gap-3">
              {/* UI-SPEC: "Going" button */}
              <Button
                type="button"
                onClick={() => setRsvpStatus("attending")}
                className={`flex-1 min-h-[44px] font-semibold transition-all ${
                  rsvpStatus === "attending"
                    ? "bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
                variant="outline"
              >
                Going
              </Button>
              {/* UI-SPEC: "Not Going" button */}
              <Button
                type="button"
                onClick={() => setRsvpStatus("not_attending")}
                className={`flex-1 min-h-[44px] font-semibold transition-all ${
                  rsvpStatus === "not_attending"
                    ? "bg-destructive hover:bg-destructive/90 text-white border-destructive"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
                variant="outline"
              >
                Not Going
              </Button>
            </div>
          </div>

          {/* +1 section — RSVP-05: shown when guest has_plus_one */}
          {selectedGuest.has_plus_one && rsvpStatus === "attending" && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              {/* UI-SPEC: "+1 section heading: "Will your +1 be joining?"" */}
              <p className="text-base font-semibold text-foreground">
                Will your +1 be joining?
              </p>
              <div className="flex gap-3">
                {/* UI-SPEC: "+1 going: "Yes, they're coming"" */}
                <Button
                  type="button"
                  onClick={() => setPlusOneChoice("yes")}
                  className={`flex-1 min-h-[44px] font-semibold transition-all ${
                    plusOneChoice === "yes"
                      ? "bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white"
                      : "bg-background border border-border text-foreground hover:bg-muted"
                  }`}
                  variant="outline"
                >
                  Yes, they&apos;re coming
                </Button>
                {/* UI-SPEC: "+1 not going: "No, just me"" */}
                <Button
                  type="button"
                  onClick={() => setPlusOneChoice("no")}
                  className={`flex-1 min-h-[44px] font-semibold transition-all ${
                    plusOneChoice === "no"
                      ? "bg-card border-2 border-[#BE3C5E] text-foreground"
                      : "bg-background border border-border text-foreground hover:bg-muted"
                  }`}
                  variant="outline"
                >
                  No, just me
                </Button>
              </div>

              {/* +1 name field — shown when yes */}
              {plusOneChoice === "yes" && (
                <div className="space-y-1">
                  {/* UI-SPEC: "+1 Name" label */}
                  <Label htmlFor="plus-one-name" className="text-sm font-semibold">
                    +1 Name
                  </Label>
                  <Input
                    id="plus-one-name"
                    type="text"
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    placeholder="e.g., Juan Santos"
                    className="h-11"
                  />
                </div>
              )}
            </div>
          )}

          {/* Meal preference — RSVP-06: only shown when enabled */}
          {event.meal_preference_enabled &&
            rsvpStatus === "attending" && (
              <div className="space-y-1">
                {/* UI-SPEC: "Meal Preference" label */}
                <Label
                  htmlFor="meal-preference"
                  className="text-sm font-semibold"
                >
                  Meal Preference
                </Label>
                <Input
                  id="meal-preference"
                  type="text"
                  value={mealPreference}
                  onChange={(e) => setMealPreference(e.target.value)}
                  placeholder="e.g., Beef, Chicken, Vegetarian"
                  className="h-11"
                />
              </div>
            )}

          {/* Error display */}
          {submitError && (
            <p className="text-sm font-normal text-destructive">{submitError}</p>
          )}

          {/* UI-SPEC: "Confirm RSVP" CTA */}
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              !rsvpStatus ||
              submitState === "submitting" ||
              (selectedGuest.has_plus_one &&
                rsvpStatus === "attending" &&
                !plusOneChoice)
            }
            className="w-full min-h-[44px] bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white font-semibold"
          >
            {submitState === "submitting" ? "Confirming..." : "Confirm RSVP"}
          </Button>
        </div>
      )}
    </div>
  );
}
