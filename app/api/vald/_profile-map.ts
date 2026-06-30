import { createAmsSupabaseServerClient } from "@/lib/ams/server";

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
  return supabaseRows ?? [];
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
