import {
  DEFAULT_PROFILES_BASE_URL,
  DEFAULT_TENANTS_BASE_URL,
  classifyGroups,
  fetchVald,
  fetchValdWithRetry,
  getAccessToken,
  listFromPayload,
  missingConfigResponse,
  profileName,
  type ValdCategory,
  type ValdGroup,
  type ValdProfile,
} from "../_utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tenantId = process.env.VALD_TENANT_ID;
  const teamId = new URL(request.url).searchParams.get("teamId");

  if (!tenantId) {
    return missingConfigResponse(["VALD_TENANT_ID"]);
  }

  if (!teamId) {
    return Response.json({ error: "Missing teamId" }, { status: 400 });
  }

  try {
    const { error, token } = await getAccessToken();

    if (error) return error;

    const tenantsBaseUrl = process.env.VALD_TENANTS_BASE_URL || DEFAULT_TENANTS_BASE_URL;
    const profilesBaseUrl = process.env.VALD_PROFILES_BASE_URL || DEFAULT_PROFILES_BASE_URL;
    const categoriesUrl = new URL("/categories", tenantsBaseUrl);
    const groupsUrl = new URL("/groups", tenantsBaseUrl);

    categoriesUrl.searchParams.set("tenantId", tenantId);
    groupsUrl.searchParams.set("tenantId", tenantId);

    const [categoriesPayload, groupsPayload] = await Promise.all([
      fetchVald(categoriesUrl, token),
      fetchVald(groupsUrl, token),
    ]);
    const categories = listFromPayload<ValdCategory>(categoriesPayload, "categories");
    const groups = classifyGroups(listFromPayload<ValdGroup>(groupsPayload, "groups"), categories);
    const team = groups.find((group) => group.id === teamId);

    if (!team) {
      return Response.json({ error: "Team group not found" }, { status: 404 });
    }

    const teamProfilesUrl = new URL("/profiles", profilesBaseUrl);
    teamProfilesUrl.searchParams.set("tenantId", tenantId);
    teamProfilesUrl.searchParams.set("groupId", team.id);

    const teamProfilesPayload = await fetchValdWithRetry(teamProfilesUrl, token);
    const teamProfiles = listFromPayload<ValdProfile>(teamProfilesPayload, "profiles");

    const athletes = teamProfiles
      .filter((profile) => profile.profileId)
      .map((profile) => {
        return {
          id: profile.profileId as string,
          name: profileName(profile),
          birthDate: profile.dateOfBirth ?? "",
          externalId: profile.externalId ?? profile.syncId,
          email: profile.email,
          positions: [],
          groups: [team],
          teams: [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({
      team: {
        ...team,
        athleteCount: athletes.length,
        athletes,
      },
    });
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unexpected VALD team roster error",
      },
      { status: 500 },
    );
  }
}
