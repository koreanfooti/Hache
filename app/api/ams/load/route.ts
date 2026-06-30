import { NextRequest, NextResponse } from "next/server";
import { loadGpsRouteDataFromSupabase } from "@/lib/ams/server";

export async function GET(request: NextRequest) {
  try {
    const payload = await loadGpsRouteDataFromSupabase(request.nextUrl.searchParams);
    if (payload) return NextResponse.json(payload);

    return NextResponse.json(
      { error: "WIMU/GPS Supabase source unavailable." },
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load WIMU/GPS data.",
      },
      { status: 500 },
    );
  }
}
