import { verifySession } from "@/lib/dal"

/**
 * Onboarding layout (D-02).
 * verifySession() only — no role check, as new users arrive here before their role
 * is meaningfully differentiated. Outside the (client)/ route group by design.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await verifySession()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-16">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-2xl font-semibold text-foreground">EventMate</span>
      </div>
      {children}
    </main>
  )
}
