"use client";

/**
 * components/guests/GuestTable.tsx
 * Guest list table using @tanstack/react-table.
 *
 * UI-SPEC §Guest List Page:
 *   Columns: Full Name, Nickname, +1, RSVP Status, Response Date, Actions
 *   Sortable by: Full Name, RSVP Status, Response Date
 *
 * RSVP-07: Shows Invited/Going/Not Going/Pending counts via RsvpSummaryBar (in page)
 * RSVP-08: Override action → calls overrideRsvp Server Action
 * D-07: Response Date (responded_at) column displayed
 *
 * UI-SPEC §Guests Page copy for delete confirm:
 *   Heading: "Remove this guest?"
 *   Body: "Their RSVP response will also be deleted."
 *   Confirm: "Remove Guest"
 */

import { useState, useTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { ArrowUpDown, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { deleteGuest, overrideRsvp } from "@/app/actions/guests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditGuestDialog } from "@/components/guests/EditGuestDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestRow {
  id: string;
  full_name: string;
  nickname: string | null;
  has_plus_one: boolean;
  plus_one_name: string | null;
  rsvp_status: "attending" | "not_attending" | "pending";
  responded_at: string | null;
}

interface GuestTableProps {
  guests: GuestRow[];
  eventId: string;
}

// ─── Status badge helper ──────────────────────────────────────────────────────

function RsvpStatusBadge({ status }: { status: GuestRow["rsvp_status"] }) {
  if (status === "attending") {
    return (
      <Badge className="bg-[#BE3C5E] text-white font-semibold hover:bg-[#BE3C5E]/90">
        Going
      </Badge>
    );
  }
  if (status === "not_attending") {
    return (
      <Badge variant="outline" className="font-semibold text-destructive border-destructive">
        Not Going
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-semibold text-muted-foreground">
      Pending
    </Badge>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          {/* UI-SPEC: "Remove this guest?" */}
          <DialogTitle className="text-xl font-semibold">
            Remove this guest?
          </DialogTitle>
        </DialogHeader>
        {/* UI-SPEC: "Their RSVP response will also be deleted." */}
        <p className="text-base font-normal text-muted-foreground">
          Their RSVP response will also be deleted.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          {/* UI-SPEC: "Remove Guest" */}
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Removing..." : "Remove Guest"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── GuestTable ───────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<GuestRow>();

export function GuestTable({ guests }: GuestTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<GuestRow | null>(null);
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [isPendingOverride, startOverrideTransition] = useTransition();

  function handleDelete() {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      const result = await deleteGuest(deleteTarget);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        toast.success("Guest removed.", { duration: 4000 });
        setDeleteTarget(null);
      }
    });
  }

  function handleOverride(
    guestId: string,
    status: "attending" | "not_attending" | "pending"
  ) {
    startOverrideTransition(async () => {
      const result = await overrideRsvp(guestId, status);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        toast.success("RSVP status updated.", { duration: 4000 });
      }
    });
  }

  const columns = [
    // Full Name — sortable
    columnHelper.accessor("full_name", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-sm font-semibold px-0 hover:bg-transparent"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Full Name
          <ArrowUpDown className="ml-1 h-3 w-3" aria-hidden="true" />
        </Button>
      ),
      cell: ({ getValue }) => (
        <span className="text-base font-normal">{getValue()}</span>
      ),
    }),

    // Nickname
    columnHelper.accessor("nickname", {
      header: () => (
        <span className="text-sm font-semibold">Nickname</span>
      ),
      cell: ({ getValue }) => (
        <span className="text-base font-normal text-muted-foreground">
          {getValue() ?? "—"}
        </span>
      ),
      enableSorting: false,
    }),

    // +1
    columnHelper.accessor("has_plus_one", {
      header: () => <span className="text-sm font-semibold">+1</span>,
      cell: ({ getValue, row }) => {
        const hasPlusOne = getValue();
        const plusOneName = row.original.plus_one_name;
        if (!hasPlusOne) {
          return <span className="text-base font-normal text-muted-foreground">—</span>;
        }
        return (
          <span className="text-base font-normal">
            {plusOneName ? plusOneName : "Yes"}
          </span>
        );
      },
      enableSorting: false,
    }),

    // RSVP Status — sortable
    columnHelper.accessor("rsvp_status", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-sm font-semibold px-0 hover:bg-transparent"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          RSVP Status
          <ArrowUpDown className="ml-1 h-3 w-3" aria-hidden="true" />
        </Button>
      ),
      cell: ({ getValue }) => <RsvpStatusBadge status={getValue()} />,
    }),

    // Response Date — sortable (D-07: responded_at)
    columnHelper.accessor("responded_at", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-sm font-semibold px-0 hover:bg-transparent"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Response Date
          <ArrowUpDown className="ml-1 h-3 w-3" aria-hidden="true" />
        </Button>
      ),
      cell: ({ getValue }) => {
        const val = getValue();
        if (!val) {
          return (
            <span className="text-base font-normal text-muted-foreground">—</span>
          );
        }
        return (
          <span className="text-base font-normal">
            {new Date(val).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    }),

    // Actions
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const guest = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Actions for ${guest.full_name}`}
                disabled={isPendingOverride || isPendingDelete}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* Edit guest */}
              <DropdownMenuItem
                onClick={() => setEditTarget(guest)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" aria-hidden="true" />
                Edit guest
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* RSVP-08: Manual override — UI-SPEC: "Override RSVP" */}
              <DropdownMenuItem
                onClick={() => handleOverride(guest.id, "attending")}
                className="gap-2"
              >
                Mark as Going
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOverride(guest.id, "not_attending")}
                className="gap-2"
              >
                Mark as Not Going
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOverride(guest.id, "pending")}
                className="gap-2"
              >
                Reset to Pending
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Delete guest */}
              <DropdownMenuItem
                onClick={() => setDeleteTarget(guest.id)}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove guest
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: guests,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (guests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
        {/* UI-SPEC: empty state copy */}
        <p className="text-xl font-semibold text-foreground">
          No guests added yet
        </p>
        <p className="text-base font-normal text-muted-foreground">
          Add your guests to build the RSVP list. Include nicknames so guests
          can find themselves easily.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left first:pl-6 last:pr-6"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t border-border hover:bg-muted/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 first:pl-6 last:pr-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirm dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        isPending={isPendingDelete}
      />

      {/* Edit guest dialog */}
      {editTarget && (
        <EditGuestDialog
          guest={editTarget}
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      )}
    </>
  );
}
