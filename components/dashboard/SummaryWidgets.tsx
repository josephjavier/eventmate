import { formatPHP } from "@/lib/utils"

interface ChecklistStats {
  total: number
  done: number
}

interface BudgetStats {
  total: number | null
  committed: number
  paid: number
  remaining: number
}

interface RsvpStats {
  invited: number
  going: number
  not_going: number
  pending: number
}

interface Props {
  checklist: ChecklistStats
  budget: BudgetStats
  rsvp: RsvpStats
}

/**
 * SummaryWidgets — server-fetched aggregates shown on the dashboard.
 * EVENT-04: Shows checklist %, budget summary, RSVP counts.
 * Values legitimately show 0 until feature slices add data.
 */
export function SummaryWidgets({ checklist, budget, rsvp }: Props) {
  const checklistPercent =
    checklist.total > 0 ? Math.round((checklist.done / checklist.total) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Checklist summary */}
      <div className="rounded-xl bg-card border border-border p-6 flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Checklist
        </p>
        <p className="text-3xl font-semibold text-foreground">{checklistPercent}%</p>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-[#BE3C5E] h-2 rounded-full transition-all"
            style={{ width: `${checklistPercent}%` }}
          />
        </div>
        <p className="text-sm font-normal text-muted-foreground">
          {checklist.done} of {checklist.total} items done
        </p>
      </div>

      {/* Budget summary */}
      <div className="rounded-xl bg-card border border-border p-6 flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Budget
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <p className="text-xs font-normal text-muted-foreground">Total Budget</p>
            <p className="text-base font-semibold text-foreground">
              {budget.total != null ? formatPHP(budget.total) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-normal text-muted-foreground">Committed</p>
            <p className="text-base font-semibold text-foreground">{formatPHP(budget.committed)}</p>
          </div>
          <div>
            <p className="text-xs font-normal text-muted-foreground">Paid</p>
            <p className="text-base font-semibold text-foreground">{formatPHP(budget.paid)}</p>
          </div>
          <div>
            <p className="text-xs font-normal text-muted-foreground">Remaining</p>
            <p className="text-base font-semibold text-foreground">{formatPHP(budget.remaining)}</p>
          </div>
        </div>
      </div>

      {/* RSVP summary */}
      <div className="rounded-xl bg-card border border-border p-6 flex flex-col gap-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          RSVP
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <div>
            <p className="text-xs font-normal text-muted-foreground">Invited</p>
            <p className="text-base font-semibold text-foreground">{rsvp.invited}</p>
          </div>
          <div>
            <p className="text-xs font-normal text-muted-foreground">Going</p>
            <p className="text-base font-semibold text-[#BE3C5E]">{rsvp.going}</p>
          </div>
          <div>
            <p className="text-xs font-normal text-muted-foreground">Not Going</p>
            <p className="text-base font-semibold text-destructive">{rsvp.not_going}</p>
          </div>
          <div>
            <p className="text-xs font-normal text-muted-foreground">Pending</p>
            <p className="text-base font-semibold text-foreground">{rsvp.pending}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
