import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { loadValdNordbordFromSupabase } from "@/lib/ams/server";
import type { ValdNordbordApiPayload, ValdNordbordMetricRow, ValdNordbordTestRow } from "@/lib/ams/types";

const cacheSeconds = 60;

export async function GET(request: Request) {
  try {
    const supabasePayload = await loadValdNordbordFromSupabase();
    const payload = supabasePayload ?? await loadLocalValdNordbordPayload();

    if (payload) {
      return NextResponse.json(payloadForSource(payload, new URL(request.url).searchParams.get("source")), {
        headers: {
          "Cache-Control": `s-maxage=${payload.meta?.cacheSeconds ?? cacheSeconds}, stale-while-revalidate=300`,
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

async function loadLocalValdNordbordPayload(): Promise<ValdNordbordApiPayload | null> {
  const [tests, metrics] = await Promise.all([
    readLocalJsonRows<ValdNordbordTestRow>("public/ams/data/clean/vald_nordbord_tests.json"),
    readLocalJsonRows<ValdNordbordMetricRow>("public/ams/data/clean/vald_nordbord_test_metrics.json"),
  ]);

  if (!tests.length && !metrics.length) return null;

  return {
    tests,
    metrics,
    meta: {
      sourceLabel: "Local cleaned VALD NordBord files",
      lastSynced: new Date().toISOString(),
      rowCount: tests.length + metrics.length,
      rowCounts: {
        tests: tests.length,
        metrics: metrics.length,
      },
      cacheSeconds,
    },
  };
}

async function readLocalJsonRows<T>(relativePath: string): Promise<T[]> {
  try {
    const json = await readFile(path.join(process.cwd(), relativePath), "utf8");
    const payload = JSON.parse(json) as unknown;
    return Array.isArray(payload) ? payload as T[] : [];
  } catch {
    return [];
  }
}

function payloadForSource(payload: ValdNordbordApiPayload, source: string | null): ValdNordbordApiPayload {
  if (source === "tests") {
    return {
      tests: payload.tests ?? [],
      metrics: [],
      meta: {
        ...payload.meta,
        rowCount: payload.tests?.length ?? 0,
        rowCounts: { tests: payload.tests?.length ?? 0, metrics: 0 },
      },
    };
  }

  if (source === "metrics") {
    return {
      tests: [],
      metrics: payload.metrics ?? [],
      meta: {
        ...payload.meta,
        rowCount: payload.metrics?.length ?? 0,
        rowCounts: { tests: 0, metrics: payload.metrics?.length ?? 0 },
      },
    };
  }

  return payload;
}
