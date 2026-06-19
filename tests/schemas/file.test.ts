/**
 * FILE-04: File upload schema validation
 *
 * TDD RED phase — tests are written before implementation.
 * Tests validate:
 *   - MIME type enforcement: only PDF, JPG, PNG accepted
 *   - Size enforcement: rejects files > 10 MB
 *   - Optional fields: checklist_item_id and supplier_label are optional
 *
 * Requirements:
 * - FILE-04: Accepted types: PDF, JPG, PNG only
 * - T-1-11: Client-side MIME guard must be mirrored server-side (defense in depth)
 */
import { describe, it, expect } from "vitest";
import {
  fileMetaSchema,
  ACCEPTED_MIME,
  MAX_FILE_BYTES,
} from "@/lib/schemas/file";

const TEN_MB = 10 * 1024 * 1024;
const ELEVEN_MB = 11 * 1024 * 1024;

describe("fileMetaSchema (FILE-04 + T-1-11)", () => {
  describe("MIME type validation", () => {
    it("accepts application/pdf", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "contract.pdf",
        mime_type: "application/pdf",
        size: 1024,
      });
      expect(result.success).toBe(true);
    });

    it("accepts image/jpeg", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "photo.jpg",
        mime_type: "image/jpeg",
        size: 1024,
      });
      expect(result.success).toBe(true);
    });

    it("accepts image/png", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "diagram.png",
        mime_type: "image/png",
        size: 1024,
      });
      expect(result.success).toBe(true);
    });

    it("rejects video/mp4", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "video.mp4",
        mime_type: "video/mp4",
        size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("rejects text/plain", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "notes.txt",
        mime_type: "text/plain",
        size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("rejects application/zip", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "archive.zip",
        mime_type: "application/zip",
        size: 1024,
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty mime_type", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "file.pdf",
        mime_type: "",
        size: 1024,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("size validation", () => {
    it("accepts file exactly at 10 MB limit", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "large.pdf",
        mime_type: "application/pdf",
        size: TEN_MB,
      });
      expect(result.success).toBe(true);
    });

    it("rejects file exceeding 10 MB", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "toobig.pdf",
        mime_type: "application/pdf",
        size: ELEVEN_MB,
      });
      expect(result.success).toBe(false);
    });

    it("accepts small file", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "small.png",
        mime_type: "image/png",
        size: 500,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("optional fields", () => {
    it("accepts without checklist_item_id and supplier_label", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "general.pdf",
        mime_type: "application/pdf",
        size: 1024,
      });
      expect(result.success).toBe(true);
    });

    it("accepts with checklist_item_id as valid UUID", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "contract.pdf",
        mime_type: "application/pdf",
        size: 1024,
        checklist_item_id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with supplier_label", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "quote.pdf",
        mime_type: "application/pdf",
        size: 1024,
        supplier_label: "Photography",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with both tags", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "contract.pdf",
        mime_type: "application/pdf",
        size: 1024,
        checklist_item_id: "550e8400-e29b-41d4-a716-446655440000",
        supplier_label: "Venue",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID for checklist_item_id", () => {
      const result = fileMetaSchema.safeParse({
        file_name: "contract.pdf",
        mime_type: "application/pdf",
        size: 1024,
        checklist_item_id: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("constants", () => {
    it("ACCEPTED_MIME includes application/pdf", () => {
      expect(ACCEPTED_MIME).toContain("application/pdf");
    });

    it("ACCEPTED_MIME includes image/jpeg", () => {
      expect(ACCEPTED_MIME).toContain("image/jpeg");
    });

    it("ACCEPTED_MIME includes image/png", () => {
      expect(ACCEPTED_MIME).toContain("image/png");
    });

    it("ACCEPTED_MIME does not include video/mp4", () => {
      expect(ACCEPTED_MIME).not.toContain("video/mp4");
    });

    it("MAX_FILE_BYTES equals 10 * 1024 * 1024", () => {
      expect(MAX_FILE_BYTES).toBe(TEN_MB);
    });
  });
});
