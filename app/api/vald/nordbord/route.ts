import { readFile } from "fs/promises";
import path from "path";
import {
  DEFAULT_NORDBORD_BASE_URL,
  fetchValdWithRetry,
  getAccessToken,
  missingConfigResponse,
} from "@/app/api/vald/_utils";
import type { ValdNordbordMetricRow, ValdNordbordTestRow } from "@/lib/ams/types";

export const dynamic = "force-dynamic";

type ValdProfileMapRow = {
  amsId?: string;
  valdProfileId?: string;
  tenantId?: string;
};

type ValdNordbordApiTest = {
  profileId?: string;
  athleteId?: string;
  testId?: string;
  modifiedDateUtc?: string;
  modifiedUtc?: string;
  testDateUtc?: string;
  testTypeId?: string;
  testTypeName?: string | null;
  notes?: string | null;
  device?: string | null;
  leftAvgForce?: number;
  leftImpulse?: number;
  leftMaxForce?: number;
  leftTorque?: number;
  leftCalibration?: number;
  leftRepetitions?: number;
  rightAvgForce?: number;
  rightImpulse?: number;
  rightMaxForce?: number;
  rightTorque?: number;
  rightCalibration?: number;
  rightRepetitions?: number;
};

type ValdNordbordTestsResponse = {
  tests?: ValdNordbordApiTest[];
};

type ValdNordbordRefreshPayload = {
  tests: ValdNordbordTestRow[];
  metrics: ValdNordbordMetricRow[];
  meta: {
    lastSynced: string;
    modifiedFromUtc: string;
    sourceLabel: string;
    profileCount: number;
    testCount: number;
    metricCount: number;
    unmappedCount: number;
  };
};

export async function GET(request: Request) {
  return refreshNordbord(request);
}

export async function POST(request: Request) {
  return refreshNordbord(request);
}

async function refreshNordbord(request: Request) {
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
      process.env.VALD_NORDBORD_MODIFIED_FROM_UTC ||
      "2020-01-01T00:00:00.000Z";
    const profileId = requestUrl.searchParams.get("profileId");
    const profileMapRows = await readValdProfileMap();
    const profileMap = new Map(
      profileMapRows
        .filter((row) => row.valdProfileId)
        .map((row) => [row.valdProfileId as string, row]),
    );
    const profileIds = profileId
      ? [profileId]
      : profileMapRows
        .map((row) => row.valdProfileId)
        .filter((id): id is string => Boolean(id));
    const tests = profileIds.length
      ? (await Promise.all(profileIds.map((id) => fetchNordbordTestsForProfile(id, tenantId, modifiedFromUtc, token)))).flat()
      : await fetchNordbordTestsForProfile(undefined, tenantId, modifiedFromUtc, token);
    const normalizedTests = dedupeTests(tests.map((test) => normalizeTest(test, tenantId, profileMap)));
    const metrics = await mapWithConcurrency(normalizedTests, 5, (test) => fetchNordbordMetrics(test, tenantId, token, profileMap));
    const payload: ValdNordbordRefreshPayload = {
      tests: normalizedTests.sort((a, b) => String(a.testDateUtc).localeCompare(String(b.testDateUtc))),
      metrics: metrics.filter(Boolean) as ValdNordbordMetricRow[],
      meta: {
        lastSynced: new Date().toISOString(),
        modifiedFromUtc,
        sourceLabel: "VALD NordBord API",
        profileCount: profileIds.length,
        testCount: normalizedTests.length,
        metricCount: metrics.filter(Boolean).length,
        unmappedCount: normalizedTests.filter((test) => !test.amsId || String(test.amsId).startsWith("VALD-")).length,
      },
    };

    return Response.json(payload);
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unexpected VALD NordBord refresh error",
      },
      { status: 500 },
    );
  }
}

async function fetchNordbordTestsForProfile(profileId: string | undefined, tenantId: string, modifiedFromUtc: string, token: string) {
  const nordbordBaseUrl = process.env.VALD_NORDBORD_BASE_URL || DEFAULT_NORDBORD_BASE_URL;
  const testsUrl = new URL("/tests/v2", nordbordBaseUrl);

  testsUrl.searchParams.set("TenantId", tenantId);
  testsUrl.searchParams.set("ModifiedFromUtc", modifiedFromUtc);
  if (profileId) testsUrl.searchParams.set("ProfileId", profileId);

  const payload = await fetchValdWithRetry<ValdNordbordTestsResponse>(testsUrl, token);

  return payload.tests ?? [];
}

async function fetchNordbordMetrics(
  test: ValdNordbordTestRow,
  tenantId: string,
  token: string,
  profileMap: Map<string, ValdProfileMapRow>,
) {
  if (!test.testId) return null;

  const nordbordBaseUrl = process.env.VALD_NORDBORD_BASE_URL || DEFAULT_NORDBORD_BASE_URL;
  const metricsUrl = new URL(`/tests/${test.testId}/metrics`, nordbordBaseUrl);

  metricsUrl.searchParams.set("tenantId", tenantId);

  const payload = await fetchValdWithRetry<Record<string, unknown>>(metricsUrl, token);
  const profileId = String(payload.athleteId || test.valdProfileId || "");
  const profileMapRow = profileMap.get(profileId);

  return {
    amsId: profileMapRow?.amsId ?? test.amsId,
    tenantId,
    valdProfileId: profileId || test.valdProfileId,
    ...payload,
    testId: String(payload.testId || test.testId),
  } satisfies ValdNordbordMetricRow;
}

function normalizeTest(test: ValdNordbordApiTest, tenantId: string, profileMap: Map<string, ValdProfileMapRow>) {
  const profileId = test.profileId ?? test.athleteId ?? "";
  const profileMapRow = profileMap.get(profileId);

  return {
    amsId: profileMapRow?.amsId ?? (profileId ? `VALD-${profileId}` : undefined),
    tenantId,
    valdProfileId: profileId,
    testId: test.testId,
    modifiedDateUtc: test.modifiedDateUtc ?? test.modifiedUtc,
    testDateUtc: test.testDateUtc,
    testTypeId: test.testTypeId,
    testTypeName: test.testTypeName ?? undefined,
    notes: test.notes,
    device: test.device ?? undefined,
    leftAvgForce: test.leftAvgForce,
    leftImpulse: test.leftImpulse,
    leftMaxForce: test.leftMaxForce,
    leftTorque: test.leftTorque,
    leftCalibration: test.leftCalibration,
    leftRepetitions: test.leftRepetitions,
    rightAvgForce: test.rightAvgForce,
    rightImpulse: test.rightImpulse,
    rightMaxForce: test.rightMaxForce,
    rightTorque: test.rightTorque,
    rightCalibration: test.rightCalibration,
    rightRepetitions: test.rightRepetitions,
  } satisfies ValdNordbordTestRow;
}

function dedupeTests(tests: ValdNordbordTestRow[]) {
  const testById = new Map<string, ValdNordbordTestRow>();

  for (const test of tests) {
    const key = test.testId || `${test.valdProfileId}-${test.testDateUtc}-${test.testTypeName}`;
    if (key) testById.set(String(key), test);
  }

  return Array.from(testById.values());
}

async function readValdProfileMap(): Promise<ValdProfileMapRow[]> {
  const mapPath = path.join(process.cwd(), "public", "ams", "data", "clean", "vald_profile_map.json");

  try {
    const file = await readFile(mapPath, "utf8");
    const rows = JSON.parse(file) as unknown;

    return Array.isArray(rows) ? rows as ValdProfileMapRow[] : [];
  } catch {
    return [];
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += limit) {
    const chunk = items.slice(index, index + limit);
    results.push(...await Promise.all(chunk.map(mapper)));
  }

  return results;
}
