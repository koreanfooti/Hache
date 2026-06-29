import type { SupabaseClient } from "@supabase/supabase-js";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { CleanGpsRow, LoadSummary } from "@/lib/ams/types";
import { createAmsSupabaseServerClient } from "./supabase";

const ALL_TEAMS = "__all__";
const DEFAULT_TEAM = "Atlas Primer Equipo";
const DEFAULT_WINDOW_DAYS = 90;
const PAGE_SIZE = 1000;

export async function loadGpsRouteDataFromSupabase(params: URLSearchParams) {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const selectedTeam = params.get("team") || DEFAULT_TEAM;
    const teamFilter = selectedTeam === ALL_TEAMS ? undefined : selectedTeam;
    const teams = await loadGpsTeams(supabase);
    const totalRows = await countGpsRows(supabase);
    const bounds = await loadDateBounds(supabase, teamFilter) ?? await loadDateBounds(supabase);
    if (!bounds) throw new Error("No Supabase GPS rows available.");
    const requestedFrom = params.get("dateFrom") || "";
    const requestedTo = params.get("dateTo") || "";
    const dateTo = requestedTo || bounds.max;
    const dateFrom = requestedFrom || defaultDateFrom(dateTo, bounds.min);
    const rows = await loadGpsRows(supabase, {
      dateFrom,
      dateTo,
      team: teamFilter,
    });
    const summary = summarizeGpsRows(rows, `Loaded ${compactNumber(rows.length)} filtered WIMU/GPS daily records from Supabase.`);

    return {
      filters: {
        allTeamsValue: ALL_TEAMS,
        dateFrom,
        dateTo,
        defaultTeam: DEFAULT_TEAM,
        selectedTeam,
        teams,
        totalRows,
      },
      rows,
      summary,
    };
  } catch (error) {
    console.warn("Supabase GPS source unavailable; falling back to local CSV.", error);
    return null;
  }
}

async function loadGpsTeams(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("ams_gps_teams")
    .select("team");

  if (error) throw error;
  return (data ?? [])
    .map((row) => String(row.team ?? ""))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

async function countGpsRows(supabase: SupabaseClient) {
  const { count, error } = await supabase
    .from("ams_gps_player_daily")
    .select("import_key", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

async function loadDateBounds(supabase: SupabaseClient, team?: string) {
  let minQuery = supabase
    .from("ams_gps_player_daily")
    .select("session_date")
    .not("session_date", "is", null)
    .order("session_date", { ascending: true })
    .limit(1);

  let maxQuery = supabase
    .from("ams_gps_player_daily")
    .select("session_date")
    .not("session_date", "is", null)
    .order("session_date", { ascending: false })
    .limit(1);

  if (team) {
    minQuery = minQuery.eq("team", team);
    maxQuery = maxQuery.eq("team", team);
  }

  const [minResult, maxResult] = await Promise.all([minQuery, maxQuery]);
  if (minResult.error) throw minResult.error;
  if (maxResult.error) throw maxResult.error;

  const min = String(minResult.data?.[0]?.session_date ?? "");
  const max = String(maxResult.data?.[0]?.session_date ?? "");
  if (!min && !max) return null;
  return { min, max };
}

async function loadGpsRows(
  supabase: SupabaseClient,
  filters: { dateFrom: string; dateTo: string; team?: string },
) {
  const rows: CleanGpsRow[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("ams_gps_player_daily")
      .select("payload")
      .order("session_date", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (filters.team) query = query.eq("team", filters.team);
    if (filters.dateFrom) query = query.gte("session_date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("session_date", filters.dateTo);

    const { data, error } = await query;
    if (error) throw error;

    const page = (data ?? []).map((row) => row.payload as CleanGpsRow);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

function defaultDateFrom(dateTo: string, minDate: string) {
  if (!dateTo) return minDate;
  const parsed = new Date(`${dateTo}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return minDate;
  parsed.setUTCDate(parsed.getUTCDate() - DEFAULT_WINDOW_DAYS);
  const fallback = parsed.toISOString().slice(0, 10);
  return minDate && fallback < minDate ? minDate : fallback;
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
