"use client";

/**
 * app/(client)/event/budget/SetBudgetTrigger.tsx
 *
 * Client component that holds the "Set Budget" dialog state.
 * Needed because the parent budget page.tsx is a Server Component.
 *
 * Opens a dialog with a CurrencyInput to set events.total_budget.
 * Calls setBudget Server Action on submit.
 *
 * UI-SPEC: CTA "Set Budget" (empty state) / "Edit Budget" (with budget)
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
import { setBudget } from "@/app/actions/budget";
import { centavosToPhp } from "@/lib/utils";
import { toast } from "sonner";

interface SetBudgetTriggerProps {
  eventId: string;
  /** Current total_budget in centavos (undefined = no budget set yet) */
  currentBudgetCentavos?: number;
}

export function SetBudgetTrigger({
  eventId,
  currentBudgetCentavos,
}: SetBudgetTriggerProps) {
  const [open, setOpen] = useState(false);
  const [phpAmount, setPhpAmount] = useState<number>(
    currentBudgetCentavos ? centavosToPhp(currentBudgetCentavos) : 0
  );
  const [isPending, startTransition] = useTransition();

  const hasExistingBudget = currentBudgetCentavos !== undefined && currentBudgetCentavos > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await setBudget(eventId, phpAmount);
      if (result?.error) {
        toast.error(result.error, { duration: 6000 });
        return;
      }
      toast.success("Budget updated", { duration: 4000 });
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        variant={hasExistingBudget ? "outline" : "default"}
        className={
          hasExistingBudget
            ? ""
            : "bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white"
        }
        onClick={() => setOpen(true)}
      >
        {hasExistingBudget ? "Edit Budget" : "Set Budget"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {hasExistingBudget ? "Edit Total Budget" : "Set Total Budget"}
            </DialogTitle>
            <DialogDescription>
              Enter your total wedding budget in Philippine Peso.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <CurrencyInput
              id="total-budget"
              label="Total wedding budget (₱)"
              value={phpAmount}
              onChange={setPhpAmount}
              required
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
    </>
  );
}
