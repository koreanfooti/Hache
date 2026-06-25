import {
  DEFAULT_FORCEFRAME_BASE_URL,
  fetchValdWithRetry,
  getAccessToken,
  missingConfigResponse,
} from "@/app/api/vald/_utils";
import {
  amsIdForValdProfile,
  mapWithConcurrency,
  profileIdsFromRows,
  profileMapFromRows,
  readValdProfileMap,
  type ValdProfileMapRow,
} from "@/app/api/vald/_profile-map";
import type {
  ValdForceFrameMetricRow,
  ValdForceFrameRepetitionRow,
  ValdForceFrameTestRow,
} from "@/lib/ams/types";

export const dynamic = "force-dynamic";

type ValdForceFrameApiTest = {
  profileId?: string;
  athleteId?: string;
  testId?: string;
  modifiedDateUtc?: string;
  testDateUtc?: string;
  testTypeId?: string;
  testTypeName?: string | null;
  testPositionId?: string;
  testPositionName?: string | null;
  notes?: string | null;
  device?: string | null;
} & Record<string, unknown>;

type ValdForceFrameTestsResponse = {
  tests?: ValdForceFrameApiTest[];
};

type ValdForceFrameRefreshPayload = {
  tests: ValdForceFrameTestRow[];
  metrics: ValdForceFrameMetricRow[];
  repetitions: ValdForceFrameRepetitionRow[];
  meta: {
    lastSynced: string;
    modifiedFromUtc: string;
    sourceLabel: string;
    profileCount: number;
    testCount: number;
    metricCount: number;
    repetitionCount: number;
    unmappedCount: number;
  };
};

export async function GET(request: Request) {
  return refreshForceFrame(request);
}

export async function POST(request: Request) {
  return refreshForceFrame(request);
}

async function refreshForceFrame(request: Request) {
  const tenantId = process.env.VALD_TENANT_ID;

  if (!tenantId) {
    return missingConfigResponse(["VALD_TENANT_ID"]);
  }

  try {
    const { error, token } = await getAccessToken();

    if (error) return error;

    const requestUrl = new URL(request.url);
    const modifiedFromUtc =
      requestUrl.searchParams.get("modifiedFromUtc") ||
      process.env.VALD_FORCEFRAME_MODIFIED_FROM_UTC ||
      "2020-01-01T00:00:00.000Z";
    const requestedProfileId = requestUrl.searchParams.get("profileId");
    const profileMapRows = await readValdProfileMap();
    const profileMap = profileMapFromRows(profileMapRows);
    const profileIds = profileIdsFromRows(profileMapRows, requestedProfileId);
    const tests = profileIds.length
      ? (await Promise.all(profileIds.map((profileId) => fetchForceFrameTestsForProfile(profileId, tenantId, modifiedFromUtc, token)))).flat()
      : await fetchForceFrameTestsForProfile(undefined, tenantId, modifiedFromUtc, token);
    const normalizedTests = dedupeTests(tests.map((test) => normalizeTest(test, tenantId, profileMap)));
    const metrics = await mapWithConcurrency(normalizedTests, 5, (test) => fetchForceFrameMetrics(test, tenantId, token, profileMap));
    const repetitionsByTest = await mapWithConcurrency(normalizedTests, 5, (test) => fetchForceFrameRepetitions(test, tenantId, token, profileMap));
    const repetitions = repetitionsByTest.flat();
    const payload: ValdForceFrameRefreshPayload = {
      tests: normalizedTests.sort((a, b) => String(a.testDateUtc).localeCompare(String(b.testDateUtc))),
      metrics: metrics.filter(Boolean) as ValdForceFrameMetricRow[],
      repetitions,
      meta: {
        lastSynced: new Date().toISOString(),
        modifiedFromUtc,
        sourceLabel: "VALD ForceFrame API",
        profileCount: profileIds.length,
        testCount: normalizedTests.length,
        metricCount: metrics.filter(Boolean).length,
        repetitionCount: repetitions.length,
        unmappedCount: normalizedTests.filter((test) => !test.amsId || String(test.amsId).startsWith("VALD-")).length,
      },
    };

    return Response.json(payload);
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unexpected VALD ForceFrame refresh error",
      },
      { status: 500 },
    );
  }
}

async function fetchForceFrameTestsForProfile(profileId: string | undefined, tenantId: string, modifiedFromUtc: string, token: string) {
  const forceFrameBaseUrl = process.env.VALD_FORCEFRAME_BASE_URL || DEFAULT_FORCEFRAME_BASE_URL;
  const testsUrl = new URL("/tests/v2", forceFrameBaseUrl);

  testsUrl.searchParams.set("TenantId", tenantId);
  testsUrl.searchParams.set("ModifiedFromUtc", modifiedFromUtc);
  if (profileId) testsUrl.searchParams.set("ProfileId", profileId);

  const payload = await fetchValdWithRetry<ValdForceFrameTestsResponse>(testsUrl, token);

  return payload.tests ?? [];
}

async function fetchForceFrameMetrics(
  test: ValdForceFrameTestRow,
  tenantId: string,
  token: string,
  profileMap: Map<string, ValdProfileMapRow>,
) {
  if (!test.testId) return null;

  const forceFrameBaseUrl = process.env.VALD_FORCEFRAME_BASE_URL || DEFAULT_FORCEFRAME_BASE_URL;
  const metricsUrl = new URL(`/tests/${test.testId}/metrics`, forceFrameBaseUrl);

  metricsUrl.searchParams.set("tenantId", tenantId);

  const payload = await fetchOptionalForceFrame<Record<string, unknown>>(metricsUrl, token);
  if (!payload) return null;

  const profileId = String(payload.athleteId || test.valdProfileId || "");

  return {
    amsId: amsIdForValdProfile(profileId, profileMap) ?? test.amsId,
    tenantId,
    valdProfileId: profileId || test.valdProfileId,
    ...payload,
    testId: String(payload.testId || test.testId),
  } satisfies ValdForceFrameMetricRow;
}

async function fetchForceFrameRepetitions(
  test: ValdForceFrameTestRow,
  tenantId: string,
  token: string,
  profileMap: Map<string, ValdProfileMapRow>,
) {
  if (!test.testId) return [];

  const forceFrameBaseUrl = process.env.VALD_FORCEFRAME_BASE_URL || DEFAULT_FORCEFRAME_BASE_URL;
  const repetitionsUrl = new URL(`/tests/${test.testId}/repetitions`, forceFrameBaseUrl);

  repetitionsUrl.searchParams.set("tenantId", tenantId);

  const payload = await fetchOptionalForceFrame<Record<string, unknown>[]>(repetitionsUrl, token);
  if (!payload?.length) return [];

  return payload.map((row) => ({
    amsId: amsIdForValdProfile(String(test.valdProfileId || ""), profileMap) ?? test.amsId,
    tenantId,
    valdProfileId: test.valdProfileId,
    ...row,
    testId: String(row.testId || test.testId),
  })) satisfies ValdForceFrameRepetitionRow[];
}

function normalizeTest(test: ValdForceFrameApiTest, tenantId: string, profileMap: Map<string, ValdProfileMapRow>) {
  const profileId = test.profileId ?? test.athleteId ?? "";

  return {
    amsId: amsIdForValdProfile(profileId, profileMap),
    tenantId,
    valdProfileId: profileId,
    ...test,
    testTypeName: test.testTypeName ?? undefined,
    testPositionName: test.testPositionName ?? undefined,
    device: test.device ?? undefined,
  } satisfies ValdForceFrameTestRow;
}

function dedupeTests(tests: ValdForceFrameTestRow[]) {
  const testById = new Map<string, ValdForceFrameTestRow>();

  for (const test of tests) {
    const key = test.testId || `${test.valdProfileId}-${test.testDateUtc}-${test.testTypeName}-${test.testPositionName}`;
    if (key) testById.set(String(key), test);
  }

  return Array.from(testById.values());
}

async function fetchOptionalForceFrame<T>(url: URL, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 204 || res.status === 404) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(`VALD ForceFrame request failed (${res.status}) for ${url.pathname}`);
  }

  return data as T;
}
