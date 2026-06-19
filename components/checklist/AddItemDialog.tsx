"use client"

/**
 * components/checklist/AddItemDialog.tsx
 * Dialog for adding a custom checklist item.
 *
 * CHECK-02: Client can add a custom item to their checklist.
 * UI-SPEC §Checklist Page: "Add Item" CTA (locked label).
 *
 * Uses react-hook-form + zodResolver (RESEARCH Pattern 4).
 */

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { addItem } from "@/app/actions/checklist"

const addItemSchema = z.object({
  title: z.string().min(1, "Item name is required"),
  item_type: z.enum(["supplier_task", "personal_task"]),
  category: z.string().optional(),
})

type AddItemFormValues = z.infer<typeof addItemSchema>

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  defaultCategory?: string
}

export function AddItemDialog({
  open,
  onOpenChange,
  eventId,
  defaultCategory,
}: AddItemDialogProps) {
  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      title: "",
      item_type: "supplier_task",
      category: defaultCategory ?? "",
    },
  })

  async function onSubmit(data: AddItemFormValues) {
    const formData = new FormData()
    formData.set("title", data.title)
    formData.set("item_type", data.item_type)
    formData.set("event_id", eventId)
    if (data.category) {
      formData.set("category", data.category)
    }

    const result = await addItem(formData)
    if (result?.error) {
      toast.error(result.error, { duration: 6000 })
    } else {
      toast.success("Item added", { duration: 4000 })
      onOpenChange(false)
      form.reset({ title: "", item_type: "supplier_task", category: defaultCategory ?? "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Confirm seating arrangement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Item type */}
            <FormField
              control={form.control}
              name="item_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="supplier_task">Supplier task</SelectItem>
                      <SelectItem value="personal_task">Personal task</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category — optional */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Photography"
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding…" : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
