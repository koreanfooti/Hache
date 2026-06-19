import { type CSSProperties } from "react";
import { metricDefinitions, players } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type {
  BodyCompRow,
  FmsAssessmentRow,
  FmsExerciseScoreRow,
  InjuryRow,
  LoadSummary,
  RehabServiceRow,
  ValdNordbordMetricRow,
  ValdNordbordTestRow,
  YBalanceAssessmentRow,
  YBalanceMetricRow,
} from "@/lib/ams/source-types";
import {
  DataList,
  MetricCard,
  PanelIntro,
  TestingCard,
  localizedValue,
  type AmsLanguage,
} from "@/components/ams/ui/AmsUi";

type RecoveryCopy = Record<string, string | readonly string[]> & {
  kicker: string;
  title: string;
  copy: string;
};

export type DataPanelCopy = {
  common: Record<string, string>;
  load: Record<string, string>;
  injury: Record<string, string>;
  development: Record<string, string>;
  bodyComp: Record<string, string>;
  recovery: RecoveryCopy;
};

export function LoadPanel({
  copy,
  language,
  loadSummary,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  loadSummary: LoadSummary;
}) {
  const recentRows = [...loadSummary.rows]
    .filter((row) => row.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-10);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.load.kicker}
        title={copy.load.title}
        copy={copy.load.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.load.totalDistance} value={`${compactNumber(loadSummary.totalDistance)} m`} detail={`${compactNumber(loadSummary.sessions)} ${copy.common.sessions}`} />
        <MetricCard label={copy.load.highIntensity} value={`${compactNumber(loadSummary.highIntensity)} m`} detail={copy.load.absoluteRelativeExposure} />
        <MetricCard label={copy.load.maxSpeed} value={`${compactNumber(loadSummary.maxSpeed, 1)} km/h`} detail={copy.load.peakRecordedValue} />
        <MetricCard label={copy.load.dataStatus} value={localizedLoadStatus(loadSummary.status, language)} detail={copy.load.servedFromPublicData} />
      </section>
      <section className="chart-panel">
        <div className="panel-heading">
          <h3>{copy.load.recentTrend}</h3>
          <span>{copy.load.recentTrendSub}</span>
        </div>
        <div className="bar-chart">
          {recentRows.map((row, index) => {
            const distance = numberValue(row.totalDistance ?? row.total_distance_m);
            const height = Math.max(8, Math.min(100, distance / 120));
            return (
              <div key={`${row.date}-${index}`} style={{ "--bar-height": `${height}%` } as CSSProperties}>
                <span />
                <small>{row.date?.slice(5) || index + 1}</small>
              </div>
            );
          })}
        </div>
      </section>
      <section className="definition-grid">
        {metricDefinitions.map(([label, description, unit]) => {
          const metric = localizedMetricDefinition(label, description, unit, language);

          return (
            <article key={label}>
              <strong>{metric.label}</strong>
              <p>{metric.description}</p>
              <span>{metric.unit}</span>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export function InjuryPanel({
  copy,
  language,
  injuries,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  injuries: InjuryRow[];
}) {
  const totalDaysLost = injuries.reduce((total, injury) => total + numberValue(injury.totalDaysLost), 0);
  const latestInjuries = [...injuries]
    .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
    .slice(0, 8);
  const topRegion = mostCommon(injuries.map((injury) => injury.bodyRegion).filter(Boolean));

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.injury.kicker}
        title={copy.injury.title}
        copy={copy.injury.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.injury.injuryEvents} value={compactNumber(injuries.length)} detail={copy.injury.cleanInjuryRecords} />
        <MetricCard label={copy.injury.daysLost} value={compactNumber(totalDaysLost)} detail={copy.injury.totalUnavailableDays} />
        <MetricCard label={copy.injury.topRegion} value={topRegion || copy.common.pending} detail={copy.injury.mostFrequentRegion} />
        <MetricCard label={copy.injury.latestRecord} value={latestInjuries[0]?.startDate || copy.common.noData} detail={latestInjuries[0]?.playerName || copy.common.waitingForSource} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={copy.injury.latestRecords}
        subtitle={copy.injury.recentMedicalEvents}
        rows={latestInjuries.map((injury) => [
          injury.playerName || copy.common.unknownPlayer,
          injury.injuryType || copy.common.unclassified,
          injury.bodyRegion || copy.common.noRegion,
          injury.startDate || copy.common.noDate,
        ])}
      />
    </div>
  );
}

export function DevelopmentPanel({
  copy,
  language,
  fms,
  fmsExerciseScores,
  yBalance,
  yBalanceMetrics,
  valdNordbordTests,
  valdNordbordMetrics,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  fms: FmsAssessmentRow[];
  fmsExerciseScores: FmsExerciseScoreRow[];
  yBalance: YBalanceAssessmentRow[];
  yBalanceMetrics: YBalanceMetricRow[];
  valdNordbordTests: ValdNordbordTestRow[];
  valdNordbordMetrics: ValdNordbordMetricRow[];
}) {
  const latestFms = [...fms].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 6);
  const latestNordbord = [...valdNordbordTests]
    .sort((a, b) => String(b.testDateUtc).localeCompare(String(a.testDateUtc)))
    .slice(0, 6);
  const averageNordbordImbalance = average(
    valdNordbordTests.map((row) => {
      const left = numberValue(row.leftMaxForce);
      const right = numberValue(row.rightMaxForce);
      const peak = Math.max(left, right);
      return peak ? Math.abs(left - right) / peak * 100 : 0;
    }),
  );
  const flaggedFmsExercises = fmsExerciseScores.filter((row) => numberValue(row.pointScore) <= 1 || Boolean(row.asymmetryRaw)).length;

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.development.kicker}
        title={copy.development.title}
        copy={copy.development.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.development.fmsAssessments} value={compactNumber(fms.length)} detail={copy.development.movementRecords} />
        <MetricCard label="FMS exercise rows" value={compactNumber(fmsExerciseScores.length)} detail={`${compactNumber(flaggedFmsExercises)} priority/asymmetry flags`} />
        <MetricCard label={copy.development.yBalanceTests} value={compactNumber(yBalance.length)} detail={`${compactNumber(yBalanceMetrics.length)} metric rows`} />
        <MetricCard label="NordBord tests" value={compactNumber(valdNordbordTests.length)} detail={`${compactNumber(averageNordbordImbalance, 1)}% avg max-force asymmetry`} />
      </section>
      <section className="testing-grid">
        <TestingCard image="/ams/assets/testing/vald-logo.png" title={copy.development.valdDevices} copy={copy.development.valdCopy} />
        <TestingCard image="/ams/assets/testing/nordbord-logo.png" title="NordBord" copy={copy.development.nordbordCopy} />
        <TestingCard image="/ams/assets/testing/fms-logo.jpeg" title="FMS" copy={copy.development.fmsCopy} />
        <TestingCard image="/ams/assets/testing/ybt-logo.svg" title={copy.development.ybtTitle} copy={copy.development.ybtCopy} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={copy.development.latestFmsAssessments}
        subtitle={copy.development.cleanedMovementResults}
        rows={latestFms.map((row) => [
          row.matchedAthleteName || copy.common.unknownPlayer,
          row.dateIso || copy.common.noDate,
          String(row.totalScore ?? copy.common.noScore),
          row.scoreBand || row.riskFlag || copy.common.noFlag,
        ])}
      />
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title="Latest NordBord Tests"
        subtitle={`${compactNumber(valdNordbordMetrics.length)} VALD metric rows available`}
        rows={latestNordbord.map((row) => [
          playerNameForAmsId(row.amsId),
          formatShortDate(row.testDateUtc) || copy.common.noDate,
          row.testTypeName || "NordBord",
          `${compactNumber(numberValue(row.leftMaxForce), 1)} / ${compactNumber(numberValue(row.rightMaxForce), 1)} N`,
        ])}
      />
    </div>
  );
}

export function BodyCompositionPanel({
  copy,
  language,
  rows,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  rows: BodyCompRow[];
}) {
  const latestRows = [...rows]
    .sort((a, b) => String(b.testDate).localeCompare(String(a.testDate)))
    .slice(0, 8);
  const avgWeight = average(rows.map((row) => row.weightKg));
  const avgMuscle = average(rows.map((row) => row.muscleKg));
  const avgSkinfold = average(rows.map((row) => row.skinfold6));

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.bodyComp.kicker}
        title={copy.bodyComp.title}
        copy={copy.bodyComp.copy}
      />
      <section className="metric-grid">
        <MetricCard label={copy.bodyComp.records} value={compactNumber(rows.length)} detail={copy.bodyComp.cleanRows} />
        <MetricCard label={copy.bodyComp.avgWeight} value={`${compactNumber(avgWeight, 1)} kg`} detail={copy.bodyComp.acrossLoadedRecords} />
        <MetricCard label={copy.bodyComp.avgMuscle} value={`${compactNumber(avgMuscle, 1)} kg`} detail={copy.bodyComp.muscleEstimate} />
        <MetricCard label={copy.bodyComp.avgSkinfold} value={`${compactNumber(avgSkinfold, 1)} mm`} detail={copy.bodyComp.skinfoldSum} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={copy.bodyComp.latestRecords}
        subtitle={copy.bodyComp.recentDates}
        rows={latestRows.map((row) => [
          row.playerName || copy.common.unknownPlayer,
          row.category || copy.common.noGroup,
          row.testDate || copy.common.noDate,
          `${compactNumber(numberValue(row.weightKg), 1)} kg`,
        ])}
      />
    </div>
  );
}

export function RecoveryPanel({
  copy,
  language,
  rehabServices,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  rehabServices: RehabServiceRow[];
}) {
  const activeRows = rehabServices.filter((row) => !row.isOffDay);
  const totalServices = activeRows.reduce((total, row) => total + numberValue(row.count), 0);
  const serviceTypes = new Set(activeRows.map((row) => row.serviceName).filter(Boolean)).size;
  const latestRows = [...activeRows]
    .sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso)))
    .slice(0, 8);
  const topService = topBySummedCount(activeRows, (row) => row.serviceName);

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.recovery.kicker}
        title={copy.recovery.title}
        copy={copy.recovery.copy}
      />
      <section className="metric-grid">
        <MetricCard label={language === "es" ? "Registros" : "Records"} value={compactNumber(rehabServices.length)} detail={language === "es" ? "Filas limpias de servicios" : "Clean service rows"} />
        <MetricCard label={language === "es" ? "Total servicios" : "Total services"} value={compactNumber(totalServices)} detail={language === "es" ? "Suma de conteos diarios" : "Sum of daily counts"} />
        <MetricCard label={language === "es" ? "Tipos de servicio" : "Service types"} value={compactNumber(serviceTypes)} detail={language === "es" ? "Categorías activas" : "Active categories"} />
        <MetricCard label={language === "es" ? "Servicio principal" : "Top service"} value={topService || copy.common.noData} detail={language === "es" ? "Por volumen total" : "By total volume"} />
      </section>
      <DataList
        emptyLabel={copy.common.noRecords}
        language={language}
        title={language === "es" ? "Servicios recientes" : "Recent Recovery Services"}
        subtitle={language === "es" ? "Últimas filas limpias de rehabilitación" : "Latest cleaned rehab-service rows"}
        rows={latestRows.map((row) => [
          row.serviceName || copy.common.unclassified,
          row.dateIso || copy.common.noDate,
          compactNumber(numberValue(row.count)),
          row.source || "cleaned-source",
        ])}
      />
    </div>
  );
}

function localizedLoadStatus(status: string, language: AmsLanguage) {
  if (language === "en") return status;
  if (status.startsWith("Loaded")) {
    return status
      .replace("Loaded", "Cargados")
      .replace("current-roster WIMU/GPS daily records", "registros diarios WIMU/GPS de plantilla actual")
      .replace("sample WIMU/GPS records", "registros de muestra WIMU/GPS")
      .replace("clean module records", "registros limpios de módulos");
  }
  return localizedValue(status, language)
    .replace("Using sample WIMU/GPS records.", "Usando registros de muestra WIMU/GPS.")
    .replace("Data feed unavailable", "Feed de datos no disponible");
}

function localizedMetricDefinition(label: string, description: string, unit: string, language: AmsLanguage) {
  if (language === "en") return { label, description, unit };

  const definitions: Record<string, [string, string, string]> = {
    "Total distance": ["Distancia total", "Distancia total cubierta durante la sesión o ventana de fechas seleccionada.", "m"],
    "HSR absolute": ["HSR absoluto", "Distancia cubierta por encima del umbral absoluto HSR, por defecto 21 km/h.", "m"],
    "HSR relative": ["HSR relativo", "Distancia cubierta por encima del 75.5% de la velocidad máxima del jugador.", "m"],
    "Sprint absolute": ["Sprint absoluto", "Distancia cubierta por encima del umbral absoluto de sprint, por defecto 24 km/h.", "m"],
    "Sprint relative": ["Sprint relativo", "Distancia cubierta por encima del 95% de la velocidad máxima del jugador.", "m"],
    "High acceleration": ["Alta aceleración", "Conteo de aceleraciones de alta intensidad por encima de +3 m/s².", "conteo"],
    "High deceleration": ["Alta desaceleración", "Conteo de desaceleraciones de alta intensidad por debajo de -3 m/s².", "conteo"],
  };
  const translated = definitions[label];
  return translated ? { label: translated[0], description: translated[1], unit: translated[2] } : { label, description, unit };
}

function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value) && value > 0);
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function topBySummedCount<T>(rows: T[], labelForRow: (row: T) => string | undefined) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const label = String(labelForRow(row) ?? "").trim();
    if (!label) return;
    totals.set(label, (totals.get(label) ?? 0) + numberValue((row as { count?: unknown }).count));
  });

  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function mostCommon(values: unknown[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const key = String(value || "").trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function playerNameForAmsId(amsId: string | undefined) {
  return players.find((player) => player.amsId === amsId)?.name ?? amsId ?? "Unknown player";
}

function formatShortDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}
