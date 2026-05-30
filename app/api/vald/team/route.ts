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
  type ClassifiedGroup,
  type ValdCategory,
  type ValdGroup,
  type ValdProfile,
} from "../_utils";

export const dynamic = "force-dynamic";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    const teamProfileIds = new Set(teamProfiles.map((profile) => profile.profileId).filter(Boolean));
    const groupsByProfileId = new Map<string, ClassifiedGroup[]>();

    for (const profileId of teamProfileIds) {
      groupsByProfileId.set(profileId as string, [team]);
    }

    for (const positionGroup of groups.filter((group) => group.kind === "position")) {
      const positionProfilesUrl = new URL("/profiles", profilesBaseUrl);
      positionProfilesUrl.searchParams.set("tenantId", tenantId);
      positionProfilesUrl.searchParams.set("groupId", positionGroup.id);

      await sleep(250);

      const payload = await fetchValdWithRetry(positionProfilesUrl, token);
      const profiles = listFromPayload<ValdProfile>(payload, "profiles");

      for (const profile of profiles) {
        if (!profile.profileId || !teamProfileIds.has(profile.profileId)) continue;

        groupsByProfileId.set(profile.profileId, [
          ...(groupsByProfileId.get(profile.profileId) ?? [team]),
          positionGroup,
        ]);
      }
    }

    const athletes = teamProfiles
      .filter((profile) => profile.profileId)
      .map((profile) => {
        const allGroups = groupsByProfileId.get(profile.profileId as string) ?? [team];

        return {
          id: profile.profileId as string,
          name: profileName(profile),
          birthDate: profile.dateOfBirth ?? "",
          externalId: profile.externalId ?? profile.syncId,
          email: profile.email,
          positions: allGroups.filter((group) => group.kind === "position"),
          groups: allGroups,
          teams: [team],
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
