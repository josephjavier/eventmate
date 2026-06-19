/**
 * lib/schemas/auth.ts
 * Zod v4 schemas for auth forms.
 * AUTH-01: Signup requires password min 8 chars
 * RA 10173: Signup requires explicit consent === true
 */
import { z } from "zod"

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Minimum 8 characters"),
  consent: z
    .boolean()
    .refine((v) => v === true, "You must accept the privacy policy"),
})

export type SignUpFormValues = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required"),
})

export type SignInFormValues = z.infer<typeof signInSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Minimum 8 characters"),
})

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>
