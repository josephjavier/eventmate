"use client"

/**
 * components/checklist/ChecklistItemRow.tsx
 * Renders a single checklist item row.
 *
 * - personal_task: Checkbox toggling pending ↔ done
 * - supplier_task: Badge cycling pending → inquired → booked + action menu
 *
 * Status badge variants (UI-SPEC §Checklist Status Flow, locked):
 *   Pending  → variant="outline"
 *   Inquired → variant="secondary"
 *   Booked   → Accent fill (#BE3C5E bg, white text)
 *   Done     → Accent fill (#BE3C5E bg, white text)
 *
 * Accessibility (UI-SPEC §Accessibility — Icon-Only Buttons):
 *   All icon-only buttons must have aria-label.
 */

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2, Store } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { updateStatus, renameItem, deleteItem } from "@/app/actions/checklist"
import { OfflineSupplierDialog } from "./OfflineSupplierDialog"
import { cn } from "@/lib/utils"

interface ChecklistItemRowProps {
  id: string
  title: string
  item_type: "supplier_task" | "personal_task"
  status: string
  offline_supplier_name: string | null
  offline_supplier_category: string | null
}

// ─── Status badge helpers ─────────────────────────────────────────────────────

function SupplierStatusBadge({ status }: { status: string }) {
  if (status === "booked") {
    return (
      <Badge
        className="bg-[#BE3C5E] text-white border-transparent hover:bg-[#BE3C5E]"
      >
        Booked
      </Badge>
    )
  }
  if (status === "inquired") {
    return <Badge variant="secondary">Inquired</Badge>
  }
  // pending
  return <Badge variant="outline">Pending</Badge>
}

function PersonalStatusBadge({ status }: { status: string }) {
  if (status === "done") {
    return (
      <Badge
        className="bg-[#BE3C5E] text-white border-transparent hover:bg-[#BE3C5E]"
      >
        Done
      </Badge>
    )
  }
  return <Badge variant="outline">Pending</Badge>
}

// ─── Next status in supplier cycle ───────────────────────────────────────────

function nextSupplierStatus(current: string): string {
  const cycle: Record<string, string> = {
    pending: "inquired",
    inquired: "booked",
    booked: "pending",
  }
  return cycle[current] ?? "pending"
}

// ─── ChecklistItemRow ─────────────────────────────────────────────────────────

export function ChecklistItemRow({
  id,
  title,
  item_type,
  status,
  offline_supplier_name,
  offline_supplier_category,
}: ChecklistItemRowProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [currentTitle, setCurrentTitle] = useState(title)
  const [isPending, setIsPending] = useState(false)

  // Dialog state
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(title)

  // ─── Personal task: checkbox toggle pending ↔ done ───────────────────────

  async function handleCheckboxChange(checked: boolean) {
    if (isPending) return
    setIsPending(true)
    const newStatus = checked ? "done" : "pending"
    const result = await updateStatus(id, newStatus)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setCurrentStatus(newStatus)
    }
    setIsPending(false)
  }

  // ─── Supplier task: badge click cycles status ─────────────────────────────

  async function handleBadgeClick() {
    if (isPending) return
    setIsPending(true)
    const newStatus = nextSupplierStatus(currentStatus)
    const result = await updateStatus(id, newStatus)
    if (result?.error) {
      toast.error(result.error)
    } else {
      setCurrentStatus(newStatus)
    }
    setIsPending(false)
  }

  // ─── Rename ───────────────────────────────────────────────────────────────

  async function handleRename() {
    if (!renameValue.trim()) return
    const result = await renameItem(id, renameValue.trim())
    if (result?.error) {
      toast.error(result.error)
    } else {
      setCurrentTitle(renameValue.trim())
      setRenameOpen(false)
      toast.success("Item renamed")
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    const result = await deleteItem(id)
    if (result?.error) {
      toast.error(result.error)
      setDeleteOpen(false)
    } else {
      setDeleteOpen(false)
      toast.success("Item deleted")
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 rounded-md group">
        {/* Status control */}
        {item_type === "personal_task" ? (
          <Checkbox
            id={`item-${id}`}
            checked={currentStatus === "done"}
            onCheckedChange={handleCheckboxChange}
            disabled={isPending}
            aria-label={`Mark "${currentTitle}" as done`}
            className="shrink-0"
          />
        ) : (
          <button
            type="button"
            onClick={handleBadgeClick}
            disabled={isPending}
            aria-label={`Change status of "${currentTitle}" — currently ${currentStatus}`}
            className="shrink-0 cursor-pointer"
          >
            <SupplierStatusBadge status={currentStatus} />
          </button>
        )}

        {/* Title */}
        <span
          className={cn(
            "flex-1 text-base font-normal text-foreground",
            (currentStatus === "done" || currentStatus === "booked") &&
              "line-through text-muted-foreground"
          )}
        >
          {currentTitle}
        </span>

        {/* Offline supplier indicator */}
        {offline_supplier_name && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            {offline_supplier_name}
          </span>
        )}

        {/* Action menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
              aria-label={`Actions for "${currentTitle}"`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setRenameValue(currentTitle)
                setRenameOpen(true)
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            {item_type === "supplier_task" && (
              <DropdownMenuItem onClick={() => setSupplierOpen(true)}>
                <Store className="h-4 w-4 mr-2" />
                {offline_supplier_name ? "Edit Supplier" : "Add Supplier"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            {/* UI-SPEC: "Rename Item" */}
            <DialogTitle>Rename Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-input">Item name</Label>
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      {/* UI-SPEC: heading "Delete this item?", body "This will permanently remove the item and any attached supplier details.", confirm "Delete Item", cancel "Keep Item" */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              This will permanently remove the item and any attached supplier details.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Keep Item
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offline Supplier Dialog */}
      {item_type === "supplier_task" && (
        <OfflineSupplierDialog
          open={supplierOpen}
          onOpenChange={setSupplierOpen}
          itemId={id}
          existingName={offline_supplier_name ?? undefined}
          existingCategory={offline_supplier_category ?? undefined}
        />
      )}
    </>
  )
}
