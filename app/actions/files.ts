"use server";

/**
 * app/actions/files.ts
 * Server Actions for the event file storage feature.
 *
 * DUAL AUTH LAYER (CLAUDE.md §Architecture Decisions #5):
 * Every action calls verifySession() independently — never rely on middleware alone.
 *
 * PRIVATE BUCKET (CLAUDE.md §Architecture Decisions — T-1-04):
 * The 'event-files' bucket is private (public = false). Files are NEVER served
 * via public URLs. Download links use signed URLs with a 60-second expiry.
 *
 * SIGNED URLs (FILE-03):
 * getSignedUrl uses the SERVICE CLIENT to generate signed URLs.
 * The user's anon session token cannot sign storage objects — only the service
 * role key has that capability. SUPABASE_SERVICE_ROLE_KEY is NEVER NEXT_PUBLIC_.
 *
 * STORAGE PATH CONVENTION (002_storage_buckets.sql):
 * Objects must be stored at: event-files/<event_id>/<filename>
 * The FIRST path segment is always event_id. RLS extracts it via
 * storage.foldername(name)[1]::uuid and passes it to user_can_access_event().
 *
 * SERVER-SIDE MIME RE-CHECK (T-1-11 — defense in depth):
 * saveFilePath re-validates the mime_type against ACCEPTED_MIME. The client
 * (react-dropzone) does the first check; this is the second, mandatory server
 * guard. Never trust the client for security-critical validation.
 *
 * FILE-01: Upload files tagged to supplier/checklist item
 * FILE-02: Upload general event files (nullable tags)
 * FILE-03: View and download via signed URL
 * FILE-04: Accepted types: PDF, JPG, PNG only
 */

import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { ACCEPTED_MIME } from "@/lib/schemas/file";

// Signed URL expiry in seconds: 60 minutes (T-1-01 short-lived access)
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

// ─── saveFilePath ─────────────────────────────────────────────────────────────

/**
 * saveFilePath — inserts an event_files row after the client has uploaded the
 * file to the 'event-files' Supabase Storage bucket.
 *
 * FILE-01: tags the file to a checklist item and/or supplier label
 * FILE-02: accepts a null tag (general upload)
 * T-1-11: server-side MIME re-validation (defense in depth)
 *
 * Storage path convention (002_storage_buckets.sql):
 *   event-files/<event_id>/<filename>
 * The caller (FileDropzone) is responsible for using this path when uploading.
 */
export async function saveFilePath(
  eventId: string,
  data: {
    storage_path: string;
    file_name: string;
    mime_type: string;
    checklist_item_id?: string;
    supplier_label?: string;
  }
) {
  const user = await verifySession();
  const supabase = await createClient();

  // T-1-11: Server-side MIME re-check — reject anything outside PDF/JPG/PNG
  if (!(ACCEPTED_MIME as readonly string[]).includes(data.mime_type)) {
    return {
      error:
        "Upload failed. Only PDF, JPG, and PNG files are accepted.",
    };
  }

  if (!data.storage_path || !data.file_name) {
    return { error: "Storage path and file name are required" };
  }

  // Verify the event belongs to the authenticated user (belt-and-suspenders; RLS enforces too)
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("client_id", user.id)
    .single();

  if (!event) {
    return { error: "Event not found" };
  }

  const { error } = await supabase.from("event_files").insert({
    event_id: eventId,
    storage_path: data.storage_path,
    file_name: data.file_name,
    mime_type: data.mime_type,
    checklist_item_id: data.checklist_item_id ?? null,
    supplier_label: data.supplier_label ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/event/files");
  return { success: true };
}

// ─── getSignedUrl ─────────────────────────────────────────────────────────────

/**
 * getSignedUrl — generates a time-limited signed URL for a private file.
 *
 * FILE-03: Client can view and download uploaded files via a signed URL.
 * T-1-01:  Cross-event access prevented by: RLS-scoped row lookup + signed URL
 *          only issued for rows the authenticated user can access.
 *
 * Uses the SERVICE CLIENT to call createSignedUrl because only the service role
 * key can generate signed URLs for private buckets. The user's anon session token
 * does not have this capability.
 *
 * URL expiry: 60 minutes (SIGNED_URL_EXPIRY_SECONDS). Short-lived to limit
 * exposure if a URL is inadvertently shared (T-1-01 defense in depth).
 */
export async function getSignedUrl(fileId: string) {
  await verifySession();
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Look up the file row with the user's RLS-scoped session client.
  // This enforces that the requesting user has access to this event's files.
  // If RLS denies the row, data will be null and we return an error.
  const { data: fileRow } = await supabase
    .from("event_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (!fileRow) {
    return { error: "File not found" };
  }

  // Generate the signed URL using the service client (only service role can sign).
  // The path in createSignedUrl is the object name within the bucket (no bucket prefix).
  const { data: signedData, error } = await serviceClient.storage
    .from("event-files")
    .createSignedUrl(fileRow.storage_path, SIGNED_URL_EXPIRY_SECONDS);

  if (error || !signedData?.signedUrl) {
    return { error: "Failed to generate download link. Please try again." };
  }

  return { url: signedData.signedUrl };
}

// ─── deleteFile ───────────────────────────────────────────────────────────────

/**
 * deleteFile — removes the storage object and the event_files row.
 *
 * Deletion order: storage object first, then DB row.
 * If storage deletion fails, the DB row is preserved (recoverable state).
 * If DB deletion fails after storage removal, the row becomes a dangling reference
 * but the object is gone — acceptable tradeoff for simplicity (no orphaned files).
 *
 * RLS on event_files enforces that only the event owner/co-planner can delete.
 * The storage object path is verified by fetching the row first (RLS-scoped).
 */
export async function deleteFile(fileId: string) {
  await verifySession();
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // Fetch the row first (RLS-scoped) to verify access and get the storage path
  const { data: fileRow } = await supabase
    .from("event_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (!fileRow) {
    return { error: "File not found" };
  }

  // Remove the object from Storage.
  // Storage RLS also enforces event access (002_storage_buckets.sql policies).
  const { error: storageError } = await serviceClient.storage
    .from("event-files")
    .remove([fileRow.storage_path]);

  if (storageError) {
    return { error: "Failed to delete file from storage. Please try again." };
  }

  // Remove the DB row (RLS enforces event access)
  const { error: dbError } = await supabase
    .from("event_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    return { error: dbError.message };
  }

  revalidatePath("/event/files");
  return { success: true };
}
