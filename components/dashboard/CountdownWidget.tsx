"use client"
// MANDATORY: 'use client' — new Date() in Server Component causes hydration mismatch (RESEARCH Pitfall 6)

import { differenceInDays } from "date-fns"

interface Props {
  /** ISO date string passed from Server Component parent */
  eventDate: string
}

/**
 * CountdownWidget — shows how many days until the wedding.
 * Must be a Client Component because it reads new Date() at render time.
 * UI-SPEC §Countdown Widget: large number in accent color + "days until your wedding" label.
 */
export function CountdownWidget({ eventDate }: Props) {
  const daysLeft = differenceInDays(new Date(eventDate), new Date())

  let label: string
  if (daysLeft === 0) {
    label = "Today is your wedding day!"
  } else if (daysLeft < 0) {
    label = `${Math.abs(daysLeft)} days since your wedding`
  } else {
    label = "days until your wedding"
  }

  return (
    <div className="rounded-xl bg-card border border-border p-6 flex flex-col items-center justify-center gap-1">
      {daysLeft === 0 ? (
        <p className="text-3xl font-semibold text-[#BE3C5E]">{label}</p>
      ) : daysLeft < 0 ? (
        <p className="text-3xl font-semibold text-muted-foreground">{label}</p>
      ) : (
        <>
          <span className="text-[28px] font-semibold text-[#BE3C5E] leading-none">
            {daysLeft}
          </span>
          <span className="text-base font-normal text-foreground">{label}</span>
        </>
      )}
    </div>
  )
}
