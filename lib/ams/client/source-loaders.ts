import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import { canAccessDomain, canAccessRawSources } from "@/lib/ams/auth-rules";
import { sampleGpsRows } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { amsSourcePaths } from "@/lib/ams/source-registry";
import type {
  BodyCompApiPayload,
  CleanGpsRow,
  InjuryApiPayload,
  InjuryRow,
  LoadSummary,
  PlayerHistoryApiPayload,
  PlayerMasterApiPayload,
  RehabServicesApiPayload,
  SourceData,
  SyncAuditApiPayload,
  SyncAuditRow,
  TestingApiPayload,
  ValdNordbordApiPayload,
} from "@/lib/ams/types";

type ClientInjurySource = {
  rows: InjuryRow[];
  lastSynced?: string;
  sourceLabel?: string;
};

export const initialLoadSummary: LoadSummary = {
  rows: [],
  totalDistance: 0,
  highIntensity: 0,
  maxSpeed: 0,
  sessions: 0,
  status: "Loading WIMU/GPS feed...",
};

export const initialSourceData: SourceData = {
  injuries: [],
  bodyComp: [],
  fms: [],
  fmsExerciseScores: [],
  yBalance: [],
  yBalanceMetrics: [],
  externalTestAssessments: [],
  externalTestMetrics: [],
  externalTestScoringCriteria: [],
  mobilityScreenAssessments: [],
  mobilityScreenMetrics: [],
  musculoskeletalScreenAssessments: [],
  musculoskeletalScreenMetrics: [],
  musculoskeletalScreenScoringCriteria: [],
  valdNordbordTests: [],
  valdNordbordMetrics: [],
  rehabServices: [],
  syncAudit: [],
  playerMaster: [],
  playerSeasonHistory: [],
  playerMatchHistory: [],
  status: "Loading clean AMS modules...",
};

export async function loadAmsLoadSummary(role: AmsAuthRole = "technicalStaff") {
  if (!canAccessDomain(role, "performance")) {
    return {
      ...initialLoadSummary,
      status: "WIMU/GPS feed restricted for this role.",
    };
  }

  try {
    const response = await fetch("/api/ams/load", { cache: "no-store" });
    const payload = (await response.json()) as { summary?: LoadSummary; rows?: CleanGpsRow[]; error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load WIMU/GPS feed.");
    }

    if (payload.summary) return payload.summary;

    const rows = payload.rows ?? [];
    return summarizeGpsRows(rows, `Loaded ${compactNumber(rows.length)} WIMU/GPS daily records from Supabase.`);
  } catch (error) {
    const rows: CleanGpsRow[] = sampleGpsRows;
    const status = error instanceof Error
      ? `Using sample WIMU/GPS records. Supabase feed unavailable: ${error.message}`
      : "Using sample WIMU/GPS records.";

    return summarizeGpsRows(rows, status);
  }
}

export async function loadAmsSourceData(role: AmsAuthRole = "technicalStaff") {
  const canViewMedical = canAccessDomain(role, "medical");
  const canViewPerformance = canAccessDomain(role, "performance");
  const canViewPlayerCare = canAccessDomain(role, "playerCare");
  const canViewBiography = canAccessDomain(role, "biography");
  const canViewTechnical = canAccessDomain(role, "technical");
  const canViewRawSources = canAccessRawSources(role);

  const [
    injuryPayload,
    bodyComp,
    testingPayload,
    valdNordbordPayload,
    rehabServices,
    syncAudit,
    playerMaster,
    playerHistoryPayload,
  ] = await Promise.all([
    canViewMedical ? loadInjurySource() : restrictedInjurySource(),
    canViewMedical || canViewPerformance ? loadBodyCompSource() : [],
    canViewPerformance ? loadTestingSource() : emptyTestingSource(),
    canViewPerformance ? loadValdNordbordSource() : emptyValdNordbordSource(),
    canViewMedical || canViewPerformance || canViewPlayerCare ? loadRehabServicesSource() : [],
    canViewRawSources ? loadSyncAuditSource() : [],
    loadPlayerMasterSource(),
    canViewBiography || canViewPerformance || canViewTechnical ? loadPlayerHistorySource() : emptyPlayerHistorySource(),
  ]);
  const fms = testingPayload.fms ?? [];
  const fmsExerciseScores = testingPayload.fmsExerciseScores ?? [];
  const yBalance = testingPayload.yBalance ?? [];
  const yBalanceMetrics = testingPayload.yBalanceMetrics ?? [];
  const externalTestAssessments = testingPayload.externalTestAssessments ?? [];
  const externalTestMetrics = testingPayload.externalTestMetrics ?? [];
  const externalTestScoringCriteria = testingPayload.externalTestScoringCriteria ?? [];
  const mobilityScreenAssessments = testingPayload.mobilityScreenAssessments ?? [];
  const mobilityScreenMetrics = testingPayload.mobilityScreenMetrics ?? [];
  const musculoskeletalScreenAssessments = testingPayload.musculoskeletalScreenAssessments ?? [];
  const musculoskeletalScreenMetrics = testingPayload.musculoskeletalScreenMetrics ?? [];
  const musculoskeletalScreenScoringCriteria = testingPayload.musculoskeletalScreenScoringCriteria ?? [];
  const valdNordbordTests = valdNordbordPayload.tests ?? [];
  const valdNordbordMetrics = valdNordbordPayload.metrics ?? [];
  const playerSeasonHistory = playerHistoryPayload.seasonHistory ?? [];
  const playerMatchHistory = playerHistoryPayload.matchHistory ?? [];

  return {
    injuries: injuryPayload.rows,
    injuryLastSynced: injuryPayload.lastSynced,
    injurySourceLabel: injuryPayload.sourceLabel,
    bodyComp,
    fms,
    fmsExerciseScores,
    yBalance,
    yBalanceMetrics,
    externalTestAssessments,
    externalTestMetrics,
    externalTestScoringCriteria,
    mobilityScreenAssessments,
    mobilityScreenMetrics,
    musculoskeletalScreenAssessments,
    musculoskeletalScreenMetrics,
    musculoskeletalScreenScoringCriteria,
    valdNordbordTests,
    valdNordbordMetrics,
    rehabServices,
    syncAudit,
    playerMaster,
    playerSeasonHistory,
    playerMatchHistory,
    status: `Loaded ${compactNumber(injuryPayload.rows.length + bodyComp.length + fms.length + fmsExerciseScores.length + yBalance.length + yBalanceMetrics.length + externalTestAssessments.length + externalTestMetrics.length + externalTestScoringCriteria.length + mobilityScreenAssessments.length + mobilityScreenMetrics.length + musculoskeletalScreenAssessments.length + musculoskeletalScreenMetrics.length + musculoskeletalScreenScoringCriteria.length + valdNordbordTests.length + valdNordbordMetrics.length + rehabServices.length + syncAudit.length + playerMaster.length + playerSeasonHistory.length + playerMatchHistory.length)} clean module records.`,
  } satisfies SourceData;
}

function restrictedInjurySource(): Promise<ClientInjurySource> {
  return Promise.resolve({
    rows: [],
    lastSynced: undefined,
    sourceLabel: "Restricted",
  });
}

function summarizeGpsRows(rows: CleanGpsRow[], status: string): LoadSummary {
  const totalDistance = rows.reduce(
    (total, row) => total + numberValue(row.totalDistance ?? row.total_distance_m),
    0,
  );
  const highIntensity = rows.reduce(
    (total, row) =>
      total +
      numberValue(row.high_intensity_m ?? row.highIntensityDistance ?? row.hsrAbsDistance),
    0,
  );
  const maxSpeed = rows.reduce(
    (peak, row) => Math.max(peak, numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed)),
    0,
  );

  return {
    rows,
    totalDistance,
    highIntensity,
    maxSpeed,
    sessions: rows.length,
    status,
  };
}

async function loadInjurySource(): Promise<ClientInjurySource> {
  try {
    const response = await fetch("/api/ams/injuries", { cache: "no-store" });
    const payload = (await response.json()) as InjuryApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load injury history.");
    }

    return {
      rows: payload.rows ?? [],
      lastSynced: payload.meta?.lastSynced,
      sourceLabel: payload.meta?.sourceLabel ?? "Published Google Sheet",
    };
  } catch {
    return {
      rows: [],
      lastSynced: undefined,
      sourceLabel: "Unavailable",
    };
  }
}

async function loadBodyCompSource() {
  try {
    const response = await fetch(amsSourcePaths.bodyComp, { cache: "no-store" });
    const payload = (await response.json()) as BodyCompApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load body composition.");
    }

    return payload.rows ?? [];
  } catch {
    return [];
  }
}

async function loadPlayerMasterSource() {
  try {
    const response = await fetch(amsSourcePaths.playerMaster, { cache: "no-store" });
    const payload = (await response.json()) as PlayerMasterApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load player master.");
    }

    return payload.rows ?? [];
  } catch {
    return [];
  }
}

async function loadRehabServicesSource() {
  try {
    const response = await fetch(amsSourcePaths.rehabServices, { cache: "no-store" });
    const payload = (await response.json()) as RehabServicesApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load rehab services.");
    }

    return payload.rows ?? [];
  } catch {
    return [];
  }
}

function emptyPlayerHistorySource(): PlayerHistoryApiPayload {
  return {
    seasonHistory: [],
    matchHistory: [],
  };
}

async function loadPlayerHistorySource() {
  try {
    const response = await fetch("/api/ams/player-history", { cache: "no-store" });
    const payload = (await response.json()) as PlayerHistoryApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load player history.");
    }

    return payload;
  } catch {
    return emptyPlayerHistorySource();
  }
}

function emptyValdNordbordSource(): ValdNordbordApiPayload {
  return {
    tests: [],
    metrics: [],
  };
}

async function loadValdNordbordSource() {
  try {
    const response = await fetch("/api/ams/vald-nordbord", { cache: "no-store" });
    const payload = (await response.json()) as ValdNordbordApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load VALD NordBord source.");
    }

    return payload;
  } catch {
    return emptyValdNordbordSource();
  }
}

async function loadSyncAuditSource(): Promise<SyncAuditRow[]> {
  try {
    const response = await fetch(amsSourcePaths.syncAudit, { cache: "no-store" });
    const payload = (await response.json()) as SyncAuditApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load sync audit.");
    }

    return payload.rows ?? [];
  } catch {
    return [];
  }
}

function emptyTestingSource(): TestingApiPayload {
  return {
    fms: [],
    fmsExerciseScores: [],
    yBalance: [],
    yBalanceMetrics: [],
    externalTestAssessments: [],
    externalTestMetrics: [],
    externalTestScoringCriteria: [],
    mobilityScreenAssessments: [],
    mobilityScreenMetrics: [],
    musculoskeletalScreenAssessments: [],
    musculoskeletalScreenMetrics: [],
    musculoskeletalScreenScoringCriteria: [],
  };
}

async function loadTestingSource() {
  try {
    const response = await fetch("/api/ams/testing", { cache: "no-store" });
    const payload = (await response.json()) as TestingApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load testing source.");
    }

    return payload;
  } catch {
    return emptyTestingSource();
  }
}
