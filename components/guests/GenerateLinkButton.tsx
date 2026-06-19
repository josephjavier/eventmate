"use client";

/**
 * components/guests/GenerateLinkButton.tsx
 * Button that generates (or retrieves) the shareable RSVP link and copies it to clipboard.
 *
 * RSVP-03: Couple can generate a shareable RSVP link.
 * UI-SPEC §Guests Page:
 *   - CTA: "Generate RSVP Link"
 *   - After copy: "Copy Link" button label
 *   - Toast: "Link copied!" on successful copy
 */

import { useState } from "react";
import { toast } from "sonner";
import { Link2, Copy } from "lucide-react";
import { generateRsvpLink } from "@/app/actions/guests";
import { Button } from "@/components/ui/button";

interface GenerateLinkButtonProps {
  eventId: string;
}

export function GenerateLinkButton({ eventId }: GenerateLinkButtonProps) {
  const [rsvpUrl, setRsvpUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleGenerate() {
    setIsPending(true);
    try {
      const result = await generateRsvpLink(eventId);
      if (result.error) {
        toast.error(result.error, { duration: 6000 });
      } else if (result.url) {
        setRsvpUrl(result.url);
        await navigator.clipboard.writeText(result.url);
        // UI-SPEC: "Link copied!" toast
        toast.success("Link copied!", { duration: 4000 });
      }
    } finally {
      setIsPending(false);
    }
  }

  async function handleCopy() {
    if (!rsvpUrl) return;
    try {
      await navigator.clipboard.writeText(rsvpUrl);
      // UI-SPEC: "Link copied!" toast
      toast.success("Link copied!", { duration: 4000 });
    } catch {
      toast.error("Failed to copy link.", { duration: 6000 });
    }
  }

  if (rsvpUrl) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-md border border-border bg-muted px-3 py-2 text-sm font-normal text-muted-foreground truncate">
          {rsvpUrl}
        </div>
        {/* UI-SPEC: "Copy Link" button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label="Copy RSVP link"
          className="shrink-0"
        >
          <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
          Copy Link
        </Button>
      </div>
    );
  }

  return (
    // UI-SPEC: "Generate RSVP Link" CTA
    <Button
      variant="outline"
      onClick={handleGenerate}
      disabled={isPending}
      className="font-semibold"
    >
      <Link2 className="h-4 w-4 mr-2" aria-hidden="true" />
      {isPending ? "Generating..." : "Generate RSVP Link"}
    </Button>
  );
}
