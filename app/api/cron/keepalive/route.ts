import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * GET /api/cron/keepalive
 * Keep-alive endpoint for Supabase free-tier auto-pause prevention.
 * Called by Vercel Cron every 3 days (see vercel.json).
 *
 * Runs a trivial lightweight query (RESEARCH.md §Pitfall 7 — Supabase pauses after 1 week inactivity).
 * Uses service client because no user session is available in a cron context.
 * SUPABASE_SERVICE_ROLE_KEY is NEVER prefixed with NEXT_PUBLIC_ (T-1-06).
 */
export async function GET() {
  try {
    const supabase = createServiceClient()
    // Lightweight query — just confirms DB is alive
    const { error } = await supabase.from("profiles").select("id").limit(1)

    if (error) {
      console.error("[keepalive] DB query failed:", error.message)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[keepalive] Unexpected error:", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
