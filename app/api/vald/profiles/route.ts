export const dynamic = "force-dynamic";

const VALD_AUTH_URL = "https://auth.prd.vald.com/oauth/token";
const VALD_PROFILES_URL = "https://prd-use-api-externalprofile.valdperformance.com/profiles";

function missingConfigResponse(missing: string[]) {
  return Response.json(
    {
      error: `Missing VALD configuration: ${missing.join(", ")}`,
    },
    { status: 500 },
  );
}

export async function GET() {
  const clientId = process.env.VALD_CLIENT_ID;
  const clientSecret = process.env.VALD_CLIENT_SECRET;
  const tenantId = process.env.VALD_TENANT_ID;
  const audience = process.env.VALD_AUDIENCE || "vald-api-external";
  const missing: string[] = [];

  if (!clientId) missing.push("VALD_CLIENT_ID");
  if (!clientSecret) missing.push("VALD_CLIENT_SECRET");
  if (!tenantId) missing.push("VALD_TENANT_ID");

  if (!clientId || !clientSecret || !tenantId) {
    return missingConfigResponse(missing);
  }

  try {
    const tokenRes = await fetch(VALD_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
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
      return Response.json(
        {
          error: "VALD authentication failed",
          status: tokenRes.status,
        },
        { status: 401 },
      );
    }

    const profilesUrl = new URL(VALD_PROFILES_URL);
    profilesUrl.searchParams.set("tenantId", tenantId);

    const apiRes = await fetch(profilesUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      cache: "no-store",
    });

    const data = await apiRes.json().catch(() => null);

    if (!apiRes.ok) {
      return Response.json(
        {
          error: "VALD profiles request failed",
          status: apiRes.status,
        },
        { status: apiRes.status },
      );
    }

    return Response.json(data);
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unexpected VALD profiles error",
      },
      { status: 500 },
    );
  }
}
