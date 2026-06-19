import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui utility: merges Tailwind class names safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Utilities (BUDG-01, CLAUDE.md §Architecture Decisions #1) ──────
//
// All monetary values are stored as INTEGER centavos (₱1 = 100 centavos).
// These are the ONLY functions that should perform PHP ↔ centavos conversion.
// Never use inline arithmetic (amount * 100) — always go through these utilities
// to ensure a single, consistent rounding point.
//
// Example: ₱50,000 = 5,000,000 centavos

/**
 * Convert Philippine Peso (float user input) to centavos integer for DB storage.
 *
 * @param amount - Amount in PHP (e.g., 50000 for ₱50,000)
 * @returns Integer centavos (e.g., 5000000)
 */
export function phpToCentavos(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert centavos integer from DB to PHP for display.
 *
 * @param centavos - Integer centavos from DB (e.g., 5000000)
 * @returns PHP amount as number (e.g., 50000)
 */
export function centavosToPhp(centavos: number): number {
  return centavos / 100;
}

/**
 * Format centavos as a Philippine Peso string for display.
 *
 * Uses native Intl.NumberFormat with 'en-PH' locale — zero bundle cost.
 * minimumFractionDigits: 0 so ₱50,000 renders without ".00" suffix.
 *
 * @param centavos - Integer centavos from DB (e.g., 5000000)
 * @returns Formatted string (e.g., "₱ 50,000")
 */
export function formatPHP(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(centavosToPhp(centavos));
  // → "₱ 50,000"
}
