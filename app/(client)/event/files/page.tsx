/**
 * app/(client)/event/files/page.tsx
 * Files page — Server Component.
 *
 * AUTH: assertRole('client') — redirects to /login if unauthenticated or wrong role.
 * DUAL AUTH LAYER: assertRole() calls verifySession() internally per CLAUDE.md §5.
 *
 * Loads: event_files for the authenticated user's event.
 * Renders: FileDropzone (upload) + FileGrid (file list with download/delete)
 *
 * FILE-01: Upload files tagged to supplier or checklist item
 * FILE-02: Upload general event files (no tag)
 * FILE-03: View and download via signed URL (handled in FileCard → getSignedUrl)
 * FILE-04: Type/size guard in FileDropzone + saveFilePath re-check (T-1-11)
 *
 * UI-SPEC §Files Page:
 *   - Page title: "Files"
 *   - Empty state heading: "No files uploaded yet"
 *   - Empty state body: "Upload contracts, receipts, and quotations to keep everything in one place."
 *   - Upload CTA: "Upload File"
 * UI-SPEC §Page-Level Layout Contracts (Files Page):
 *   - react-dropzone drop zone at top: full width, 96px min-height, dashed border
 *   - File grid below: 3-column on desktop, 1-column on mobile
 */

import { assertRole } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { FileDropzone } from "@/components/files/FileDropzone";
import { FileGrid } from "@/components/files/FileGrid";
import type { FileCardProps } from "@/components/files/FileCard";
import { UploadCloud } from "lucide-react";

export default async function FilesPage() {
  // Auth + role guard (CLAUDE.md §Architecture Decisions #5)
  const { user } = await assertRole("client");
  const supabase = await createClient();

  // Fetch the client's event
  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("client_id", user.id)
    .maybeSingle();

  if (!event) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold text-foreground">Files</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
          <p className="text-xl font-semibold text-foreground">No event created yet</p>
          <p className="text-base font-normal text-muted-foreground">
            Create your wedding event to start uploading files.
          </p>
          <a
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-md bg-[#BE3C5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#BE3C5E]/90"
          >
            Create Your Event
          </a>
        </div>
      </div>
    );
  }

  // Fetch all event files for this event
  const { data: files } = await supabase
    .from("event_files")
    .select(
      "id, file_name, mime_type, uploaded_at, supplier_label, checklist_item_id, storage_path"
    )
    .eq("event_id", event.id)
    .order("uploaded_at", { ascending: false });

  const fileList: FileCardProps[] = files ?? [];
  const hasFiles = fileList.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        {/* UI-SPEC: page title "Files" */}
        <h1 className="text-3xl font-semibold text-foreground">Files</h1>
      </div>

      {/* Upload dropzone — always visible (UI-SPEC §Files Page: drop zone at top) */}
      <FileDropzone eventId={event.id} />

      {/* File grid or empty state */}
      {hasFiles ? (
        <FileGrid files={fileList} />
      ) : (
        /* UI-SPEC §Files Page: exact empty state copy */
        <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
          <div className="flex justify-center">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
          </div>
          {/* UI-SPEC: "No files uploaded yet" */}
          <p className="text-xl font-semibold text-foreground">
            No files uploaded yet
          </p>
          {/* UI-SPEC: exact body copy */}
          <p className="text-base font-normal text-muted-foreground">
            Upload contracts, receipts, and quotations to keep everything in one place.
          </p>
        </div>
      )}
    </div>
  );
}
