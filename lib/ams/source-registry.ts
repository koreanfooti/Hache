import { compactNumber } from "@/lib/ams/data";
import type { LoadSummary, SourceData } from "@/lib/ams/types";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export const amsSourcePaths = {
  syncAudit: "/ams/data/clean/sync_audit.csv",
  gpsDailyRollup: "/ams/data/clean/gps/gps_player_daily.csv",
  currentRosterGps: "/ams/data/clean/gps/gps_player_daily_current_roster.json",
  injuryHistory: "/api/ams/injuries",
  injuryFallback: "/ams/data/clean/injuries/injury_history_clean.json",
  bodyComp: "/ams/data/clean/body_comp/body_comp_clean.json",
  fmsAssessments: "/ams/data/clean/tests/fms_assessments_clean.json",
  fmsExerciseScores: "/ams/data/clean/tests/fms_exercise_scores_clean.json",
  yBalanceAssessments: "/ams/data/clean/tests/y_balance_assessments_clean.json",
  yBalanceMetrics: "/ams/data/clean/tests/y_balance_metrics_clean.json",
  valdNordbordTests: "/ams/data/clean/vald_nordbord_tests.json",
  valdNordbordMetrics: "/ams/data/clean/vald_nordbord_test_metrics.json",
  rehabServices: "/ams/data/clean/rehab_services/rehab_services_daily_clean.json",
  playerMaster: "/ams/data/clean/players_master.json",
  playerSeasonHistory: "/ams/data/clean/player_season_history.json",
  playerMatchHistory: "/ams/data/clean/player_match_history.json",
} as const;

type SourceCountContext = {
  loadSummary: LoadSummary;
  sourceData: SourceData;
};

export type AmsSourceDefinition = {
  key: Exclude<keyof typeof amsSourcePaths, "injuryFallback">;
  label: string;
  labelEs: string;
  path: string;
  kind: "api" | "csv" | "json";
  count?: (context: SourceCountContext) => number;
};

export const amsSourceDefinitions = [
  {
    key: "syncAudit",
    label: "Sync audit",
    labelEs: "Auditoría de sincronización",
    path: amsSourcePaths.syncAudit,
    kind: "csv",
    count: ({ sourceData }) => sourceData.syncAudit.length,
  },
  {
    key: "gpsDailyRollup",
    label: "GPS daily rollup",
    labelEs: "Resumen diario GPS",
    path: amsSourcePaths.gpsDailyRollup,
    kind: "csv",
  },
  {
    key: "currentRosterGps",
    label: "Current roster GPS",
    labelEs: "GPS de plantilla actual",
    path: amsSourcePaths.currentRosterGps,
    kind: "json",
    count: ({ loadSummary }) => loadSummary.rows.length,
  },
  {
    key: "injuryHistory",
    label: "Injury history",
    labelEs: "Historial de lesiones",
    path: amsSourcePaths.injuryHistory,
    kind: "api",
    count: ({ sourceData }) => sourceData.injuries.length,
  },
  {
    key: "bodyComp",
    label: "Body composition",
    labelEs: "Composición corporal",
    path: amsSourcePaths.bodyComp,
    kind: "json",
    count: ({ sourceData }) => sourceData.bodyComp.length,
  },
  {
    key: "fmsAssessments",
    label: "FMS assessments",
    labelEs: "Evaluaciones FMS",
    path: amsSourcePaths.fmsAssessments,
    kind: "json",
    count: ({ sourceData }) => sourceData.fms.length,
  },
  {
    key: "fmsExerciseScores",
    label: "FMS exercise scores",
    labelEs: "Puntajes de ejercicios FMS",
    path: amsSourcePaths.fmsExerciseScores,
    kind: "json",
    count: ({ sourceData }) => sourceData.fmsExerciseScores.length,
  },
  {
    key: "yBalanceAssessments",
    label: "Y Balance assessments",
    labelEs: "Evaluaciones Y Balance",
    path: amsSourcePaths.yBalanceAssessments,
    kind: "json",
    count: ({ sourceData }) => sourceData.yBalance.length,
  },
  {
    key: "yBalanceMetrics",
    label: "Y Balance metrics",
    labelEs: "Métricas Y Balance",
    path: amsSourcePaths.yBalanceMetrics,
    kind: "json",
    count: ({ sourceData }) => sourceData.yBalanceMetrics.length,
  },
  {
    key: "valdNordbordTests",
    label: "VALD NordBord tests",
    labelEs: "Pruebas VALD NordBord",
    path: amsSourcePaths.valdNordbordTests,
    kind: "json",
    count: ({ sourceData }) => sourceData.valdNordbordTests.length,
  },
  {
    key: "valdNordbordMetrics",
    label: "VALD NordBord metrics",
    labelEs: "Métricas VALD NordBord",
    path: amsSourcePaths.valdNordbordMetrics,
    kind: "json",
    count: ({ sourceData }) => sourceData.valdNordbordMetrics.length,
  },
  {
    key: "rehabServices",
    label: "Rehab services",
    labelEs: "Servicios de rehabilitación",
    path: amsSourcePaths.rehabServices,
    kind: "json",
    count: ({ sourceData }) => sourceData.rehabServices.length,
  },
  {
    key: "playerMaster",
    label: "Player master",
    labelEs: "Maestro de jugadores",
    path: amsSourcePaths.playerMaster,
    kind: "json",
    count: ({ sourceData }) => sourceData.playerMaster.length,
  },
  {
    key: "playerSeasonHistory",
    label: "Player season history",
    labelEs: "Historial de temporada",
    path: amsSourcePaths.playerSeasonHistory,
    kind: "json",
    count: ({ sourceData }) => sourceData.playerSeasonHistory.length,
  },
  {
    key: "playerMatchHistory",
    label: "Player match history",
    labelEs: "Historial de partidos",
    path: amsSourcePaths.playerMatchHistory,
    kind: "json",
    count: ({ sourceData }) => sourceData.playerMatchHistory.length,
  },
] as const satisfies readonly AmsSourceDefinition[];

export const dataSources = amsSourceDefinitions.map((source) => ({
  label: source.label,
  path: source.path,
}));

export function sourceDefinitionForPath(path: string) {
  return amsSourceDefinitions.find((source) => source.path === path);
}

export function localizedAmsSourceLabel(source: AmsSourceDefinition | string, language: AmsLanguage) {
  if (typeof source !== "string") {
    return language === "es" ? source.labelEs : source.label;
  }

  if (language === "en") return source;
  return amsSourceDefinitions.find((definition) => definition.label === source)?.labelEs ?? source;
}

export function amsSourceRecordLabel(
  source: AmsSourceDefinition,
  context: SourceCountContext,
  language: AmsLanguage,
) {
  const count = source.count?.(context);

  if (typeof count !== "number") {
    return language === "es" ? "Disponible para vista previa" : "Available for preview";
  }

  if (source.key === "injuryHistory" && context.sourceData.injuryLastSynced) {
    return `${compactNumber(count)} ${language === "es" ? "registros" : "records"} · ${
      language === "es" ? "sincronizado" : "synced"
    } ${formatLastSynced(context.sourceData.injuryLastSynced, language)}`;
  }

  return `${compactNumber(count)} ${language === "es" ? "registros cargados" : "loaded records"}`;
}

function formatLastSynced(value: string, language: AmsLanguage) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
