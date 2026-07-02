import { createAmsSupabaseServerClient } from "@/lib/ams/server";
import { readFile } from "fs/promises";
import path from "path";

export type ValdProfileMapRow = {
  amsId?: string;
  valdProfileId?: string;
  tenantId?: string;
  syncId?: string | null;
  externalId?: string | null;
  matchMethod?: string | null;
  confidence?: number | null;
  reviewRequired?: boolean | null;
};

export async function readValdProfileMap(): Promise<ValdProfileMapRow[]> {
  const supabaseRows = await readValdProfileMapFromSupabase();
  if (supabaseRows?.length) return supabaseRows;

  return readValdProfileMapFromLocalFiles();
}

async function readValdProfileMapFromSupabase() {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("ams_vald_profile_map")
      .select("payload")
      .order("ams_id", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []).map((row) => row.payload as ValdProfileMapRow);
    return rows.length ? rows : null;
  } catch (error) {
    console.warn("Supabase VALD profile map unavailable.", error);
    return null;
  }
}

export function profileMapFromRows(rows: ValdProfileMapRow[]) {
  return new Map(
    rows
      .filter((row) => row.valdProfileId)
      .map((row) => [row.valdProfileId as string, row]),
  );
}

export function profileIdsFromRows(rows: ValdProfileMapRow[], requestedProfileId: string | null) {
  if (requestedProfileId) return [requestedProfileId];

  return rows
    .map((row) => row.valdProfileId)
    .filter((id): id is string => Boolean(id));
}

export function amsIdForValdProfile(profileId: string, profileMap: Map<string, ValdProfileMapRow>) {
  return profileMap.get(profileId)?.amsId ?? (profileId ? `VALD-${profileId}` : undefined);
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += limit) {
    const chunk = items.slice(index, index + limit);
    results.push(...await Promise.all(chunk.map(mapper)));
  }

  return results;
}

async function readValdProfileMapFromLocalFiles() {
  const confirmedRows = await readConfirmedLocalProfileMap();
  const suggestedRows = await readSuggestedLocalProfileMap();
  const rowsByProfileId = new Map<string, ValdProfileMapRow>();

  for (const row of [...suggestedRows, ...confirmedRows]) {
    if (!row.valdProfileId) continue;
    rowsByProfileId.set(row.valdProfileId, row);
  }

  return Array.from(rowsByProfileId.values());
}

async function readConfirmedLocalProfileMap() {
  const rows = await readLocalCsv("public/ams/data/clean/vald_profile_map.csv");

  return rows
    .map((row): ValdProfileMapRow => ({
      amsId: cleanCsvValue(row.amsId),
      valdProfileId: cleanCsvValue(row.valdProfileId),
      tenantId: cleanCsvValue(row.tenantId),
      syncId: cleanCsvValue(row.syncId),
      externalId: cleanCsvValue(row.externalId),
      matchMethod: cleanCsvValue(row.matchMethod),
      confidence: numberOrNull(row.confidence),
      reviewRequired: booleanOrNull(row.reviewRequired),
    }))
    .filter((row) => row.amsId && row.valdProfileId);
}

async function readSuggestedLocalProfileMap() {
  const rows = await readLocalCsv("public/ams/data/clean/vald_profiles_review.csv");

  return rows
    .map((row): ValdProfileMapRow => ({
      amsId: cleanCsvValue(row.suggestedAmsId),
      valdProfileId: cleanCsvValue(row.profileId),
      tenantId: cleanCsvValue(row.tenantId),
      syncId: cleanCsvValue(row.syncId),
      externalId: cleanCsvValue(row.externalId),
      matchMethod: cleanCsvValue(row.suggestedMatchMethod) || "suggested_profile_review",
      confidence: row.suggestedAmsId ? 0.75 : null,
      reviewRequired: booleanOrNull(row.reviewRequired) ?? true,
    }))
    .filter((row) => row.amsId && row.valdProfileId);
}

async function readLocalCsv(relativePath: string) {
  try {
    const csv = await readFile(path.join(process.cwd(), relativePath), "utf8");
    return parseCsv(csv);
  } catch {
    return [];
  }
}

function parseCsv(csv: string) {
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
  const [headers, ...body] = rows;

  if (!headers?.length) return [];

  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function cleanCsvValue(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanOrNull(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes"].includes(text)) return true;
  if (["false", "0", "no"].includes(text)) return false;
  return null;
}
