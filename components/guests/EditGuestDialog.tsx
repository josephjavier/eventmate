"use client";

/**
 * components/guests/EditGuestDialog.tsx
 * Dialog for editing an existing guest record.
 *
 * Uses the same form structure as AddGuestDialog with pre-filled values.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateGuestSchema, type UpdateGuestFormValues } from "@/lib/schemas/guest";
import { updateGuest } from "@/app/actions/guests";
import type { GuestRow } from "@/components/guests/GuestTable";
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

interface EditGuestDialogProps {
  guest: GuestRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGuestDialog({
  guest,
  open,
  onOpenChange,
}: EditGuestDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<UpdateGuestFormValues>({
    resolver: zodResolver(updateGuestSchema),
    defaultValues: {
      full_name: guest.full_name,
      nickname: guest.nickname ?? "",
      has_plus_one: guest.has_plus_one,
      plus_one_name: guest.plus_one_name ?? "",
    },
  });

  const hasPlus1 = form.watch("has_plus_one");

  async function onSubmit(values: UpdateGuestFormValues) {
    setIsPending(true);
    try {
      const result = await updateGuest(guest.id, {
        full_name: values.full_name,
        nickname: values.nickname || undefined,
        has_plus_one: values.has_plus_one,
        plus_one_name: values.plus_one_name || undefined,
      });

      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else {
        toast.success("Guest updated.", { duration: 4000 });
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
          <DialogTitle className="text-xl font-semibold">Edit Guest</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Full name
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nickname */}
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Nickname (optional)
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <p className="text-sm font-normal text-muted-foreground">
                    e.g., Tita Cora, Kuya Jojo — guests can search by this name
                    too
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* +1 checkbox */}
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

            {/* +1 name — conditional */}
            {hasPlus1 && (
              <FormField
                control={form.control}
                name="plus_one_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">
                      +1 Name (optional)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-[#BE3C5E] hover:bg-[#BE3C5E]/90 text-white font-semibold"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
