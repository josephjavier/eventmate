/**
 * lib/schemas/file.ts
 * Zod v4 schema for event file upload metadata.
 *
 * FILE-01: Client can upload files tagged to a supplier or checklist item
 * FILE-02: Client can upload general event files (nullable tags)
 * FILE-04: Accepted types: PDF, JPG, PNG only
 * T-1-11:  MIME validated client-side (react-dropzone) AND server-side (saveFilePath)
 *          This file is the single source of truth for both layers.
 *
 * MAX_FILE_BYTES: 10 MB — enforced by react-dropzone maxSize + Server Action check
 * ACCEPTED_MIME:  Exported and used by react-dropzone accept prop AND Server Action
 *                 re-validation (defense in depth).
 */
import { z } from "zod";

// ─── Constants (single source of truth for both client and server) ────────────

/** Accepted MIME types for event file uploads (FILE-04). */
export const ACCEPTED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type AcceptedMimeType = (typeof ACCEPTED_MIME)[number];

/** Maximum file size in bytes: 10 MB (FILE-04, T-1-11). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// ─── fileMetaSchema ───────────────────────────────────────────────────────────

/**
 * Validates the metadata for a file upload before inserting into event_files.
 *
 * - file_name: required, non-empty string
 * - mime_type: must be one of ACCEPTED_MIME (PDF/JPG/PNG)
 * - size: must not exceed MAX_FILE_BYTES (10 MB)
 * - checklist_item_id: optional UUID — tags the file to a checklist item (FILE-01)
 * - supplier_label: optional string — tags the file to a supplier by name (FILE-01)
 *   (both tags are nullable — FILE-02 allows general uploads with no tag)
 */
export const fileMetaSchema = z.object({
  file_name: z.string().min(1, "File name is required"),
  mime_type: z
    .string()
    .refine(
      (v): v is AcceptedMimeType =>
        (ACCEPTED_MIME as readonly string[]).includes(v),
      "Only PDF, JPG, and PNG files are accepted."
    ),
  size: z
    .number()
    .int("File size must be an integer")
    .min(1, "File size must be positive")
    .max(MAX_FILE_BYTES, "File too large. Maximum size is 10 MB."),
  checklist_item_id: z.string().uuid().optional(),
  supplier_label: z.string().optional(),
});

export type FileMetaFormValues = z.infer<typeof fileMetaSchema>;
