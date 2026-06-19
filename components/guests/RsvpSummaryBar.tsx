/**
 * components/guests/RsvpSummaryBar.tsx
 * RSVP summary bar showing 4 counts: Invited, Going, Not Going, Pending.
 *
 * RSVP-07: Couple can see a live RSVP summary.
 * UI-SPEC §Guests Page: exact badge labels:
 *   - "Invited" (total guests)
 *   - "Going" (attending)
 *   - "Not Going" (not_attending)
 *   - "Pending" (no response yet)
 */

import { Badge } from "@/components/ui/badge";

interface RsvpSummaryBarProps {
  invited: number;
  going: number;
  notGoing: number;
  pending: number;
}

export function RsvpSummaryBar({
  invited,
  going,
  notGoing,
  pending,
}: RsvpSummaryBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* UI-SPEC: "Invited" = total count */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-xl font-semibold text-foreground">{invited}</span>
        <span className="text-sm font-semibold text-muted-foreground">
          Invited
        </span>
      </div>

      {/* UI-SPEC: "Going" = attending */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-xl font-semibold text-foreground">{going}</span>
        <span className="text-sm font-semibold text-muted-foreground">
          Going
        </span>
      </div>

      {/* UI-SPEC: "Not Going" = not_attending */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-xl font-semibold text-foreground">{notGoing}</span>
        <span className="text-sm font-semibold text-muted-foreground">
          Not Going
        </span>
      </div>

      {/* UI-SPEC: "Pending" = no response */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-xl font-semibold text-foreground">{pending}</span>
        <span className="text-sm font-semibold text-muted-foreground">
          Pending
        </span>
      </div>
    </div>
  );
}
