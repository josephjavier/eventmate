"use client";

/**
 * components/guests/AddGuestDialog.tsx
 * Dialog for adding a new guest to the event.
 *
 * RSVP-01: full name + optional nickname (D-05)
 * RSVP-02: +1 checkbox + optional +1 name field
 * UI-SPEC §Guests Page: exact field labels and nickname hint copy
 *   - "Full name" label
 *   - "Nickname (optional)" label
 *   - Hint: "e.g., Tita Cora, Kuya Jojo — guests can search by this name too"
 *   - "+1 Name (optional)" label shown when has_plus_one is checked
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { addGuestSchema, type AddGuestFormValues } from "@/lib/schemas/guest";
import { addGuest } from "@/app/actions/guests";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface AddGuestDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGuestDialog({
  eventId,
  open,
  onOpenChange,
}: AddGuestDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<AddGuestFormValues>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      full_name: "",
      nickname: "",
      has_plus_one: false,
      plus_one_name: "",
    },
  });

  const hasPlus1 = form.watch("has_plus_one");

  async function onSubmit(values: AddGuestFormValues) {
    setIsPending(true);
    try {
      const result = await addGuest(eventId, {
        full_name: values.full_name,
        nickname: values.nickname || undefined,
        has_plus_one: values.has_plus_one,
        plus_one_name: values.plus_one_name || undefined,
      });

      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        toast.success("Guest added.", { duration: 4000 });
        form.reset();
        onOpenChange(false);
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          {/* UI-SPEC §Guests Page: "Add Guest" as CTA — dialog heading follows same naming */}
          <DialogTitle className="text-xl font-semibold">Add Guest</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name field — UI-SPEC: "Full name" label */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Full name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Maria Santos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nickname field — UI-SPEC: "Nickname (optional)" + exact hint text */}
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Nickname (optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tita Maria" {...field} />
                  </FormControl>
                  {/* UI-SPEC exact hint: "e.g., Tita Cora, Kuya Jojo — guests can search by this name too" */}
                  <p className="text-sm font-normal text-muted-foreground">
                    e.g., Tita Cora, Kuya Jojo — guests can search by this name
                    too
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* +1 checkbox — UI-SPEC: "This guest has a +1" */}
            <FormField
              control={form.control}
              name="has_plus_one"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-semibold cursor-pointer">
                    This guest has a +1
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* +1 name — shown when has_plus_one is checked (RSVP-02) */}
            {hasPlus1 && (
              <FormField
                control={form.control}
                name="plus_one_name"
                render={({ field }) => (
                  <FormItem>
                    {/* UI-SPEC: "+1 Name (optional)" */}
                    <FormLabel className="text-sm font-semibold">
                      +1 Name (optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Juan Santos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white font-semibold"
              >
                {isPending ? "Adding..." : "Add Guest"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
