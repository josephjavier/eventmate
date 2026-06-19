import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">EventMate</h1>
        <p className="mt-3 text-muted-foreground text-lg">
          Plan your perfect Philippine wedding — suppliers, budget, guests, and
          checklist in one place.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
        >
          Sign up
        </Link>
      </div>
    </main>
  );
}
