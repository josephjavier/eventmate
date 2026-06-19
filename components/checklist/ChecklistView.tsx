"use client"

/**
 * components/checklist/ChecklistView.tsx
 * Grouped checklist view — categories as collapsible groups.
 *
 * UI-SPEC §Checklist Page layout contract:
 *   - Categories as collapsible section groups
 *   - Each category shows: name, item count, completion badge
 *   - Each item row: checkbox or status badge + item name + inline action menu
 *   - "Add Item" button below each category group
 *
 * Accent (#BE3C5E) used for progress bar fill and "Done/Booked" badge backgrounds.
 */

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChecklistItemRow } from "./ChecklistItemRow"
import { AddItemDialog } from "./AddItemDialog"
import { cn } from "@/lib/utils"

interface ChecklistItem {
  id: string
  title: string
  item_type: "supplier_task" | "personal_task"
  status: string
  category: string | null
  sort_order: number
  offline_supplier_name: string | null
  offline_supplier_category: string | null
}

interface ChecklistViewProps {
  items: ChecklistItem[]
  eventId: string
}

// Group items by category, preserving the order of first appearance
function groupByCategory(items: ChecklistItem[]): Map<string, ChecklistItem[]> {
  const map = new Map<string, ChecklistItem[]>()
  for (const item of items) {
    const cat = item.category ?? "Uncategorized"
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(item)
  }
  return map
}

// Determine if a status counts as "done" for progress calculation
function isDone(item: ChecklistItem): boolean {
  return item.status === "done" || item.status === "booked"
}

export function ChecklistView({ items, eventId }: ChecklistViewProps) {
  const grouped = groupByCategory(items)
  const [addDialogCategory, setAddDialogCategory] = useState<string | null>(null)

  // Overall progress
  const totalItems = items.length
  const doneItems = items.filter(isDone).length
  const overallPercent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Overall progress bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Overall Progress
          </span>
          <span className="text-sm font-semibold text-[#BE3C5E]">
            {doneItems} / {totalItems} done
          </span>
        </div>
        <Progress
          value={overallPercent}
          className="h-2 [&>[role=progressbar]]:bg-[#BE3C5E]"
        />
      </div>

      {/* Category groups */}
      {Array.from(grouped.entries()).map(([category, categoryItems]) => {
        const catTotal = categoryItems.length
        const catDone = categoryItems.filter(isDone).length
        const catPercent = catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 0

        return (
          <CategoryGroup
            key={category}
            category={category}
            items={categoryItems}
            catDone={catDone}
            catTotal={catTotal}
            catPercent={catPercent}
            eventId={eventId}
            onAddItem={() => setAddDialogCategory(category)}
          />
        )
      })}

      {/* Add Item Dialog */}
      <AddItemDialog
        open={addDialogCategory !== null}
        onOpenChange={(open) => {
          if (!open) setAddDialogCategory(null)
        }}
        eventId={eventId}
        defaultCategory={addDialogCategory ?? undefined}
      />
    </div>
  )
}

// ─── CategoryGroup ────────────────────────────────────────────────────────────

interface CategoryGroupProps {
  category: string
  items: ChecklistItem[]
  catDone: number
  catTotal: number
  catPercent: number
  eventId: string
  onAddItem: () => void
}

function CategoryGroup({
  category,
  items,
  catDone,
  catTotal,
  catPercent,
  eventId,
  onAddItem,
}: CategoryGroupProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Category header */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${category} category`}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="flex-1 text-base font-semibold text-foreground">
              {category}
            </span>
            {/* Completion badge */}
            <Badge
              variant={catPercent === 100 ? "default" : "outline"}
              className={cn(
                catPercent === 100 &&
                  "bg-[#BE3C5E] text-white border-transparent hover:bg-[#BE3C5E]"
              )}
            >
              {catDone}/{catTotal}
            </Badge>
          </button>
        </CollapsibleTrigger>

        {/* Category items */}
        <CollapsibleContent>
          {/* Thin progress bar */}
          <div className="h-0.5 bg-muted mx-4">
            <div
              className="h-full bg-[#BE3C5E] transition-all"
              style={{ width: `${catPercent}%` }}
            />
          </div>

          <div className="py-1">
            {items.map((item) => (
              <ChecklistItemRow
                key={item.id}
                id={item.id}
                title={item.title}
                item_type={item.item_type as "supplier_task" | "personal_task"}
                status={item.status}
                offline_supplier_name={item.offline_supplier_name}
                offline_supplier_category={item.offline_supplier_category}
              />
            ))}
          </div>

          {/* Add Item trigger for this category */}
          <div className="px-4 pb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1.5"
              onClick={onAddItem}
              aria-label={`Add item to ${category}`}
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
