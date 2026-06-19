import { assertRole } from "@/lib/dal"
import { signOut } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

/**
 * Client route group layout.
 * assertRole('client') redirects to /login if unauthenticated or wrong role.
 * Renders the topbar (logo + user avatar/menu with logout) per UI-SPEC.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await assertRole("client")

  const emailInitial = user.email?.[0]?.toUpperCase() ?? "U"

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background sticky top-0 z-40">
        <Link href="/dashboard" className="text-lg font-semibold text-foreground">
          EventMate
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#BE3C5E] text-white text-sm font-semibold">
                  {emailInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full text-left text-sm cursor-pointer">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card/50 px-4 py-6 gap-1">
          <nav className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-md hover:bg-muted transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/event/checklist"
              className="flex items-center gap-3 px-3 py-2 text-sm font-normal rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              Checklist
            </Link>
            <Link
              href="/event/budget"
              className="flex items-center gap-3 px-3 py-2 text-sm font-normal rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              Budget
            </Link>
            <Link
              href="/event/guests"
              className="flex items-center gap-3 px-3 py-2 text-sm font-normal rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              Guests
            </Link>
            <Link
              href="/event/files"
              className="flex items-center gap-3 px-3 py-2 text-sm font-normal rounded-md hover:bg-muted transition-colors text-muted-foreground"
            >
              Files
            </Link>
          </nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
