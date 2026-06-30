import { compactNumber } from "@/lib/ams/data";
import type { LoadSummary, SourceData } from "@/lib/ams/types";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

export const amsSourcePaths = {
  syncAudit: "/api/ams/sync-audit",
  gpsDailyRollup: "/api/ams/load?source=daily-rollup",
  currentRosterGps: "/api/ams/load?source=current-roster",
  injuryHistory: "/api/ams/injuries",
  bodyComp: "/api/ams/body-composition",
  fmsAssessments: "/api/ams/testing?source=fms-assessments",
  fmsExerciseScores: "/api/ams/testing?source=fms-exercise-scores",
  yBalanceAssessments: "/api/ams/testing?source=y-balance-assessments",
  yBalanceMetrics: "/api/ams/testing?source=y-balance-metrics",
  externalTestAssessments: "/api/ams/testing?source=external-test-assessments",
  externalTestMetrics: "/api/ams/testing?source=external-test-metrics",
  externalTestScoringCriteria: "/api/ams/testing?source=external-test-scoring-criteria",
  mobilityScreenAssessments: "/api/ams/testing?source=mobility-screen-assessments",
  mobilityScreenMetrics: "/api/ams/testing?source=mobility-screen-metrics",
  musculoskeletalScreenAssessments: "/api/ams/testing?source=musculoskeletal-screen-assessments",
  musculoskeletalScreenMetrics: "/api/ams/testing?source=musculoskeletal-screen-metrics",
  musculoskeletalScreenScoringCriteria: "/api/ams/testing?source=musculoskeletal-screen-scoring-criteria",
  valdNordbordTests: "/api/ams/vald-nordbord?source=tests",
  valdNordbordMetrics: "/api/ams/vald-nordbord?source=metrics",
  rehabServices: "/api/ams/rehab-services",
  playerMaster: "/api/ams/player-master",
  playerSeasonHistory: "/api/ams/player-history?source=season",
  playerMatchHistory: "/api/ams/player-history?source=matches",
} as const;

type SourceCountContext = {
  loadSummary: LoadSummary;
  sourceData: SourceData;
};

export type AmsSourceDefinition = {
  key: keyof typeof amsSourcePaths;
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
    kind: "api",
    count: ({ sourceData }) => sourceData.syncAudit.length,
  },
  {
    key: "gpsDailyRollup",
    label: "GPS daily rollup",
    labelEs: "Resumen diario GPS",
    path: amsSourcePaths.gpsDailyRollup,
    kind: "api",
  },
  {
    key: "currentRosterGps",
    label: "Current roster GPS",
    labelEs: "GPS de plantilla actual",
    path: amsSourcePaths.currentRosterGps,
    kind: "api",
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
    kind: "api",
    count: ({ sourceData }) => sourceData.bodyComp.length,
  },
  {
    key: "fmsAssessments",
    label: "FMS assessments",
    labelEs: "Evaluaciones FMS",
    path: amsSourcePaths.fmsAssessments,
    kind: "api",
    count: ({ sourceData }) => sourceData.fms.length,
  },
  {
    key: "fmsExerciseScores",
    label: "FMS exercise scores",
    labelEs: "Puntajes de ejercicios FMS",
    path: amsSourcePaths.fmsExerciseScores,
    kind: "api",
    count: ({ sourceData }) => sourceData.fmsExerciseScores.length,
  },
  {
    key: "yBalanceAssessments",
    label: "Y Balance assessments",
    labelEs: "Evaluaciones Y Balance",
    path: amsSourcePaths.yBalanceAssessments,
    kind: "api",
    count: ({ sourceData }) => sourceData.yBalance.length,
  },
  {
    key: "yBalanceMetrics",
    label: "Y Balance metrics",
    labelEs: "Métricas Y Balance",
    path: amsSourcePaths.yBalanceMetrics,
    kind: "api",
    count: ({ sourceData }) => sourceData.yBalanceMetrics.length,
  },
  {
    key: "externalTestAssessments",
    label: "External test assessments",
    labelEs: "Evaluaciones externas",
    path: amsSourcePaths.externalTestAssessments,
    kind: "api",
    count: ({ sourceData }) => sourceData.externalTestAssessments.length,
  },
  {
    key: "externalTestMetrics",
    label: "External test metrics",
    labelEs: "Métricas externas",
    path: amsSourcePaths.externalTestMetrics,
    kind: "api",
    count: ({ sourceData }) => sourceData.externalTestMetrics.length,
  },
  {
    key: "externalTestScoringCriteria",
    label: "External test scoring criteria",
    labelEs: "Criterios externos",
    path: amsSourcePaths.externalTestScoringCriteria,
    kind: "api",
    count: ({ sourceData }) => sourceData.externalTestScoringCriteria.length,
  },
  {
    key: "mobilityScreenAssessments",
    label: "Mobility screen assessments",
    labelEs: "Evaluaciones de movilidad",
    path: amsSourcePaths.mobilityScreenAssessments,
    kind: "api",
    count: ({ sourceData }) => sourceData.mobilityScreenAssessments.length,
  },
  {
    key: "mobilityScreenMetrics",
    label: "Mobility screen metrics",
    labelEs: "Métricas de movilidad",
    path: amsSourcePaths.mobilityScreenMetrics,
    kind: "api",
    count: ({ sourceData }) => sourceData.mobilityScreenMetrics.length,
  },
  {
    key: "musculoskeletalScreenAssessments",
    label: "Musculoskeletal screen assessments",
    labelEs: "Evaluaciones musculoesqueléticas",
    path: amsSourcePaths.musculoskeletalScreenAssessments,
    kind: "api",
    count: ({ sourceData }) => sourceData.musculoskeletalScreenAssessments.length,
  },
  {
    key: "musculoskeletalScreenMetrics",
    label: "Musculoskeletal screen metrics",
    labelEs: "Métricas musculoesqueléticas",
    path: amsSourcePaths.musculoskeletalScreenMetrics,
    kind: "api",
    count: ({ sourceData }) => sourceData.musculoskeletalScreenMetrics.length,
  },
  {
    key: "musculoskeletalScreenScoringCriteria",
    label: "Musculoskeletal screen scoring criteria",
    labelEs: "Criterios musculoesqueléticos",
    path: amsSourcePaths.musculoskeletalScreenScoringCriteria,
    kind: "api",
    count: ({ sourceData }) => sourceData.musculoskeletalScreenScoringCriteria.length,
  },
  {
    key: "valdNordbordTests",
    label: "VALD NordBord tests",
    labelEs: "Pruebas VALD NordBord",
    path: amsSourcePaths.valdNordbordTests,
    kind: "api",
    count: ({ sourceData }) => sourceData.valdNordbordTests.length,
  },
  {
    key: "valdNordbordMetrics",
    label: "VALD NordBord metrics",
    labelEs: "Métricas VALD NordBord",
    path: amsSourcePaths.valdNordbordMetrics,
    kind: "api",
    count: ({ sourceData }) => sourceData.valdNordbordMetrics.length,
  },
  {
    key: "rehabServices",
    label: "Rehab services",
    labelEs: "Servicios de rehabilitación",
    path: amsSourcePaths.rehabServices,
    kind: "api",
    count: ({ sourceData }) => sourceData.rehabServices.length,
  },
  {
    key: "playerMaster",
    label: "Player master",
    labelEs: "Maestro de jugadores",
    path: amsSourcePaths.playerMaster,
    kind: "api",
    count: ({ sourceData }) => sourceData.playerMaster.length,
  },
  {
    key: "playerSeasonHistory",
    label: "Player season history",
    labelEs: "Historial de temporada",
    path: amsSourcePaths.playerSeasonHistory,
    kind: "api",
    count: ({ sourceData }) => sourceData.playerSeasonHistory.length,
  },
  {
    key: "playerMatchHistory",
    label: "Player match history",
    labelEs: "Historial de partidos",
    path: amsSourcePaths.playerMatchHistory,
    kind: "api",
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
