// lib/dal.ts
// Data Access Layer — the server-side security boundary.
//
// DUAL AUTH LAYER (CLAUDE.md §Architecture Decisions #5):
// - middleware.ts handles redirect UX only (cookie refresh, unauthenticated redirect)
// - Every Server Action and protected Route Handler independently calls verifySession()
//   here. Middleware and DAL are BOTH required — one is not a substitute for the other.
//
// WHY getUser() NOT getSession():
// getSession() reads the JWT from the cookie without validating it against the
// Supabase Auth server — an attacker can forge the cookie. getUser() makes a
// network call to the Auth server to validate the JWT on every call.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Verifies the user's session on every protected server call.
 *
 * Redirects to /login if unauthenticated. Returns the authenticated user object.
 * Cached with React.cache() so multiple calls in the same request are deduplicated.
 *
 * Usage: const user = await verifySession()  (first line of every Server Action)
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  // getUser() not getSession() — validates against Supabase Auth server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
});

/**
 * Verifies the session AND asserts the user has the required role.
 *
 * Redirects to /login if unauthenticated or role does not match.
 * Used in route group layouts (e.g., app/(client)/layout.tsx).
 *
 * Usage: await assertRole('client')  (in layout.tsx for role-gated route groups)
 */
export const assertRole = cache(
  async (requiredRole: "client" | "supplier" | "admin") => {
    const user = await verifySession();
    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== requiredRole) {
      redirect("/login");
    }

    return { user, profile };
  }
);
