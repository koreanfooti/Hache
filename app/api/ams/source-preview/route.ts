import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { parseCsv } from "@/lib/ams/data";
import {
  getInjuryHistoryFromGoogleSheet,
  loadBodyCompositionFromSupabase,
  loadInjuryHistoryFromSupabase,
} from "@/lib/ams/server";
import {
  amsSourceDefinitions,
  sourceDefinitionForPath,
  type AmsSourceDefinition,
} from "@/lib/ams/source-registry";

const MAX_ROWS = 50;
const allowedSourcePaths: ReadonlySet<string> = new Set(amsSourceDefinitions.map((source) => source.path));

type RawRow = Record<string, unknown>;

export async function GET(request: NextRequest) {
  const sourcePath = request.nextUrl.searchParams.get("path") ?? "";
  const source = sourceDefinitionForPath(sourcePath);

  if (!source || !allowedSourcePaths.has(sourcePath)) {
    return NextResponse.json({ error: "Unknown source path." }, { status: 404 });
  }

  if (source.kind === "api") {
    return previewApiSource(source);
  }

  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.resolve(publicDir, sourcePath.replace(/^\/+/, ""));

  if (!filePath.startsWith(publicDir)) {
    return NextResponse.json({ error: "Source path is outside public data." }, { status: 400 });
  }

  try {
    if (sourcePath.endsWith(".csv")) {
      const lines = await readCsvHead(filePath, MAX_ROWS + 1);
      const rows = parseCsv(lines.join("\n")).slice(0, MAX_ROWS);
      return NextResponse.json(toPreviewPayload(source, rows, true));
    }

    const payload = JSON.parse(await readFile(filePath, "utf8"));
    const rows = Array.isArray(payload) ? payload.slice(0, MAX_ROWS) : [payload];

    return NextResponse.json(toPreviewPayload(source, rows, Array.isArray(payload) && payload.length > MAX_ROWS, Array.isArray(payload) ? payload.length : 1));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to preview source.",
      },
      { status: 500 },
    );
  }
}

async function previewApiSource(source: AmsSourceDefinition) {
  try {
    if (source.key === "injuryHistory") {
      const payload = await loadInjuryHistoryFromSupabase() ?? await getInjuryHistoryFromGoogleSheet();
      const rows = (payload.rows ?? []).slice(0, MAX_ROWS) as RawRow[];
      return NextResponse.json(toPreviewPayload(source, rows, (payload.rows ?? []).length > MAX_ROWS, payload.rows?.length));
    }

    if (source.key === "bodyComp") {
      const payload = await loadBodyCompositionFromSupabase();
      if (!payload) {
        return NextResponse.json(
          { error: "Body composition Supabase source unavailable." },
          { status: 503 },
        );
      }

      const rows = payload.rows ?? [];
      return NextResponse.json(toPreviewPayload(source, rows.slice(0, MAX_ROWS), rows.length > MAX_ROWS, rows.length));
    }

    return NextResponse.json({ error: "Unsupported API source." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to preview source.",
      },
      { status: 500 },
    );
  }
}

function toPreviewPayload(source: AmsSourceDefinition, rows: RawRow[], truncated: boolean, totalRows?: number) {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return {
    label: source.label,
    path: source.path,
    columns,
    rows,
    rowCount: rows.length,
    totalRows,
    truncated,
  };
}

async function readCsvHead(filePath: string, maxLines: number) {
  const lines: string[] = [];
  let current = "";

  for await (const chunk of createReadStream(filePath, { encoding: "utf8" })) {
    current += chunk;
    const parts = current.split(/\r?\n/);
    current = parts.pop() ?? "";
    lines.push(...parts);

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines.slice(0, maxLines);
}
