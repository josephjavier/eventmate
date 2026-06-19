"use client";

/**
 * components/budget/CategoryAllocationDialog.tsx
 *
 * Dialog to set or edit a category's allocated_amount.
 * Calls upsertCategory(eventId, category, phpToCentavos(input)) on submit.
 *
 * BUDG-02: allocated_amount stored as INTEGER centavos (phpToCentavos in action)
 * UI-SPEC §Interaction Contracts: CurrencyInput with phpToCentavos on submit
 */

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/budget/CurrencyInput";
import { upsertCategory } from "@/app/actions/budget";
import { centavosToPhp, phpToCentavos } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  category: string;
  /** Current allocated_amount from DB, in centavos */
  allocatedAmountCentavos: number;
}

export function CategoryAllocationDialog({
  open,
  onOpenChange,
  eventId,
  category,
  allocatedAmountCentavos,
}: CategoryAllocationDialogProps) {
  // Convert centavos to PHP for initial display (centavosToPhp)
  const [phpAmount, setPhpAmount] = useState<number>(
    centavosToPhp(allocatedAmountCentavos)
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      // BUDG-02: phpToCentavos conversion happens in upsertCategory Server Action
      // phpAmount is PHP (float); upsertCategory converts to INTEGER centavos
      const result = await upsertCategory(eventId, category, phpAmount);

      if (result?.error) {
        toast.error(result.error, { duration: 6000 });
        return;
      }

      toast.success("Allocation updated", { duration: 4000 });
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {category}
          </DialogTitle>
          <DialogDescription>
            Set the budget allocation for this category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CurrencyInput
            id="allocated-amount"
            label="Allocated amount (₱)"
            value={phpAmount}
            onChange={setPhpAmount}
            required
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
