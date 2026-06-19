import Link from "next/link"
import { Button } from "@/components/ui/button"

/**
 * DashboardEmptyState — shown when the client has no event yet (D-01/D-03).
 * UI-SPEC §Dashboard Empty State (No Event) copy is locked.
 * Primary CTA links to /onboarding.
 */
export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 max-w-sm">
        {/* Icon placeholder */}
        <div className="w-16 h-16 rounded-full bg-[#BE3C5E]/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#BE3C5E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>

        {/* UI-SPEC locked copy */}
        <h1 className="text-xl font-semibold text-foreground">
          Your wedding adventure starts here
        </h1>
        <p className="text-base font-normal text-muted-foreground">
          Create your wedding event to start tracking your checklist, budget, and guest list
          — all in one place.
        </p>
      </div>

      {/* Primary CTA — accent color per UI-SPEC */}
      <Button asChild className="bg-[#BE3C5E] hover:bg-[#a83452] text-white px-8">
        <Link href="/onboarding">Create Your Event</Link>
      </Button>
    </div>
  )
}
