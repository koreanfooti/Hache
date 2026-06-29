import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { compactNumber, numberValue, parseCsv } from "@/lib/ams/data";
import { loadGpsRouteDataFromSupabase } from "@/lib/ams/server";
import type { CleanGpsRow, LoadSummary } from "@/lib/ams/types";

const ALL_TEAMS = "__all__";
const DEFAULT_TEAM = "Atlas Primer Equipo";
const DEFAULT_WINDOW_DAYS = 90;
const gpsFilePath = path.join(process.cwd(), "public/ams/data/clean/gps/gps_player_daily.csv");

let cachedRows: CleanGpsRow[] | null = null;
let cachedPromise: Promise<CleanGpsRow[]> | null = null;

export async function GET(request: NextRequest) {
  const supabasePayload = await loadGpsRouteDataFromSupabase(request.nextUrl.searchParams);
  if (supabasePayload) return NextResponse.json(supabasePayload);

  const rows = await loadGpsRows();
  const teams = uniqueTeams(rows);
  const params = request.nextUrl.searchParams;
  const selectedTeam = params.get("team") || DEFAULT_TEAM;
  const teamRows = selectedTeam === ALL_TEAMS
    ? rows
    : rows.filter((row) => row.team === selectedTeam);
  const bounds = dateBounds(teamRows.length ? teamRows : rows);
  const requestedFrom = params.get("dateFrom") || "";
  const requestedTo = params.get("dateTo") || "";
  const dateTo = requestedTo || bounds.max;
  const dateFrom = requestedFrom || defaultDateFrom(dateTo, bounds.min);
  const filteredRows = teamRows.filter((row) => rowInDateRange(row, dateFrom, dateTo));
  const serializedRows = filteredRows.map(serializeGpsRow);
  const summary = summarizeGpsRows(serializedRows, `Loaded ${compactNumber(serializedRows.length)} filtered WIMU/GPS daily records.`);

  return NextResponse.json({
    filters: {
      allTeamsValue: ALL_TEAMS,
      dateFrom,
      dateTo,
      defaultTeam: DEFAULT_TEAM,
      selectedTeam,
      teams,
      totalRows: rows.length,
    },
    rows: serializedRows,
    summary,
  });
}

async function loadGpsRows() {
  if (cachedRows) return cachedRows;
  cachedPromise ??= readFile(gpsFilePath, "utf8").then((text) => parseCsv(text) as CleanGpsRow[]);
  cachedRows = await cachedPromise;
  return cachedRows;
}

function uniqueTeams(rows: CleanGpsRow[]) {
  return [...new Set(rows.map((row) => row.team).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
}

function dateBounds(rows: CleanGpsRow[]) {
  const dates = rows.map((row) => normalizedDate(row.date)).filter(Boolean).sort();
  return {
    min: dates[0] ?? "",
    max: dates.at(-1) ?? "",
  };
}

function defaultDateFrom(dateTo: string, minDate: string) {
  if (!dateTo) return minDate;
  const parsed = new Date(`${dateTo}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return minDate;
  parsed.setUTCDate(parsed.getUTCDate() - DEFAULT_WINDOW_DAYS);
  const fallback = parsed.toISOString().slice(0, 10);
  return minDate && fallback < minDate ? minDate : fallback;
}

function rowInDateRange(row: CleanGpsRow, dateFrom: string, dateTo: string) {
  const date = normalizedDate(row.date);
  if (!date) return false;
  if (dateFrom && date < dateFrom) return false;
  if (dateTo && date > dateTo) return false;
  return true;
}

function normalizedDate(value: unknown) {
  return String(value ?? "").slice(0, 10);
}

function serializeGpsRow(row: CleanGpsRow): CleanGpsRow {
  return {
    ...row,
    accelerations: row.accelerations,
    amsId: row.amsId,
    cleanPlayerName: row.cleanPlayerName,
    date: row.date,
    decelerations: row.decelerations,
    highIntensityAccelerations: row.highIntensityAccelerations,
    highIntensityDecelerations: row.highIntensityDecelerations,
    high_intensity_m: row.high_intensity_m,
    hsrAbsDistance: row.hsrAbsDistance,
    hsrRelDistance: row.hsrRelDistance,
    isMatch: row.isMatch,
    max_speed_kmh: row.max_speed_kmh,
    maxSpeedKmh: row.maxSpeedKmh,
    minutes: row.minutes,
    playerLoad: row.playerLoad,
    rollupSourceTask: row.rollupSourceTask,
    sessionName: row.sessionName,
    session_type: row.session_type,
    sourcePlayerName: row.sourcePlayerName,
    sourceSessionId: row.sourceSessionId,
    sprintCount: row.sprintCount,
    sprintDistance: row.sprintDistance,
    team: row.team,
    total_distance_m: row.total_distance_m,
    totalDistance: row.totalDistance,
    wellnessDoms: row.wellnessDoms,
    wellnessFatigue: row.wellnessFatigue,
    wellnessMood: row.wellnessMood,
    wellnessSleep: row.wellnessSleep,
    wellnessStress: row.wellnessStress,
    wimuPosition: row.wimuPosition,
    wimuShirtNumber: row.wimuShirtNumber,
  };
}

function summarizeGpsRows(rows: CleanGpsRow[], status: string): LoadSummary {
  const totalDistance = rows.reduce((total, row) => total + numberValue(row.totalDistance ?? row.total_distance_m), 0);
  const highIntensity = rows.reduce((total, row) => total + numberValue(row.hsrAbsDistance ?? row.highIntensityDistance ?? row.high_intensity_m), 0);
  const maxSpeed = rows.reduce((peak, row) => Math.max(peak, numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed)), 0);

  return {
    highIntensity,
    maxSpeed,
    rows,
    sessions: rows.length,
    status,
    totalDistance,
  };
}
