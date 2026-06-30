import { NextResponse } from "next/server";
import { loadRehabServicesFromSupabase } from "@/lib/ams/server";
import type { RehabServicesApiPayload } from "@/lib/ams/types";

const cacheSeconds = 60;

export async function GET() {
  try {
    const supabasePayload = await loadRehabServicesFromSupabase();
    if (supabasePayload) {
      return NextResponse.json(supabasePayload, {
        headers: {
          "Cache-Control": `s-maxage=${supabasePayload.meta?.cacheSeconds ?? cacheSeconds}, stale-while-revalidate=300`,
        },
      });
    }

    return NextResponse.json(
      { error: "Rehab services Supabase source unavailable." } satisfies RehabServicesApiPayload,
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load rehab services.",
      },
      { status: 500 },
    );
  }
}
