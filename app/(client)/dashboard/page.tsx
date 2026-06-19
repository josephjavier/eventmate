import { assertRole } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { CountdownWidget } from "@/components/dashboard/CountdownWidget"
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState"
import { SummaryWidgets } from "@/components/dashboard/SummaryWidgets"

/**
 * Dashboard page (Server Component).
 * - assertRole('client') provides auth + role guard.
 * - Fetches event server-side and passes eventDate to CountdownWidget (Client Component).
 * - No event → DashboardEmptyState (D-01/D-03): "Create Your Event" CTA.
 * - With event → Countdown + SummaryWidgets (EVENT-04).
 */
export default async function DashboardPage() {
  const { user } = await assertRole("client")
  const supabase = await createClient()

  // Fetch the client's event (one per client in v1 — events.client_id has unique FK)
  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, event_time, total_budget")
    .eq("client_id", user.id)
    .maybeSingle()

  // D-03: No event — show empty state with "Create Your Event" CTA
  if (!event) {
    return <DashboardEmptyState />
  }

  // Fetch aggregates for summary widgets (EVENT-04)
  // These all legitimately return 0 until feature slices add data

  // Checklist stats
  const { data: checklistItems } = await supabase
    .from("checklist_items")
    .select("status")
    .eq("event_id", event.id)

  const checklistTotal = checklistItems?.length ?? 0
  const checklistDone = checklistItems?.filter((i) => i.status === "done").length ?? 0

  // Budget stats — sum from expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("total_amount, deposit_paid")
    .eq("event_id", event.id)

  const committed = expenses?.reduce((sum, e) => sum + (e.total_amount ?? 0), 0) ?? 0
  const paid = expenses?.reduce((sum, e) => sum + (e.deposit_paid ?? 0), 0) ?? 0
  const totalBudget = event.total_budget ?? null
  const remaining = totalBudget != null ? totalBudget - committed : 0

  // RSVP stats
  const { data: guests } = await supabase
    .from("guests")
    .select("id, rsvp_responses(status)")
    .eq("event_id", event.id)

  const invited = guests?.length ?? 0
  let going = 0
  let not_going = 0
  let pending = 0

  guests?.forEach((g) => {
    const responses = g.rsvp_responses as Array<{ status: string }> | null
    const response = Array.isArray(responses) ? responses[0] : null
    if (!response) {
      pending++
    } else if (response.status === "attending") {
      going++
    } else {
      not_going++
    }
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          {event.title ?? "Our Wedding"}
        </h1>
        {event.event_date && (
          <p className="text-base font-normal text-muted-foreground mt-1">
            {new Date(event.event_date).toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Countdown — Client Component, pass eventDate as string prop (Pitfall 6) */}
      {event.event_date && <CountdownWidget eventDate={event.event_date} />}

      {/* Summary widgets (EVENT-04) */}
      <SummaryWidgets
        checklist={{ total: checklistTotal, done: checklistDone }}
        budget={{ total: totalBudget, committed, paid, remaining }}
        rsvp={{ invited, going, not_going, pending }}
      />
    </div>
  )
}
