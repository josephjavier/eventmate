/**
 * components/files/FileGrid.tsx
 * Grid layout for uploaded event files.
 *
 * UI-SPEC §Page-Level Layout Contracts (Files Page):
 *   - File grid: 3-column on desktop, 1-column on mobile
 * UI-SPEC §Files Page:
 *   - Each file card: file type icon + filename (truncated) + tag + upload date
 *     + download/delete actions (see FileCard)
 */

import { FileCard, type FileCardProps } from "@/components/files/FileCard";

interface FileGridProps {
  files: FileCardProps[];
}

export function FileGrid({ files }: FileGridProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    // UI-SPEC: 3-col desktop / 1-col mobile
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <FileCard key={file.id} {...file} />
      ))}
    </div>
  );
}
