"use client";

/**
 * components/files/FileCard.tsx
 * Individual file card with download (signed URL) and delete actions.
 *
 * UI-SPEC §Files Page:
 *   - File card: file type icon + filename (truncated) + tag + upload date
 *   - Download: calls getSignedUrl then opens the URL
 *   - Delete: confirm Dialog with exact UI-SPEC delete copy
 *   - Delete file confirmation heading: "Delete this file?"
 *   - Delete file confirmation body: "This action cannot be undone."
 *   - Delete file confirm button: "Delete File"
 * UI-SPEC §Interaction Contracts (Accessibility — Icon-Only Buttons):
 *   - All icon-only buttons must have aria-label matching the action
 *   - aria-label="Download file", aria-label="Delete file"
 *
 * FILE-03: Download via signed URL (not public URL — bucket is private).
 * T-1-04: Never expose direct bucket URLs; always use getSignedUrl.
 */

import { useState } from "react";
import { Download, Trash2, FileText, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSignedUrl, deleteFile } from "@/app/actions/files";

export interface FileCardProps {
  id: string;
  file_name: string;
  mime_type: string | null;
  uploaded_at: string;
  supplier_label: string | null;
  checklist_item_id: string | null;
  storage_path: string;
}

/** Maps MIME type to the appropriate lucide-react icon. */
function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType === "application/pdf") {
    return <FileText className="h-8 w-8 text-red-500 shrink-0" />;
  }
  if (mimeType === "image/jpeg" || mimeType === "image/png") {
    return <ImageIcon className="h-8 w-8 text-blue-500 shrink-0" />;
  }
  return <File className="h-8 w-8 text-muted-foreground shrink-0" />;
}

export function FileCard({
  id,
  file_name,
  mime_type,
  uploaded_at,
  supplier_label,
  checklist_item_id,
}: FileCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // FILE-03: Download via signed URL (T-1-04: never use public URL)
  async function handleDownload() {
    setIsDownloading(true);
    try {
      const result = await getSignedUrl(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      // Open the signed URL in a new tab
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteFile(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${file_name} deleted.`);
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Derive tag display string
  const tagLabel = supplier_label || (checklist_item_id ? "Checklist item" : null);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 hover:border-muted-foreground transition-colors">
        {/* File type icon + filename */}
        <div className="flex items-start gap-3">
          <FileIcon mimeType={mime_type} />
          <div className="flex-1 min-w-0">
            {/* Truncated filename */}
            <p
              className="text-sm font-semibold text-foreground truncate"
              title={file_name}
            >
              {file_name}
            </p>
            {/* Upload date */}
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              {format(new Date(uploaded_at), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Tag (supplier label or checklist item indicator) */}
        {tagLabel && (
          <div className="px-2 py-0.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground w-fit max-w-full truncate">
            {/* UI-SPEC §Files Page: "Tag to" label */}
            Tag: {tagLabel}
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-end gap-1 mt-1">
          {/* Download button — icon-only, aria-label required (UI-SPEC §Accessibility) */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="Download file"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-8 w-8 p-0"
          >
            {isDownloading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#BE3C5E] border-t-transparent" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>

          {/* Delete button — icon-only, aria-label required (UI-SPEC §Accessibility) */}
          <Button
            variant="ghost"
            size="sm"
            aria-label="Delete file"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog — UI-SPEC §Files Page: exact locked copy */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            {/* UI-SPEC: "Delete this file?" */}
            <DialogTitle>Delete this file?</DialogTitle>
            {/* UI-SPEC: "This action cannot be undone." */}
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            {/* UI-SPEC: "Delete File" */}
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Delete File"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
