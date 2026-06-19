/**
 * app/(client)/event/checklist/page.tsx
 * Checklist page — Server Component.
 *
 * AUTH: assertRole('client') — redirects to /login if unauthenticated or wrong role.
 * DUAL AUTH LAYER: assertRole() calls verifySession() internally per CLAUDE.md §5.
 *
 * D-13: Empty checklist shows "Start from the Philippine wedding template" button.
 *       Template does NOT auto-load.
 * D-14: Couple can delete any category or item freely.
 * CHECK-01–07, DISC-07.
 *
 * UI-SPEC §Checklist Page:
 *   - Page title: "Checklist"
 *   - Empty heading: "Your checklist is empty"
 *   - Empty body: "Load the Philippine wedding template to get started, or add your own items."
 *   - Template CTA (D-13 exact label): "Start from the Philippine wedding template"
 *   - Add Item CTA: "Add Item"
 */

import { assertRole } from "@/lib/dal"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ChecklistView } from "@/components/checklist/ChecklistView"
import { AddItemTrigger } from "@/components/checklist/AddItemTrigger"
import { loadTemplate } from "@/app/actions/checklist"

export default async function ChecklistPage() {
  // Auth + role guard (CLAUDE.md §Architecture Decisions #5)
  const { user } = await assertRole("client")
  const supabase = await createClient()

  // Fetch the client's event
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("client_id", user.id)
    .maybeSingle()

  if (!event) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-foreground">Checklist</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <p className="text-xl font-semibold text-foreground">No event created yet</p>
          <p className="text-base font-normal text-muted-foreground">
            Create your wedding event to start building your checklist.
          </p>
          <a href="/onboarding">
            <Button className="bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white">
              Create Your Event
            </Button>
          </a>
        </div>
      </div>
    )
  }

  // Fetch checklist items sorted by sort_order
  const { data: items } = await supabase
    .from("checklist_items")
    .select(
      "id, title, item_type, status, category, sort_order, offline_supplier_name, offline_supplier_category"
    )
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true })

  const hasItems = items && items.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        {/* UI-SPEC: page title "Checklist" */}
        <h1 className="text-3xl font-semibold text-foreground">Checklist</h1>
        {hasItems && <AddItemTrigger eventId={event.id} />}
      </div>

      {!hasItems ? (
        // ─── Empty state (D-13) ──────────────────────────────────────────────
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          {/* UI-SPEC §Checklist Page: locked empty state copy */}
          <p className="text-xl font-semibold text-foreground">
            Your checklist is empty
          </p>
          <p className="text-base font-normal text-muted-foreground">
            Load the Philippine wedding template to get started, or add your own items.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* D-13 exact label: "Start from the Philippine wedding template" */}
            <LoadTemplateButton eventId={event.id} />
            <AddItemTrigger eventId={event.id} />
          </div>
        </div>
      ) : (
        // ─── Checklist view ──────────────────────────────────────────────────
        <ChecklistView
          items={
            (items ?? []).map((i) => ({
              id: i.id,
              title: i.title,
              item_type: i.item_type as "supplier_task" | "personal_task",
              status: i.status,
              category: i.category,
              sort_order: i.sort_order,
              offline_supplier_name: i.offline_supplier_name,
              offline_supplier_category: i.offline_supplier_category,
            }))
          }
          eventId={event.id}
        />
      )}
    </div>
  )
}

// ─── LoadTemplateButton ───────────────────────────────────────────────────────

/**
 * LoadTemplateButton — form that calls loadTemplate Server Action.
 * D-13: Visible only when checklist is empty.
 * Uses a form action (Server Action) so it works without JS for progressive enhancement.
 */
function LoadTemplateButton({ eventId }: { eventId: string }) {
  async function handleLoadTemplate() {
    "use server"
    await loadTemplate(eventId)
  }

  return (
    <form action={handleLoadTemplate}>
      {/* D-13 exact label (UI-SPEC, locked) */}
      <Button
        type="submit"
        className="bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white"
      >
        Start from the Philippine wedding template
      </Button>
    </form>
  )
}
