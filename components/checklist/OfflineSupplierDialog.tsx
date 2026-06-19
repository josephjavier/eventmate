"use client"

/**
 * components/checklist/OfflineSupplierDialog.tsx
 * Dialog for attaching an offline supplier to a checklist item.
 *
 * DISC-07: Offline supplier attachment — name + category required.
 * UI-SPEC §Checklist Page (locked copy):
 *   - Heading: "Add a Supplier"
 *   - Body: "For suppliers you found on Facebook, Instagram, or by referral."
 *   - Name label: "Supplier name"
 *   - Submit: "Add Supplier"
 *
 * Uses react-hook-form + zodResolver (RESEARCH Pattern 4 — Zod v4 + RHF).
 */

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { offlineSupplierSchema, type OfflineSupplierFormValues } from "@/lib/schemas/checklist"
import { attachOfflineSupplier } from "@/app/actions/checklist"

interface OfflineSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId: string
  existingName?: string
  existingCategory?: string
}

export function OfflineSupplierDialog({
  open,
  onOpenChange,
  itemId,
  existingName,
  existingCategory,
}: OfflineSupplierDialogProps) {
  const form = useForm<OfflineSupplierFormValues>({
    resolver: zodResolver(offlineSupplierSchema),
    defaultValues: {
      name: existingName ?? "",
      category: existingCategory ?? "",
      contact: "",
      notes: "",
    },
  })

  async function onSubmit(data: OfflineSupplierFormValues) {
    const result = await attachOfflineSupplier(itemId, data)
    if (result?.error) {
      toast.error(result.error, { duration: 6000 })
    } else {
      toast.success("Supplier added", { duration: 4000 })
      onOpenChange(false)
      form.reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          {/* UI-SPEC: exact heading and body (locked) */}
          <DialogTitle>Add a Supplier</DialogTitle>
          <DialogDescription>
            For suppliers you found on Facebook, Instagram, or by referral.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Supplier name — required (UI-SPEC: label "Supplier name") */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Juan dela Cruz Photography" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category — required */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Photography" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact — optional */}
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Phone number, email, or social media"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes — optional */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any notes about this supplier"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                }}
              >
                Cancel
              </Button>
              {/* UI-SPEC: submit button text "Add Supplier" */}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding…" : "Add Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
