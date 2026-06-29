import type { SupabaseClient } from "@supabase/supabase-js";
import type { BodyCompApiPayload, BodyCompRow, InjuryApiPayload, InjuryRow } from "@/lib/ams/types";
import { createAmsSupabaseServerClient } from "./supabase";

const cacheSeconds = 60;

export async function loadInjuryHistoryFromSupabase(): Promise<InjuryApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const result = await loadPayloadRows<InjuryRow>(supabase, "ams_injury_history", "start_date");
    if (!result.rows.length) return null;

    return {
      rows: result.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount: result.count,
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase injury source unavailable.", error);
    return null;
  }
}

export async function loadBodyCompositionFromSupabase(): Promise<BodyCompApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const result = await loadPayloadRows<BodyCompRow>(supabase, "ams_body_composition", "test_date");
    if (!result.rows.length) return null;

    return {
      rows: result.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount: result.count,
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase body composition source unavailable.", error);
    return null;
  }
}

async function loadPayloadRows<T>(
  supabase: SupabaseClient,
  table: string,
  orderColumn: string,
) {
  const { data, error, count } = await supabase
    .from(table)
    .select("payload", { count: "exact" })
    .order(orderColumn, { ascending: false });

  if (error) throw error;

  return {
    count: count ?? data?.length ?? 0,
    rows: (data ?? []).map((row) => row.payload as T),
  };
}
