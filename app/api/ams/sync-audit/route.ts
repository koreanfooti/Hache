import { NextResponse } from "next/server";
import { loadSyncAuditFromSupabase } from "@/lib/ams/server";
import type { SyncAuditApiPayload } from "@/lib/ams/types";

const cacheSeconds = 60;

export async function GET() {
  try {
    const supabasePayload = await loadSyncAuditFromSupabase();
    if (supabasePayload) {
      return NextResponse.json(supabasePayload, {
        headers: {
          "Cache-Control": `s-maxage=${supabasePayload.meta?.cacheSeconds ?? cacheSeconds}, stale-while-revalidate=300`,
        },
      });
    }

    return NextResponse.json(
      { error: "Sync audit Supabase source unavailable." } satisfies SyncAuditApiPayload,
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load sync audit.",
      },
      { status: 500 },
    );
  }
}
