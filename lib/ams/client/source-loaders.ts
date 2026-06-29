import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import { canAccessDomain, canAccessRawSources } from "@/lib/ams/auth-rules";
import { sampleGpsRows } from "@/lib/ams/content";
import { compactNumber, loadCsv, loadJson, numberValue } from "@/lib/ams/data";
import { amsSourcePaths } from "@/lib/ams/source-registry";
import type {
  BodyCompApiPayload,
  CleanGpsRow,
  FmsAssessmentRow,
  FmsExerciseScoreRow,
  InjuryApiPayload,
  InjuryRow,
  LoadSummary,
  PlayerMasterRow,
  PlayerMatchHistoryRow,
  PlayerSeasonHistoryRow,
  RehabServiceRow,
  SourceData,
  SyncAuditRow,
  ValdNordbordMetricRow,
  ValdNordbordTestRow,
  YBalanceAssessmentRow,
  YBalanceMetricRow,
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
    let rows = await loadJson<CleanGpsRow>(amsSourcePaths.currentRosterGps);
    let sourceLabel = "current-roster WIMU/GPS daily records";

    if (!rows.length) {
      rows = sampleGpsRows;
      sourceLabel = "sample WIMU/GPS records";
    }

    return summarizeGpsRows(rows, `Loaded ${compactNumber(rows.length)} ${sourceLabel}.`);
  } catch (error) {
    const rows: CleanGpsRow[] = sampleGpsRows;
    const status = error instanceof Error
      ? `Using sample WIMU/GPS records. Data feed unavailable: ${error.message}`
      : "Using sample WIMU/GPS records.";

    return summarizeGpsRows(rows, status);
  }
}

export async function loadAmsSourceData(role: AmsAuthRole = "technicalStaff") {
  const canViewMedical = canAccessDomain(role, "medical");
  const canViewPerformance = canAccessDomain(role, "performance");
  const canViewPlayerCare = canAccessDomain(role, "playerCare");
  const canViewRawSources = canAccessRawSources(role);

  const [
    injuryPayload,
    bodyComp,
    fms,
    fmsExerciseScores,
    yBalance,
    yBalanceMetrics,
    valdNordbordTests,
    valdNordbordMetrics,
    rehabServices,
    syncAudit,
    playerMaster,
    playerSeasonHistory,
    playerMatchHistory,
  ] = await Promise.all([
    canViewMedical ? loadInjurySource() : restrictedInjurySource(),
    canViewMedical || canViewPerformance ? loadBodyCompSource() : [],
    canViewPerformance ? loadJson<FmsAssessmentRow>(amsSourcePaths.fmsAssessments).catch(() => []) : [],
    canViewPerformance ? loadJson<FmsExerciseScoreRow>(amsSourcePaths.fmsExerciseScores).catch(() => []) : [],
    canViewPerformance ? loadJson<YBalanceAssessmentRow>(amsSourcePaths.yBalanceAssessments).catch(() => []) : [],
    canViewPerformance ? loadJson<YBalanceMetricRow>(amsSourcePaths.yBalanceMetrics).catch(() => []) : [],
    canViewPerformance ? loadJson<ValdNordbordTestRow>(amsSourcePaths.valdNordbordTests).catch(() => []) : [],
    canViewPerformance ? loadJson<ValdNordbordMetricRow>(amsSourcePaths.valdNordbordMetrics).catch(() => []) : [],
    canViewMedical || canViewPerformance || canViewPlayerCare ? loadJson<RehabServiceRow>(amsSourcePaths.rehabServices).catch(() => []) : [],
    canViewRawSources ? loadCsv<SyncAuditRow>(amsSourcePaths.syncAudit).catch(() => []) : [],
    loadJson<PlayerMasterRow>(amsSourcePaths.playerMaster).catch(() => []),
    loadJson<PlayerSeasonHistoryRow>(amsSourcePaths.playerSeasonHistory).catch(() => []),
    loadJson<PlayerMatchHistoryRow>(amsSourcePaths.playerMatchHistory).catch(() => []),
  ]);

  return {
    injuries: injuryPayload.rows,
    injuryLastSynced: injuryPayload.lastSynced,
    injurySourceLabel: injuryPayload.sourceLabel,
    bodyComp,
    fms,
    fmsExerciseScores,
    yBalance,
    yBalanceMetrics,
    valdNordbordTests,
    valdNordbordMetrics,
    rehabServices,
    syncAudit,
    playerMaster,
    playerSeasonHistory,
    playerMatchHistory,
    status: `Loaded ${compactNumber(injuryPayload.rows.length + bodyComp.length + fms.length + fmsExerciseScores.length + yBalance.length + yBalanceMetrics.length + valdNordbordTests.length + valdNordbordMetrics.length + rehabServices.length + syncAudit.length + playerMaster.length + playerSeasonHistory.length + playerMatchHistory.length)} clean module records.`,
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
