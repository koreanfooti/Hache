import { readFile } from "fs/promises";
import path from "path";

export type ValdProfileMapRow = {
  amsId?: string;
  valdProfileId?: string;
  tenantId?: string;
};

export async function readValdProfileMap(): Promise<ValdProfileMapRow[]> {
  const mapPath = path.join(process.cwd(), "public", "ams", "data", "clean", "vald_profile_map.json");

  try {
    const file = await readFile(mapPath, "utf8");
    const rows = JSON.parse(file) as unknown;

    return Array.isArray(rows) ? rows as ValdProfileMapRow[] : [];
  } catch {
    return [];
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
