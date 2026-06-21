import { NextResponse } from "next/server";
import { getInjuryHistoryFromGoogleSheet } from "@/lib/ams/server";

export async function GET() {
  try {
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
