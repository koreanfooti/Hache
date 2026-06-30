import { NextResponse } from "next/server";
import { loadValdNordbordFromSupabase } from "@/lib/ams/server";
import type { ValdNordbordApiPayload } from "@/lib/ams/types";

const cacheSeconds = 60;

export async function GET() {
  try {
    const supabasePayload = await loadValdNordbordFromSupabase();
    if (supabasePayload) {
      return NextResponse.json(supabasePayload, {
        headers: {
          "Cache-Control": `s-maxage=${supabasePayload.meta?.cacheSeconds ?? cacheSeconds}, stale-while-revalidate=300`,
        },
      });
    }

    return NextResponse.json(
      { error: "VALD NordBord Supabase source unavailable." } satisfies ValdNordbordApiPayload,
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load VALD NordBord data.",
      },
      { status: 500 },
    );
  }
}
