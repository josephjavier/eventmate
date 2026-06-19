"use client";

/**
 * components/guests/RsvpDeadlineField.tsx
 * 'use client' component for setting the RSVP deadline.
 *
 * D-06: Client sets a deadline date after which the RSVP page locks.
 * UI-SPEC §Guests Page: "RSVP deadline" label.
 *
 * Shows an <input type="date"> with the current deadline pre-filled.
 * On change, calls setRsvpDeadline Server Action.
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setRsvpDeadline } from "@/app/actions/guests";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RsvpDeadlineFieldProps {
  eventId: string;
  currentDeadline: string | null;
}

export function RsvpDeadlineField({
  eventId,
  currentDeadline,
}: RsvpDeadlineFieldProps) {
  const [date, setDate] = useState(currentDeadline ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await setRsvpDeadline(eventId, date || null);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        toast.success("RSVP deadline saved.", { duration: 4000 });
      }
    });
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        {/* UI-SPEC: "RSVP deadline" label */}
        <Label htmlFor="rsvp-deadline" className="text-sm font-semibold">
          RSVP deadline
        </Label>
        <Input
          id="rsvp-deadline"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-48"
          disabled={isPending}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSave}
        disabled={isPending}
        className="font-semibold mb-0.5"
      >
        {isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
