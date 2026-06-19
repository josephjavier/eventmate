"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createEvent } from "@/app/actions/events"
import { useOnboardingStore } from "@/lib/stores/onboarding"
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
import { useState } from "react"

// Step 1 schema: event date (required) + time (optional)
const stepOneSchema = z.object({
  event_date: z.string().min(1, "Wedding date is required"),
  event_time: z.string().optional(),
})

type StepOneValues = z.infer<typeof stepOneSchema>

// Step 2 schema: ceremony + reception locations (EVENT-02)
const stepTwoSchema = z.object({
  ceremony_venue_name: z.string().optional(),
  ceremony_address: z.string().optional(),
  reception_venue_name: z.string().optional(),
  reception_address: z.string().optional(),
})

type StepTwoValues = z.infer<typeof stepTwoSchema>

/**
 * Onboarding wizard — multi-step event creation (D-02, EVENT-01, EVENT-02).
 * Step 1: "When is the big day?" — wedding date + time
 * Step 2: "Where will it happen?" — Ceremony + Reception locations
 * Final submit calls createEvent Server Action → redirect to /dashboard.
 */
export default function OnboardingPage() {
  const { step, stepOne, setStep, setStepOne } = useOnboardingStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ---- Step 1 form ----
  const stepOneForm = useForm<StepOneValues>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      event_date: stepOne?.event_date ?? "",
      event_time: stepOne?.event_time ?? "",
    },
  })

  const onStepOneSubmit = (values: StepOneValues) => {
    setStepOne({
      event_date: values.event_date,
      event_time: values.event_time ?? "",
    })
    setStep(2)
  }

  // ---- Step 2 form ----
  const stepTwoForm = useForm<StepTwoValues>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      ceremony_venue_name: "",
      ceremony_address: "",
      reception_venue_name: "",
      reception_address: "",
    },
  })

  const onStepTwoSubmit = async (values: StepTwoValues) => {
    if (!stepOne) return
    setServerError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set("event_date", stepOne.event_date)
    if (stepOne.event_time) formData.set("event_time", stepOne.event_time)
    if (values.ceremony_venue_name) formData.set("ceremony_venue_name", values.ceremony_venue_name)
    if (values.ceremony_address) formData.set("ceremony_address", values.ceremony_address)
    if (values.reception_venue_name) formData.set("reception_venue_name", values.reception_venue_name)
    if (values.reception_address) formData.set("reception_address", values.reception_address)

    try {
      const result = await createEvent(formData)
      if (result?.error) {
        setServerError(result.error)
        setIsSubmitting(false)
      }
      // On success, createEvent Server Action calls redirect('/dashboard')
    } catch {
      // redirect() throws in Next.js — this is expected on success
    }
  }

  return (
    <div className="w-full max-w-[560px] mx-auto">
      {/* Step indicator — UI-SPEC: Label size (14px/600) */}
      <p className="text-sm font-semibold text-muted-foreground text-center mb-6">
        Step {step} of 2
      </p>

      {/* ---- STEP 1 ---- */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            {/* UI-SPEC locked copy */}
            <h1 className="text-xl font-semibold text-foreground">When is the big day?</h1>
          </div>

          <Form {...stepOneForm}>
            <form
              onSubmit={stepOneForm.handleSubmit(onStepOneSubmit)}
              className="flex flex-col gap-4"
            >
              <FormField
                control={stepOneForm.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wedding date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stepOneForm.control}
                name="event_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                {/* UI-SPEC locked copy */}
                <Button
                  type="submit"
                  className="bg-[#BE3C5E] hover:bg-[#a83452] text-white px-6"
                >
                  Continue to Location
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* ---- STEP 2 ---- */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div>
            {/* UI-SPEC locked copy */}
            <h1 className="text-xl font-semibold text-foreground">Where will it happen?</h1>
            <p className="text-base font-normal text-muted-foreground mt-1">
              Add at least one location. You can add more later.
            </p>
          </div>

          <Form {...stepTwoForm}>
            <form
              onSubmit={stepTwoForm.handleSubmit(onStepTwoSubmit)}
              className="flex flex-col gap-6"
            >
              {/* Ceremony location (required label — EVENT-02) */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Ceremony <span className="text-muted-foreground font-normal">(required)</span>
                </p>
                <FormField
                  control={stepTwoForm.control}
                  name="ceremony_venue_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="e.g., Saint Peter Parish Church"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stepTwoForm.control}
                  name="ceremony_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Reception location (optional label — EVENT-02) */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-foreground">
                  Reception <span className="text-muted-foreground font-normal">(optional)</span>
                </p>
                <FormField
                  control={stepTwoForm.control}
                  name="reception_venue_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="e.g., Saint Peter Parish Church"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={stepTwoForm.control}
                  name="reception_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {serverError && (
                <p className="text-sm font-medium text-destructive">{serverError}</p>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                {/* UI-SPEC locked copy */}
                <Button
                  type="submit"
                  className="bg-[#BE3C5E] hover:bg-[#a83452] text-white px-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Start Planning"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  )
}
