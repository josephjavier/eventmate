"use client";

/**
 * components/files/FileDropzone.tsx
 * Drag-and-drop file upload component for event files.
 *
 * UI-SPEC §Files Page:
 *   - Drop zone instruction: "Drag and drop a file here, or click to browse"
 *   - Accepted types hint: "PDF, JPG, or PNG — up to 10 MB"
 *   - Tag label: "Tag to"
 * UI-SPEC §Page-Level Layout Contracts (Files Page):
 *   - Full width, 96px min-height, dashed border
 *   - Dashed border: muted color normally; accent on drag-over
 * UI-SPEC §Interaction Contracts (File Upload Flow):
 *   - Accepted types: PDF, JPG, PNG — reject others immediately client-side
 *   - Size limit: 10 MB — reject before upload attempt
 *   - During upload: show filename + spinner
 *   - On success: sonner success toast
 *   - On failure: sonner error toast with exact UI-SPEC error copy
 * UI-SPEC §Global Error States:
 *   - File upload — wrong type: "Upload failed. Only PDF, JPG, and PNG files are accepted."
 *   - File upload — too large: "File too large. Maximum size is 10 MB."
 *
 * Architecture:
 *   1. Client validates type/size via react-dropzone (first guard, T-1-11)
 *   2. Client uploads to event-files bucket at {eventId}/{uuid}-{filename}
 *   3. Client calls saveFilePath Server Action to record the row in event_files
 *   4. Server Action re-validates mime_type (second guard, defense in depth, T-1-11)
 *
 * Storage path convention (002_storage_buckets.sql):
 *   event-files/<event_id>/<filename>
 *   First segment MUST be event_id for RLS to work.
 */

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveFilePath } from "@/app/actions/files";
import { ACCEPTED_MIME, MAX_FILE_BYTES } from "@/lib/schemas/file";

interface FileDropzoneProps {
  eventId: string;
  /** Optional: tag the file to a checklist item */
  checklistItemId?: string;
  /** Optional: tag the file to a supplier label */
  supplierLabel?: string;
}

/**
 * Build the react-dropzone `accept` map from ACCEPTED_MIME.
 * react-dropzone accept format: { 'mime/type': ['.ext', ...] }
 */
const ACCEPT_MAP: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export function FileDropzone({
  eventId,
  checklistItemId,
  supplierLabel,
}: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: { file: File; errors: readonly { code: string }[] }[]) => {
      // Handle client-side rejections
      for (const rejection of rejectedFiles) {
        const errorCode = rejection.errors[0]?.code;
        if (errorCode === "file-too-large") {
          // UI-SPEC §Global Error States: exact copy
          toast.error("File too large. Maximum size is 10 MB.");
        } else if (errorCode === "file-invalid-type") {
          // UI-SPEC §Global Error States: exact copy
          toast.error("Upload failed. Only PDF, JPG, and PNG files are accepted.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      }

      // Process accepted files sequentially
      for (const file of acceptedFiles) {
        setUploading(true);
        setUploadingFileName(file.name);

        try {
          // Build storage path: event-files/<event_id>/<uuid>-<filename>
          // First segment MUST be event_id (RLS enforced via storage.foldername(name)[1])
          const uniqueId = crypto.randomUUID();
          const storagePath = `${eventId}/${uniqueId}-${file.name}`;

          // Upload to Supabase Storage (client-side, RLS-protected bucket)
          const supabase = createClient();
          const { error: uploadError } = await supabase.storage
            .from("event-files")
            .upload(storagePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            toast.error("Something went wrong. Please try again.");
            continue;
          }

          // Call Server Action to record the file in event_files
          // Server Action re-validates mime_type (T-1-11 defense in depth)
          const result = await saveFilePath(eventId, {
            storage_path: storagePath,
            file_name: file.name,
            mime_type: file.type,
            checklist_item_id: checklistItemId,
            supplier_label: supplierLabel,
          });

          if (result.error) {
            toast.error(result.error);
            // Clean up the uploaded storage object if DB insert failed
            await supabase.storage.from("event-files").remove([storagePath]);
          } else {
            toast.success(`${file.name} uploaded successfully.`);
          }
        } catch {
          toast.error("Something went wrong. Please try again.");
        } finally {
          setUploading(false);
          setUploadingFileName(null);
        }
      }
    },
    [eventId, checklistItemId, supplierLabel]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_MAP,
    maxSize: MAX_FILE_BYTES,
    multiple: true,
    disabled: uploading,
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Drop zone — UI-SPEC: 96px min-height, dashed border, accent on drag-over */}
      <div
        {...getRootProps()}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors",
          "min-h-[96px]",
          isDragActive
            ? "border-[#BE3C5E] bg-[#BE3C5E]/5"
            : "border-border hover:border-muted-foreground",
          uploading ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            {/* Upload spinner */}
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#BE3C5E] border-t-transparent" />
            <p className="text-sm font-normal text-muted-foreground truncate max-w-xs">
              Uploading {uploadingFileName}…
            </p>
          </div>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            {/* UI-SPEC §Files Page: exact drop zone instruction copy */}
            <p className="text-base font-normal text-foreground text-center">
              Drag and drop a file here, or click to browse
            </p>
            {/* UI-SPEC §Files Page: exact hint copy */}
            <p className="text-sm font-normal text-muted-foreground">
              PDF, JPG, or PNG — up to 10 MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}
