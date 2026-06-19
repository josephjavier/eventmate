/**
 * components/budget/BudgetSummary.tsx
 *
 * GCash/wallet-inspired 4-stat summary bar (CONTEXT.md §Specific Ideas).
 * Renders: Total Budget / Committed / Paid / Remaining
 *
 * All incoming values are INTEGER centavos from the DB.
 * formatPHP() converts to ₱ display string.
 *
 * UI-SPEC §Budget Page: "4 stat cards in a row (Total Budget / Committed / Paid / Remaining)"
 * UI-SPEC §Copywriting: exact label copy locked (see below)
 * BUDG-05: Remaining = total_budget - SUM(expenses.total_amount)
 */

import { formatPHP } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface BudgetSummaryProps {
  /** events.total_budget in centavos */
  totalBudgetCentavos: number;
  /** SUM(expenses.total_amount) in centavos — all committed expenses */
  committedCentavos: number;
  /** SUM(expenses.deposit_paid) in centavos — what has been paid */
  paidCentavos: number;
}

interface StatCardProps {
  label: string;
  valueCentavos: number;
  /** Use destructive color when value is negative (budget exceeded) */
  variant?: "default" | "destructive";
}

function StatCard({ label, valueCentavos, variant = "default" }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1 p-6">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <span
        className={
          variant === "destructive"
            ? "text-xl font-semibold text-destructive"
            : "text-xl font-semibold text-foreground"
        }
      >
        {formatPHP(Math.abs(valueCentavos))}
        {variant === "destructive" && valueCentavos < 0 && " over"}
      </span>
    </Card>
  );
}

export function BudgetSummary({
  totalBudgetCentavos,
  committedCentavos,
  paidCentavos,
}: BudgetSummaryProps) {
  // BUDG-05: Remaining = total_budget - committed
  const remainingCentavos = totalBudgetCentavos - committedCentavos;
  const isOverBudget = remainingCentavos < 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* UI-SPEC §Copywriting: exact labels locked */}
      <StatCard label="Total Budget" valueCentavos={totalBudgetCentavos} />
      <StatCard label="Committed" valueCentavos={committedCentavos} />
      <StatCard label="Paid" valueCentavos={paidCentavos} />
      <StatCard
        label="Remaining"
        valueCentavos={remainingCentavos}
        variant={isOverBudget ? "destructive" : "default"}
      />
    </div>
  );
}
