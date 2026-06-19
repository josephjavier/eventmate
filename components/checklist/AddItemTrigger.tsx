"use client"

/**
 * components/checklist/AddItemTrigger.tsx
 * Client component button that opens the AddItemDialog.
 * Used by the checklist page (Server Component) to trigger the add-item dialog.
 */

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddItemDialog } from "./AddItemDialog"

interface AddItemTriggerProps {
  eventId: string
}

export function AddItemTrigger({ eventId }: AddItemTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5"
        aria-label="Add a custom checklist item"
      >
        <Plus className="h-4 w-4" />
        Add Item
      </Button>

      <AddItemDialog open={open} onOpenChange={setOpen} eventId={eventId} />
    </>
  )
}
