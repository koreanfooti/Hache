import { NextResponse } from "next/server";
import { loadPlayerHistoryFromSupabase } from "@/lib/ams/server";
import type { PlayerHistoryApiPayload } from "@/lib/ams/types";

const cacheSeconds = 60;

export async function GET() {
  try {
    const supabasePayload = await loadPlayerHistoryFromSupabase();
    if (supabasePayload) {
      return NextResponse.json(supabasePayload, {
        headers: {
          "Cache-Control": `s-maxage=${supabasePayload.meta?.cacheSeconds ?? cacheSeconds}, stale-while-revalidate=300`,
        },
      });
    }

    return NextResponse.json(
      { error: "Player history Supabase source unavailable." } satisfies PlayerHistoryApiPayload,
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load player history.",
      },
      { status: 500 },
    );
  }
}
