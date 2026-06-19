/**
 * AUTH-01 + RA 10173: Signup schema validation
 *
 * Wave-0 failing-first spec. The schema under test is created in Wave 3
 * (lib/schemas/auth.ts). These tests remain RED until that wave lands.
 *
 * Requirements:
 * - AUTH-01: Signup rejects weak passwords (min 8 chars)
 * - RA 10173 (Philippine Data Privacy Act): User must explicitly consent
 *   via a checkbox. consent must === true.
 */
import { describe, it, expect } from "vitest";
import { signUpSchema } from "@/lib/schemas/auth";

describe("signup schema (AUTH-01 + RA 10173)", () => {
  describe("password validation", () => {
    it("rejects password shorter than 8 characters", () => {
      const result = signUpSchema.safeParse({
        email: "user@example.com",
        password: "short",
        consent: true,
      });
      expect(result.success).toBe(false);
    });

    it("accepts password of exactly 8 characters", () => {
      const result = signUpSchema.safeParse({
        email: "user@example.com",
        password: "12345678",
        consent: true,
      });
      expect(result.success).toBe(true);
    });

    it("accepts password longer than 8 characters", () => {
      const result = signUpSchema.safeParse({
        email: "user@example.com",
        password: "securepassword123",
        consent: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("rejects invalid email format", () => {
      const result = signUpSchema.safeParse({
        email: "not-an-email",
        password: "securepassword123",
        consent: true,
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid email", () => {
      const result = signUpSchema.safeParse({
        email: "maria.santos@gmail.com",
        password: "securepassword123",
        consent: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("consent validation (RA 10173 — Philippine Data Privacy Act)", () => {
    it("rejects when consent is false", () => {
      const result = signUpSchema.safeParse({
        email: "user@example.com",
        password: "securepassword123",
        consent: false,
      });
      expect(result.success).toBe(false);
    });

    it("rejects when consent is missing", () => {
      const result = signUpSchema.safeParse({
        email: "user@example.com",
        password: "securepassword123",
      });
      expect(result.success).toBe(false);
    });

    it("accepts when consent is true", () => {
      const result = signUpSchema.safeParse({
        email: "user@example.com",
        password: "securepassword123",
        consent: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
