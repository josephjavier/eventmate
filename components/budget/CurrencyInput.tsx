"use client";

/**
 * components/budget/CurrencyInput.tsx
 *
 * A PHP-aware text input that:
 * - Accepts numeric peso amounts ("50000" or "50,000")
 * - Uses inputMode="numeric" for numeric keyboard on mobile devices
 * - Formats the displayed value on blur using Intl.NumberFormat 'en-PH'
 * - Emits the raw numeric peso value (PHP) to the parent via onChange
 * - Never displays decimal places for whole peso amounts
 * - Parent converts to INTEGER centavos via phpToCentavos() before DB insert
 *
 * BUDG-01: Input stores/emits PHP amounts; Server Action converts via phpToCentavos
 * T-1-03: Conversion to centavos happens in Server Action, not here
 * UI-SPEC: placeholder "e.g., ₱ 50,000"; inputMode="numeric"; no decimals for whole pesos
 */

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id?: string;
  label?: string;
  /** Current value in PHP (e.g. 50000 for ₱50,000). Pass centavosToPhp(centavos) to initialize. */
  value?: number;
  onChange?: (phpAmount: number) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
}

/**
 * Format a numeric PHP amount as a Philippine Peso display string.
 * Uses minimumFractionDigits: 0 so ₱50,000 renders without ".00".
 */
function formatDisplayValue(phpAmount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(phpAmount);
}

/**
 * Parse a raw user input string into a numeric PHP amount.
 * Strips currency symbols, commas, and whitespace before parsing.
 * Returns 0 for invalid/empty input.
 */
function parseRawInput(raw: string): number {
  // Remove ₱, PHP, commas, whitespace so "₱ 50,000" → "50000"
  const cleaned = raw.replace(/[₱PHP,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  className,
  error,
}: CurrencyInputProps) {
  // Track the raw string the user is typing vs. the formatted display
  const [displayValue, setDisplayValue] = useState<string>(
    value !== undefined && value > 0 ? formatDisplayValue(value) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // When focused, show the raw numeric value so the user can edit easily
  const handleFocus = () => {
    const raw = parseRawInput(displayValue);
    // Show raw number (without formatting) so caret position is predictable
    setDisplayValue(raw > 0 ? String(raw) : "");
  };

  const handleBlur = () => {
    const phpAmount = parseRawInput(displayValue);
    // Reformat on blur for display
    setDisplayValue(phpAmount > 0 ? formatDisplayValue(phpAmount) : "");
    onChange?.(phpAmount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
    // Emit live during typing so parent can track without waiting for blur
    const phpAmount = parseRawInput(e.target.value);
    onChange?.(phpAmount);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="e.g., ₱ 50,000"
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        disabled={disabled}
        aria-required={required}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(error && "border-destructive focus-visible:ring-destructive")}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
