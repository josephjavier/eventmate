"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signUpSchema, signInSchema, forgotPasswordSchema, updatePasswordSchema } from "@/lib/schemas/auth"

/**
 * signUp — creates account + sets consent_given_at (RA 10173)
 * Redirects to /dashboard on success per D-01 (no forced onboarding).
 */
export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const consentRaw = formData.get("consent")
  const consent = consentRaw === "true" || consentRaw === "on"

  const parsed = signUpSchema.safeParse({ email, password, consent })
  if (!parsed.success) {
    const issues = parsed.error.issues
    return { error: issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  // RA 10173: Record consent timestamp on the profiles row
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ consent_given_at: new Date().toISOString() })
      .eq("id", data.user.id)
  }

  // D-01: signup creates account only; dashboard shows "Create Your Event" CTA (D-03)
  redirect("/dashboard")
}

/**
 * signIn — authenticates with email + password, redirects to /dashboard
 */
export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const parsed = signInSchema.safeParse({ email, password })
  if (!parsed.success) {
    const issues = parsed.error.issues
    return { error: issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: "Invalid email or password. Please check your details and try again." }
  }

  redirect("/dashboard")
}

/**
 * signOut — signs out the current user and redirects to /login
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

/**
 * resetPassword — sends a password reset email via Supabase Auth
 */
export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string

  const parsed = forgotPasswordSchema.safeParse({ email })
  if (!parsed.success) {
    const issues = parsed.error.issues
    return { error: issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * updatePassword — sets a new password for the authenticated user
 */
export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string

  const parsed = updatePasswordSchema.safeParse({ password })
  if (!parsed.success) {
    const issues = parsed.error.issues
    return { error: issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}
