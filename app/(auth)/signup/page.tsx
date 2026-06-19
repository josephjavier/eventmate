"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { signUp } from "@/app/actions/auth"
import { signUpSchema, type SignUpFormValues } from "@/lib/schemas/auth"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      consent: false,
    },
  })

  const onSubmit = async (values: SignUpFormValues) => {
    setServerError(null)
    const formData = new FormData()
    formData.set("email", values.email)
    formData.set("password", values.password)
    formData.set("consent", String(values.consent))

    const result = await signUp(formData)
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
          <CardTitle className="text-xl font-semibold">Create your account</CardTitle>
          <CardDescription className="text-base font-normal">
            Start planning your wedding in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
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

              {/* RA 10173: Required privacy consent checkbox */}
              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-2">
                      <FormControl>
                        <Checkbox
                          id="consent"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="consent"
                        className="text-sm font-normal leading-snug cursor-pointer"
                      >
                        I agree to the{" "}
                        <Link href="/privacy" className="underline hover:text-primary">
                          Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link href="/terms" className="underline hover:text-primary">
                          Terms of Service
                        </Link>
                        .
                      </FormLabel>
                    </div>
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
                {form.formState.isSubmitting ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline text-foreground hover:text-primary">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
