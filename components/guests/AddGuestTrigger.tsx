"use client";

/**
 * components/guests/AddGuestTrigger.tsx
 * Thin 'use client' wrapper that holds the AddGuestDialog open/close state
 * while the parent page.tsx remains a Server Component.
 *
 * Pattern from Plan 01-05: AddItemTrigger separates dialog state from SC layout.
 * RSVP-01: "Add Guest" CTA on the guests page.
 */

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddGuestDialog } from "@/components/guests/AddGuestDialog";

interface AddGuestTriggerProps {
  eventId: string;
}

export function AddGuestTrigger({ eventId }: AddGuestTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* UI-SPEC: "Add Guest" CTA */}
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white font-semibold"
      >
        <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
        Add Guest
      </Button>

      <AddGuestDialog
        eventId={eventId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
