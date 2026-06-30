import { NextResponse } from "next/server";
import { loadPlayerMasterFromSupabase } from "@/lib/ams/server";

export async function GET() {
  try {
    const supabasePayload = await loadPlayerMasterFromSupabase();
    if (supabasePayload) {
      return NextResponse.json(supabasePayload, {
        headers: {
          "Cache-Control": `s-maxage=${supabasePayload.meta?.cacheSeconds ?? 60}, stale-while-revalidate=300`,
        },
      });
    }

    return NextResponse.json(
      { error: "Player master Supabase source unavailable." },
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load player master.",
      },
      { status: 500 },
    );
  }
}
