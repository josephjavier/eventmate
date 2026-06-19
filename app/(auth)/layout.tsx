import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Auth route group layout.
 * Redirects already-authenticated users to the dashboard so they don't see the login/signup pages.
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      {children}
    </main>
  )
}
