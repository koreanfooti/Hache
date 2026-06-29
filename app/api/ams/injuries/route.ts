import { NextResponse } from "next/server";
import {
  getInjuryHistoryFromGoogleSheet,
  loadInjuryHistoryFromSupabase,
} from "@/lib/ams/server";

export async function GET() {
  try {
    const supabasePayload = await loadInjuryHistoryFromSupabase();
    if (supabasePayload) {
      return NextResponse.json(supabasePayload, {
        headers: {
          "Cache-Control": `s-maxage=${supabasePayload.meta?.cacheSeconds ?? 60}, stale-while-revalidate=300`,
        },
      });
    }

    const payload = await getInjuryHistoryFromGoogleSheet();

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": `s-maxage=${payload.meta.cacheSeconds}, stale-while-revalidate=300`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load injury history.",
      },
      { status: 500 },
    );
  }
}
