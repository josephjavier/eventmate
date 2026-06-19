"use client";

/**
 * app/(client)/event/budget/AddExpenseTrigger.tsx
 *
 * Client component that holds the "Add Expense" dialog state.
 * Needed because the parent budget page.tsx is a Server Component.
 *
 * UI-SPEC: CTA "Add Expense" (add new expense entry)
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExpenseDialog } from "@/components/budget/ExpenseDialog";
import { Plus } from "lucide-react";

interface AddExpenseTriggerProps {
  eventId: string;
}

export function AddExpenseTrigger({ eventId }: AddExpenseTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Expense
      </Button>

      <ExpenseDialog open={open} onOpenChange={setOpen} eventId={eventId} />
    </>
  );
}
