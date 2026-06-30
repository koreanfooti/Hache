import { NextRequest, NextResponse } from "next/server";
import { loadTestingFromSupabase } from "@/lib/ams/server";
import type { TestingApiPayload } from "@/lib/ams/types";

export async function GET(request: NextRequest) {
  try {
    const supabasePayload = await loadTestingFromSupabase();
    if (supabasePayload) {
      const source = request.nextUrl.searchParams.get("source");
      const payload = source ? testingPayloadForSource(supabasePayload, source) : supabasePayload;

      if (!payload) {
        return NextResponse.json(
          { error: "Unknown testing source." },
          { status: 404 },
        );
      }

      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": `s-maxage=${supabasePayload.meta?.cacheSeconds ?? 60}, stale-while-revalidate=300`,
        },
      });
    }

    return NextResponse.json(
      { error: "Testing Supabase source unavailable." },
      { status: 503 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load testing data.",
      },
      { status: 500 },
    );
  }
}

function testingPayloadForSource(payload: TestingApiPayload, source: string): TestingApiPayload | null {
  if (source === "fms-assessments") {
    const rows = payload.fms ?? [];
    return withTestingRows(payload, { fms: rows }, { fms: rows.length });
  }

  if (source === "fms-exercise-scores") {
    const rows = payload.fmsExerciseScores ?? [];
    return withTestingRows(payload, { fmsExerciseScores: rows }, { fmsExerciseScores: rows.length });
  }

  if (source === "y-balance-assessments") {
    const rows = payload.yBalance ?? [];
    return withTestingRows(payload, { yBalance: rows }, { yBalance: rows.length });
  }

  if (source === "y-balance-metrics") {
    const rows = payload.yBalanceMetrics ?? [];
    return withTestingRows(payload, { yBalanceMetrics: rows }, { yBalanceMetrics: rows.length });
  }

  if (source === "external-test-assessments") {
    const rows = payload.externalTestAssessments ?? [];
    return withTestingRows(payload, { externalTestAssessments: rows }, { externalTestAssessments: rows.length });
  }

  if (source === "external-test-metrics") {
    const rows = payload.externalTestMetrics ?? [];
    return withTestingRows(payload, { externalTestMetrics: rows }, { externalTestMetrics: rows.length });
  }

  if (source === "external-test-scoring-criteria") {
    const rows = payload.externalTestScoringCriteria ?? [];
    return withTestingRows(payload, { externalTestScoringCriteria: rows }, { externalTestScoringCriteria: rows.length });
  }

  if (source === "mobility-screen-assessments") {
    const rows = payload.mobilityScreenAssessments ?? [];
    return withTestingRows(payload, { mobilityScreenAssessments: rows }, { mobilityScreenAssessments: rows.length });
  }

  if (source === "mobility-screen-metrics") {
    const rows = payload.mobilityScreenMetrics ?? [];
    return withTestingRows(payload, { mobilityScreenMetrics: rows }, { mobilityScreenMetrics: rows.length });
  }

  if (source === "musculoskeletal-screen-assessments") {
    const rows = payload.musculoskeletalScreenAssessments ?? [];
    return withTestingRows(payload, { musculoskeletalScreenAssessments: rows }, { musculoskeletalScreenAssessments: rows.length });
  }

  if (source === "musculoskeletal-screen-metrics") {
    const rows = payload.musculoskeletalScreenMetrics ?? [];
    return withTestingRows(payload, { musculoskeletalScreenMetrics: rows }, { musculoskeletalScreenMetrics: rows.length });
  }

  if (source === "musculoskeletal-screen-scoring-criteria") {
    const rows = payload.musculoskeletalScreenScoringCriteria ?? [];
    return withTestingRows(
      payload,
      { musculoskeletalScreenScoringCriteria: rows },
      { musculoskeletalScreenScoringCriteria: rows.length },
    );
  }

  return null;
}

function withTestingRows(
  payload: TestingApiPayload,
  rows: TestingApiPayload,
  rowCounts: NonNullable<NonNullable<TestingApiPayload["meta"]>["rowCounts"]>,
): TestingApiPayload {
  return {
    ...rows,
    meta: {
      sourceLabel: payload.meta?.sourceLabel,
      lastSynced: payload.meta?.lastSynced,
      rowCount: Object.values(rowCounts).reduce((total, value) => total + (value ?? 0), 0),
      rowCounts,
      cacheSeconds: payload.meta?.cacheSeconds,
    },
  };
}
