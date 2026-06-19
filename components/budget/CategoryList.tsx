"use client";

/**
 * components/budget/CategoryList.tsx
 *
 * Per-category allocation rows with:
 * - Category name + allocated ₱ + spent ₱ + thin progress bar
 * - "Edit" button that opens CategoryAllocationDialog for that category (BUDG-02)
 * - Destructive "Over budget by ₱X,XXX" badge when spent > allocated (BUDG-06)
 *
 * All amounts in INTEGER centavos from props.
 * UI-SPEC: accent progress bar when under, destructive when over; Badge "Over budget by ₱X,XXX"
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CategoryAllocationDialog } from "@/components/budget/CategoryAllocationDialog";
import { isOverBudget } from "@/lib/schemas/budget";
import { formatPHP } from "@/lib/utils";
import { Pencil } from "lucide-react";

export interface CategoryRow {
  category: string;
  /** budget_categories.allocated_amount in centavos */
  allocatedAmountCentavos: number;
  /** SUM(expenses.total_amount) for this category in centavos */
  spentCentavos: number;
}

interface CategoryListProps {
  eventId: string;
  categories: CategoryRow[];
}

interface CategoryItemProps extends CategoryRow {
  eventId: string;
}

function CategoryItem({
  eventId,
  category,
  allocatedAmountCentavos,
  spentCentavos,
}: CategoryItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const over = isOverBudget(spentCentavos, allocatedAmountCentavos);

  // Progress bar: spent / allocated as percentage, capped at 100 for display
  const progressPercent =
    allocatedAmountCentavos > 0
      ? Math.min(100, Math.round((spentCentavos / allocatedAmountCentavos) * 100))
      : spentCentavos > 0
      ? 100
      : 0;

  // Over-budget amount
  const overByAmount = over ? spentCentavos - allocatedAmountCentavos : 0;

  return (
    <>
      <div className="flex flex-col gap-2 py-4 border-b border-border last:border-0">
        <div className="flex items-center justify-between gap-4">
          {/* Category name + over-budget badge */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-base font-normal truncate">{category}</span>
            {over && (
              <Badge variant="destructive" className="text-xs shrink-0">
                Over budget by {formatPHP(overByAmount)}
              </Badge>
            )}
          </div>

          {/* Amounts + Edit */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-muted-foreground">
                Allocated
              </div>
              <div className="text-base font-normal">
                {formatPHP(allocatedAmountCentavos)}
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-muted-foreground">
                Spent
              </div>
              <div
                className={
                  over
                    ? "text-base font-normal text-destructive"
                    : "text-base font-normal"
                }
              >
                {formatPHP(spentCentavos)}
              </div>
            </div>
            {/* BUDG-02: Edit button opens CategoryAllocationDialog */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              aria-label={`Edit allocation for ${category}`}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        </div>

        {/* Mobile: show amounts below category name */}
        <div className="flex gap-4 sm:hidden text-sm">
          <span className="text-muted-foreground">
            Allocated: {formatPHP(allocatedAmountCentavos)}
          </span>
          <span className={over ? "text-destructive" : ""}>
            Spent: {formatPHP(spentCentavos)}
          </span>
        </div>

        {/* Thin progress bar — accent when under, destructive when over */}
        <Progress
          value={progressPercent}
          className={
            over
              ? "[&>div]:bg-destructive"
              : "[&>div]:bg-primary"
          }
        />
      </div>

      {/* BUDG-02: CategoryAllocationDialog opens on Edit click */}
      <CategoryAllocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={eventId}
        category={category}
        allocatedAmountCentavos={allocatedAmountCentavos}
      />
    </>
  );
}

export function CategoryList({ eventId, categories }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No categories with expenses yet. Add an expense to see categories here.
      </div>
    );
  }

  return (
    <div>
      {categories.map((cat) => (
        <CategoryItem key={cat.category} eventId={eventId} {...cat} />
      ))}
    </div>
  );
}
