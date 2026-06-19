/**
 * lib/stores/onboarding.ts
 * Zustand store for the onboarding wizard.
 *
 * Stores wizard step data client-side to avoid partial DB writes mid-wizard.
 * Only the final submit (Step 2 complete) hits the Server Action createEvent.
 *
 * Steps:
 *   1 — Event date + time ("When is the big day?")
 *   2 — Ceremony + Reception locations ("Where will it happen?")
 */
import { create } from "zustand"

export interface LocationData {
  venue_name: string
  address: string
  role: string
}

export interface OnboardingStepOneData {
  event_date: string
  event_time: string
}

export interface OnboardingState {
  step: 1 | 2
  stepOne: OnboardingStepOneData | null
  ceremonyLocation: LocationData
  receptionLocation: LocationData
  setStep: (step: 1 | 2) => void
  setStepOne: (data: OnboardingStepOneData) => void
  setCeremonyLocation: (data: LocationData) => void
  setReceptionLocation: (data: LocationData) => void
  reset: () => void
}

const defaultLocation: LocationData = { venue_name: "", address: "", role: "" }

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  stepOne: null,
  ceremonyLocation: defaultLocation,
  receptionLocation: defaultLocation,
  setStep: (step) => set({ step }),
  setStepOne: (data) => set({ stepOne: data }),
  setCeremonyLocation: (data) => set({ ceremonyLocation: data }),
  setReceptionLocation: (data) => set({ receptionLocation: data }),
  reset: () =>
    set({
      step: 1,
      stepOne: null,
      ceremonyLocation: defaultLocation,
      receptionLocation: defaultLocation,
    }),
}))
