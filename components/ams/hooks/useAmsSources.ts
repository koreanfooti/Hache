"use client";

import { useEffect, useState } from "react";
import type { AmsAuthRole } from "@/lib/ams/auth-rules";
import { canAccessDomain, canAccessRawSources } from "@/lib/ams/auth-rules";
import { sampleGpsRows } from "@/lib/ams/content";
import { compactNumber, loadCsv, loadJson, numberValue } from "@/lib/ams/data";
import { amsSourcePaths } from "@/lib/ams/source-registry";
import type {
  BodyCompRow,
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
} from "@/lib/ams/source-types";

const initialLoadSummary: LoadSummary = {
  rows: [],
  totalDistance: 0,
  highIntensity: 0,
  maxSpeed: 0,
  sessions: 0,
  status: "Loading WIMU/GPS feed...",
};

const initialSourceData: SourceData = {
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

export function useAmsSources(role: AmsAuthRole = "technicalStaff") {
  const [loadSummary, setLoadSummary] = useState<LoadSummary>(initialLoadSummary);
  const [sourceData, setSourceData] = useState<SourceData>(initialSourceData);
  const canViewMedical = canAccessDomain(role, "medical");
  const canViewPerformance = canAccessDomain(role, "performance");
  const canViewPlayerCare = canAccessDomain(role, "playerCare");
  const canViewRawSources = canAccessRawSources(role);

  useEffect(() => {
    let cancelled = false;

    async function loadGps() {
      if (!canViewPerformance) {
        if (!cancelled) {
          setLoadSummary({
            ...initialLoadSummary,
            status: "WIMU/GPS feed restricted for this role.",
          });
        }
        return;
      }

      try {
        let rows = await loadJson<CleanGpsRow>(amsSourcePaths.currentRosterGps);
        let sourceLabel = "current-roster WIMU/GPS daily records";

        if (!rows.length) {
          rows = sampleGpsRows;
          sourceLabel = "sample WIMU/GPS records";
        }

        if (cancelled) return;
        setLoadSummary(summarizeGpsRows(rows, `Loaded ${compactNumber(rows.length)} ${sourceLabel}.`));
      } catch (error) {
        const rows: CleanGpsRow[] = sampleGpsRows;
        const status = error instanceof Error
          ? `Using sample WIMU/GPS records. Data feed unavailable: ${error.message}`
          : "Using sample WIMU/GPS records.";

        if (!cancelled) setLoadSummary(summarizeGpsRows(rows, status));
      }
    }

    loadGps();
    return () => {
      cancelled = true;
    };
  }, [canViewPerformance]);

  useEffect(() => {
    let cancelled = false;

    async function loadModules() {
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
        canViewMedical || canViewPerformance ? loadJson<BodyCompRow>(amsSourcePaths.bodyComp).catch(() => []) : [],
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

      if (cancelled) return;

      setSourceData({
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
      });
    }

    loadModules();
    return () => {
      cancelled = true;
    };
  }, [canViewMedical, canViewPerformance, canViewPlayerCare, canViewRawSources]);

  return { loadSummary, sourceData };
}

function restrictedInjurySource() {
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

async function loadInjurySource() {
  try {
    const response = await fetch("/api/ams/injuries", { cache: "no-store" });
    const payload = (await response.json()) as InjuryApiPayload;

    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load Google Sheets injury history.");
    }

    return {
      rows: payload.rows ?? [],
      lastSynced: payload.meta?.lastSynced,
      sourceLabel: payload.meta?.sourceLabel ?? "Published Google Sheet",
    };
  } catch {
    const fallbackRows = await loadJson<InjuryRow>(amsSourcePaths.injuryFallback).catch(() => []);

    return {
      rows: fallbackRows,
      lastSynced: undefined,
      sourceLabel: "Local fallback",
    };
  }
}
