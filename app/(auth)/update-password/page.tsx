"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updatePassword } from "@/app/actions/auth"
import { updatePasswordSchema, type UpdatePasswordFormValues } from "@/lib/schemas/auth"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function UpdatePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "" },
  })

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    setServerError(null)
    const formData = new FormData()
    formData.set("password", values.password)

    const result = await updatePassword(formData)
    if (result?.error) {
      setServerError(result.error)
    }
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Logo */}
      <div className="text-center mb-8">
        <span className="text-2xl font-semibold text-primary">EventMate</span>
      </div>

      <Card>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold">Create a new password</CardTitle>
          <CardDescription className="text-base font-normal">
            Choose a strong password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {serverError && (
                <p className="text-sm font-medium text-destructive">{serverError}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#BE3C5E] hover:bg-[#a83452] text-white"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Updating..." : "Update password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
