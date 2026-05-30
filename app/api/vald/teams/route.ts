import {
  DEFAULT_TENANTS_BASE_URL,
  classifyGroups,
  fetchVald,
  getAccessToken,
  listFromPayload,
  missingConfigResponse,
  type ValdCategory,
  type ValdGroup,
} from "../_utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const tenantId = process.env.VALD_TENANT_ID;

  if (!tenantId) {
    return missingConfigResponse(["VALD_TENANT_ID"]);
  }

  try {
    const { error, token } = await getAccessToken();

    if (error) return error;

    const tenantsBaseUrl = process.env.VALD_TENANTS_BASE_URL || DEFAULT_TENANTS_BASE_URL;
    const tenantUrl = new URL(`/tenants/${tenantId}`, tenantsBaseUrl);
    const categoriesUrl = new URL("/categories", tenantsBaseUrl);
    const groupsUrl = new URL("/groups", tenantsBaseUrl);

    categoriesUrl.searchParams.set("tenantId", tenantId);
    groupsUrl.searchParams.set("tenantId", tenantId);

    const [tenant, categoriesPayload, groupsPayload] = await Promise.all([
      fetchVald(tenantUrl, token).catch(() => null),
      fetchVald(categoriesUrl, token),
      fetchVald(groupsUrl, token),
    ]);
    const categories = listFromPayload<ValdCategory>(categoriesPayload, "categories");
    const groups = classifyGroups(listFromPayload<ValdGroup>(groupsPayload, "groups"), categories);
    const teams = groups
      .filter((group) => group.kind === "team")
      .map((team) => ({
        ...team,
        athleteCount: null,
        athletes: [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      tenant,
      categories,
      groups,
      teams,
    });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unexpected VALD teams error",
      },
      { status: 500 },
    );
  }
}
