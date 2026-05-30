const VALD_AUTH_URL = "https://auth.prd.vald.com/oauth/token";

export const DEFAULT_TENANTS_BASE_URL = "https://prd-use-api-externaltenants.valdperformance.com";
export const DEFAULT_PROFILES_BASE_URL = "https://prd-use-api-externalprofile.valdperformance.com";

export type ValdCategory = {
  id?: string;
  name?: string;
  syncId?: string;
};

export type ValdGroup = {
  id?: string;
  name?: string;
  categoryId?: string;
  syncId?: string;
};

export type ValdProfile = {
  profileId?: string;
  syncId?: string;
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  externalId?: string;
  email?: string;
};

export type ClassifiedGroup = Required<Pick<ValdGroup, "id" | "name">> &
  Omit<ValdGroup, "id" | "name"> & {
    categoryName?: string;
    kind: "team" | "position" | "other";
  };

export function missingConfigResponse(missing: string[]) {
  return Response.json(
    { error: `Missing VALD configuration: ${missing.join(", ")}` },
    { status: 500 },
  );
}

export async function getAccessToken(): Promise<
  { error: Response; token: null } | { error: null; token: string }
> {
  const clientId = process.env.VALD_CLIENT_ID;
  const clientSecret = process.env.VALD_CLIENT_SECRET;
  const audience = process.env.VALD_AUDIENCE || "vald-api-external";
  const missing: string[] = [];

  if (!clientId) missing.push("VALD_CLIENT_ID");
  if (!clientSecret) missing.push("VALD_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return { error: missingConfigResponse(missing), token: null };
  }

  const tokenRes = await fetch(VALD_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience,
    }),
    cache: "no-store",
  });
  const tokenData = await tokenRes.json().catch(() => null);

  if (!tokenRes.ok || !tokenData?.access_token) {
    return {
      error: Response.json(
        { error: "VALD authentication failed", status: tokenRes.status },
        { status: 401 },
      ),
      token: null,
    };
  }

  return { error: null, token: String(tokenData.access_token) };
}

export async function fetchVald<T>(url: URL, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`VALD request failed (${res.status}) for ${url.pathname}`);
  }

  return data as T;
}

export async function fetchValdWithRetry<T>(url: URL, token: string, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);

    if (res.ok) return data as T;

    if (res.status !== 429 || attempt === retries) {
      throw new Error(`VALD request failed (${res.status}) for ${url.pathname}`);
    }

    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1200;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  throw new Error(`VALD request failed for ${url.pathname}`);
}

export function listFromPayload<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && Array.isArray((payload as Record<string, unknown>)[key])) {
    return (payload as Record<string, unknown>)[key] as T[];
  }
  return [];
}

function isPositionLike(groupName: string, categoryName: string) {
  const value = `${categoryName} ${groupName}`.toLowerCase();
  const terms = [
    "position",
    "role",
    "goalkeeper",
    "keeper",
    "centre back",
    "center back",
    "left back",
    "right back",
    "fullback",
    "wing back",
    "defender",
    "midfielder",
    "winger",
    "forward",
    "striker",
    " cb",
    " lb",
    " rb",
    " gk",
    " cm",
    " cdm",
    " cam",
    " lw",
    " rw",
    " st",
  ];

  return terms.some((term) => value.includes(term));
}

function isTeamLike(groupName: string, categoryName: string) {
  const category = categoryName.toLowerCase();
  const group = groupName.toLowerCase();

  if (isPositionLike(groupName, categoryName)) return false;

  return (
    category.includes("team") ||
    category.includes("squad") ||
    category.includes("club") ||
    category.includes("roster") ||
    group.includes("team") ||
    group.includes("squad")
  );
}

export function classifyGroups(groups: ValdGroup[], categories: ValdCategory[]) {
  const categoryNameById = new Map(
    categories
      .filter((category) => category.id && category.name)
      .map((category) => [category.id as string, category.name as string]),
  );

  const classified: ClassifiedGroup[] = groups
    .filter((group): group is Required<Pick<ValdGroup, "id" | "name">> & ValdGroup =>
      Boolean(group.id && group.name),
    )
    .map((group) => {
      const categoryName = categoryNameById.get(group.categoryId ?? "") ?? "";
      let kind: ClassifiedGroup["kind"] = "other";

      if (isPositionLike(group.name, categoryName)) kind = "position";
      else if (isTeamLike(group.name, categoryName)) kind = "team";

      return { ...group, id: group.id, name: group.name, categoryName, kind };
    });

  if (!classified.some((group) => group.kind === "team")) {
    return classified.map((group): ClassifiedGroup => ({
      ...group,
      kind: group.kind === "position" ? "position" : "team",
    }));
  }

  return classified;
}

export function profileName(profile: ValdProfile) {
  return [profile.givenName, profile.familyName].filter(Boolean).join(" ") || "Unknown Athlete";
}
