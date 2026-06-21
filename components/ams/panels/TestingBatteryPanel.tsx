import Image from "next/image";
import { useState } from "react";
import { players } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type {
  FmsAssessmentRow,
  FmsExerciseScoreRow,
  ValdNordbordMetricRow,
  ValdNordbordTestRow,
  YBalanceAssessmentRow,
  YBalanceMetricRow,
} from "@/lib/ams/types";
import {
  DataList,
  MetricCard,
  type AmsLanguage,
} from "@/components/ams/ui/AmsUi";
import { NordbordDashboard } from "@/components/ams/panels/NordbordDashboard";

type TestingCategory = "vald" | "fms" | "yBalance" | "cod" | "yoyo";
type ValdDevice = "nordbord" | "forceframe" | "forcedecks";
type SelectedValdDevice = ValdDevice | "none";

type TestingBatteryCopy = {
  common: Record<string, string>;
  development: Record<string, string>;
};

type TestingBatteryPanelProps = {
  copy: TestingBatteryCopy;
  language: AmsLanguage;
  fms: FmsAssessmentRow[];
  fmsExerciseScores: FmsExerciseScoreRow[];
  yBalance: YBalanceAssessmentRow[];
  yBalanceMetrics: YBalanceMetricRow[];
  valdNordbordTests: ValdNordbordTestRow[];
  valdNordbordMetrics: ValdNordbordMetricRow[];
};

type TestingCategoryCardData = {
  copy: string;
  eyebrow: string;
  id: TestingCategory;
  image?: string;
  label?: string;
  stat: string;
  title: string;
};

type ValdDeviceCardData = {
  copy: string;
  id: ValdDevice;
  image?: string;
  label?: string;
  stat: string;
  title: string;
};

export function TestingBatteryPanel({
  copy,
  language,
  fms,
  fmsExerciseScores,
  yBalance,
  yBalanceMetrics,
  valdNordbordTests,
  valdNordbordMetrics,
}: TestingBatteryPanelProps) {
  const labels = testingLabels(language);
  const [selectedCategory, setSelectedCategory] = useState<TestingCategory>("vald");
  const [selectedValdDevice, setSelectedValdDevice] = useState<SelectedValdDevice>("nordbord");
  const flaggedFmsExercises = fmsExerciseScores.filter((row) => numberValue(row.pointScore) <= 1 || Boolean(row.asymmetryRaw)).length;
  const categories: TestingCategoryCardData[] = [
    {
      copy: copy.development.valdCopy ?? labels.valdCopy,
      eyebrow: labels.deviceFamily,
      id: "vald",
      image: "/ams/assets/testing/vald-logo.png",
      stat: `${compactNumber(valdNordbordTests.length)} ${labels.mappedTests}`,
      title: "VALD",
    },
    {
      copy: copy.development.fmsCopy ?? labels.fmsCopy,
      eyebrow: labels.screening,
      id: "fms",
      image: "/ams/assets/testing/fms-logo.jpeg",
      stat: `${compactNumber(fms.length)} ${copy.common.records}`,
      title: "FMS",
    },
    {
      copy: copy.development.ybtCopy ?? labels.yBalanceCopy,
      eyebrow: labels.screening,
      id: "yBalance",
      image: "/ams/assets/testing/ybt-logo.svg",
      stat: `${compactNumber(yBalance.length)} ${copy.common.tests}`,
      title: labels.yBalanceTitle,
    },
    {
      copy: copy.development.codCopy ?? labels.codCopy,
      eyebrow: labels.movement,
      id: "cod",
      label: "COD",
      stat: copy.common.waitingForSource,
      title: labels.codTitle,
    },
    {
      copy: copy.development.yoyoCopy ?? labels.yoyoCopy,
      eyebrow: labels.aerobic,
      id: "yoyo",
      label: "YY",
      stat: copy.common.waitingForSource,
      title: labels.yoyoTitle,
    },
  ];

  return (
    <section className="testing-battery-page">
      <div className="panel-heading">
        <div>
          <h3>{copy.development.valdTesting ?? labels.testingBattery}</h3>
          <span>{copy.development.valdTestingSub ?? labels.testingBatterySub}</span>
        </div>
      </div>

      <section className="testing-category-grid" aria-label={labels.testCategories}>
        {categories.map((category) => (
          <TestingCategoryCard
            isActive={selectedCategory === category.id}
            key={category.id}
            category={category}
            onClick={() => setSelectedCategory(category.id)}
          />
        ))}
      </section>

      {selectedCategory === "vald" ? (
        <ValdCategoryPanel
          copy={copy}
          language={language}
          labels={labels}
          metrics={valdNordbordMetrics}
          selectedValdDevice={selectedValdDevice}
          setSelectedValdDevice={setSelectedValdDevice}
          tests={valdNordbordTests}
        />
      ) : null}

      {selectedCategory === "fms" ? (
        <FmsTestingDashboard
          copy={copy}
          exercises={fmsExerciseScores}
          flaggedFmsExercises={flaggedFmsExercises}
          labels={labels}
          language={language}
          rows={fms}
        />
      ) : null}

      {selectedCategory === "yBalance" ? (
        <YBalanceTestingDashboard
          copy={copy}
          labels={labels}
          language={language}
          metrics={yBalanceMetrics}
          rows={yBalance}
        />
      ) : null}

      {selectedCategory === "cod" ? (
        <TestingPlaceholderDashboard
          copy={copy}
          labels={labels}
          title={labels.codDashboard}
          subtitle={labels.movement}
          body={copy.development.codCopy ?? labels.codCopy}
          chips={["505", labels.braking, labels.acceleration, labels.roleDemand]}
        />
      ) : null}

      {selectedCategory === "yoyo" ? (
        <TestingPlaceholderDashboard
          copy={copy}
          labels={labels}
          title={labels.yoyoDashboard}
          subtitle={labels.aerobic}
          body={copy.development.yoyoCopy ?? labels.yoyoCopy}
          chips={[labels.capacity, labels.recovery, labels.distance, labels.thresholds]}
        />
      ) : null}
    </section>
  );
}

function TestingCategoryCard({
  category,
  isActive,
  onClick,
}: {
  category: TestingCategoryCardData;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={isActive ? "testing-category-card is-active" : "testing-category-card"}
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
    >
      <span className="testing-category-media">
        {category.image ? (
          <Image src={category.image} alt={`${category.title} logo`} width={142} height={86} />
        ) : (
          <i>{category.label}</i>
        )}
      </span>
      <span className="testing-category-copy">
        <small>{category.eyebrow}</small>
        <strong>{category.title}</strong>
        <em>{category.stat}</em>
        <span>{category.copy}</span>
      </span>
    </button>
  );
}

function ValdCategoryPanel({
  copy,
  language,
  labels,
  metrics,
  selectedValdDevice,
  setSelectedValdDevice,
  tests,
}: {
  copy: TestingBatteryCopy;
  language: AmsLanguage;
  labels: ReturnType<typeof testingLabels>;
  metrics: ValdNordbordMetricRow[];
  selectedValdDevice: SelectedValdDevice;
  setSelectedValdDevice: (device: SelectedValdDevice) => void;
  tests: ValdNordbordTestRow[];
}) {
  const deviceCards: ValdDeviceCardData[] = [
    {
      copy: copy.development.nordbordCopy ?? labels.nordbordCopy,
      id: "nordbord",
      image: "/ams/assets/testing/nordbord-logo.png",
      stat: `${compactNumber(tests.length)} ${copy.common.tests}`,
      title: "NordBord",
    },
    {
      copy: copy.development.forceframeCopy ?? labels.forceframeCopy,
      id: "forceframe",
      label: "02",
      stat: copy.common.pending,
      title: "ForceFrame",
    },
    {
      copy: copy.development.forcedecksCopy ?? labels.forcedecksCopy,
      id: "forcedecks",
      label: "03",
      stat: copy.common.pending,
      title: "ForceDecks",
    },
  ];

  return (
    <section className="testing-category-detail">
      <div className="testing-brand-card">
        <Image src="/ams/assets/testing/vald-logo.png" alt="VALD logo" width={190} height={86} />
        <div>
          <strong>VALD</strong>
          <p>{copy.development.valdCopy ?? labels.valdCopy}</p>
        </div>
      </div>

      <section className="vald-device-grid" aria-label={labels.valdDevices}>
        {deviceCards.map((device) => (
          <ValdDeviceCard
            device={device}
            isActive={selectedValdDevice === device.id}
            key={device.id}
            onClick={() => setSelectedValdDevice(selectedValdDevice === device.id ? "none" : device.id)}
          />
        ))}
      </section>

      {selectedValdDevice === "nordbord" ? (
        <NordbordDashboard
          copy={copy}
          language={language}
          metrics={metrics}
          tests={tests}
        />
      ) : null}

      {selectedValdDevice === "forceframe" ? (
        <TestingPlaceholderDashboard
          copy={copy}
          labels={labels}
          title="ForceFrame"
          subtitle={labels.isometricDashboard}
          body={copy.development.forceframeCopy ?? labels.forceframeCopy}
          chips={[labels.hipGroin, labels.shoulder, labels.trunk, labels.isometricPeak]}
        />
      ) : null}

      {selectedValdDevice === "forcedecks" ? (
        <TestingPlaceholderDashboard
          copy={copy}
          labels={labels}
          title="ForceDecks"
          subtitle={labels.forcePlateDashboard}
          body={copy.development.forcedecksCopy ?? labels.forcedecksCopy}
          chips={[labels.cmjTitle, labels.landing, labels.balance, labels.forceTime]}
        />
      ) : null}
    </section>
  );
}

function ValdDeviceCard({
  device,
  isActive,
  onClick,
}: {
  device: ValdDeviceCardData;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={isActive ? "testing-device-card is-active" : "testing-device-card"}
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
    >
      {device.image ? <Image src={device.image} alt={`${device.title} logo`} width={124} height={84} /> : <span>{device.label}</span>}
      <div>
        <strong>{device.title}</strong>
        <p>{device.copy}</p>
        <small>{device.stat}</small>
      </div>
    </button>
  );
}

function FmsTestingDashboard({
  copy,
  exercises,
  flaggedFmsExercises,
  labels,
  language,
  rows,
}: {
  copy: TestingBatteryCopy;
  exercises: FmsExerciseScoreRow[];
  flaggedFmsExercises: number;
  labels: ReturnType<typeof testingLabels>;
  language: AmsLanguage;
  rows: FmsAssessmentRow[];
}) {
  const latestRows = [...rows].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 6);
  const latestExercises = [...exercises].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 8);
  const averageScore = average(rows.map((row) => row.totalScore));
  const flaggedAssessments = rows.filter((row) => Boolean(row.riskFlag) || numberValue(row.totalScore) < 15).length;

  return (
    <article className="testing-dashboard-panel">
      <div className="testing-dashboard-header">
        <div>
          <span>{labels.screening}</span>
          <h4>{labels.fmsDashboard}</h4>
          <p>{copy.development.fmsCopy ?? labels.fmsCopy}</p>
        </div>
        <Image src="/ams/assets/testing/fms-logo.jpeg" alt="FMS logo" width={112} height={84} />
      </div>

      <section className="metric-grid testing-summary-grid">
        <MetricCard label={copy.development.fmsAssessments ?? labels.assessments} value={compactNumber(rows.length)} detail={copy.development.movementRecords ?? labels.movementRecords} />
        <MetricCard label={labels.avgScore} value={compactNumber(averageScore, 1)} detail={labels.outOfTwentyOne} />
        <MetricCard label={labels.priorityFlags} value={compactNumber(flaggedFmsExercises)} detail={labels.exerciseRows} />
        <MetricCard label={labels.riskFlags} value={compactNumber(flaggedAssessments)} detail={labels.assessmentRows} />
      </section>

      <section className="testing-dashboard-lists">
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={copy.development.latestFmsAssessments ?? labels.latestFmsAssessments}
          subtitle={copy.development.cleanedMovementResults ?? labels.cleanedMovementResults}
          rows={latestRows.map((row) => [
            row.matchedAthleteName || copy.common.unknownPlayer,
            row.dateIso || copy.common.noDate,
            String(row.totalScore ?? copy.common.noScore),
            row.scoreBand || row.riskFlag || copy.common.noFlag,
          ])}
        />
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={labels.fmsExerciseRows}
          subtitle={labels.componentScores}
          rows={latestExercises.map((row) => [
            row.sourceAthleteName || playerNameForAmsId(row.amsId),
            row.exerciseName || copy.common.unclassified,
            String(row.pointScore ?? copy.common.noScore),
            row.asymmetryRaw || `${labels.priority} ${row.correctionPriorityRank ?? "-"}`,
          ])}
        />
      </section>
    </article>
  );
}

function YBalanceTestingDashboard({
  copy,
  labels,
  language,
  metrics,
  rows,
}: {
  copy: TestingBatteryCopy;
  labels: ReturnType<typeof testingLabels>;
  language: AmsLanguage;
  metrics: YBalanceMetricRow[];
  rows: YBalanceAssessmentRow[];
}) {
  const latestRows = [...rows].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 6);
  const latestMetrics = [...metrics].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 8);
  const averageComposite = average(rows.map((row) => row.compositeScore));
  const riskFlags = rows.filter((row) => Boolean(row.riskFlag)).length;
  const testTypes = unique(rows.map((row) => row.testType));

  return (
    <article className="testing-dashboard-panel">
      <div className="testing-dashboard-header">
        <div>
          <span>{labels.screening}</span>
          <h4>{labels.yBalanceDashboard}</h4>
          <p>{copy.development.ybtCopy ?? labels.yBalanceCopy}</p>
        </div>
        <Image src="/ams/assets/testing/ybt-logo.svg" alt="Y Balance Test logo" width={126} height={72} />
      </div>

      <section className="metric-grid testing-summary-grid">
        <MetricCard label={copy.development.yBalanceTests ?? labels.yBalanceTests} value={compactNumber(rows.length)} detail={copy.development.reachRecords ?? labels.reachRecords} />
        <MetricCard label={labels.avgComposite} value={compactNumber(averageComposite, 1)} detail={labels.availableScores} />
        <MetricCard label={labels.riskFlags} value={compactNumber(riskFlags)} detail={labels.asymmetryFlags} />
        <MetricCard label={labels.testTypes} value={compactNumber(testTypes.length)} detail={testTypes.join(" · ") || copy.common.noData} />
      </section>

      <section className="testing-dashboard-lists">
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={labels.latestYBalanceTests}
          subtitle={labels.cleanedReachResults}
          rows={latestRows.map((row) => [
            row.matchedAthleteName || copy.common.unknownPlayer,
            row.dateIso || copy.common.noDate,
            row.testType || copy.common.unclassified,
            String(row.compositeScore ?? row.riskFlag ?? copy.common.noScore),
          ])}
        />
        <DataList
          emptyLabel={copy.common.noRecords}
          language={language}
          title={labels.yBalanceMetrics}
          subtitle={`${compactNumber(metrics.length)} ${labels.metricRows}`}
          rows={latestMetrics.map((row) => [
            row.sourceAthleteName || playerNameForAmsId(row.amsId),
            row.testType || copy.common.unclassified,
            `${row.side || "-"} · ${row.metric || "-"}`,
            `${compactNumber(numberValue(row.value), 1)} ${row.unit || ""}`,
          ])}
        />
      </section>
    </article>
  );
}

function TestingPlaceholderDashboard({
  body,
  chips,
  copy,
  labels,
  subtitle,
  title,
}: {
  body: string;
  chips: string[];
  copy: TestingBatteryCopy;
  labels: ReturnType<typeof testingLabels>;
  subtitle: string;
  title: string;
}) {
  return (
    <article className="testing-dashboard-panel testing-dashboard-placeholder">
      <div className="testing-dashboard-header">
        <div>
          <span>{subtitle}</span>
          <h4>{title}</h4>
          <p>{body}</p>
        </div>
        <strong>{copy.common.waitingForSource}</strong>
      </div>
      <div className="testing-placeholder-chip-row">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
      <p className="testing-placeholder-note">{labels.pendingSourceNote}</p>
    </article>
  );
}

function testingLabels(language: AmsLanguage) {
  if (language === "es") {
    return {
      acceleration: "Aceleración",
      aerobic: "Aeróbico",
      assessmentRows: "Filas de evaluación",
      assessments: "Evaluaciones",
      asymmetry: "Asimetría",
      asymmetryFlags: "Indicadores de asimetría",
      availableScores: "Puntajes disponibles",
      avgComposite: "Promedio compuesto",
      avgImbalance: "Asimetría prom.",
      avgScore: "Puntaje prom.",
      balance: "Equilibrio",
      braking: "Frenado",
      capacity: "Capacidad",
      cleanedMovementResults: "Resultados limpios de movimiento",
      cleanedReachResults: "Resultados limpios de alcance",
      cmjCopy: "Altura de salto, impulso, aterrizaje y asimetría para disponibilidad neuromuscular.",
      cmjDashboard: "Dashboard CMJ",
      cmjTitle: "Salto CMJ",
      codCopy: "505, agilidad y estrategia de frenado para perfilar movimiento.",
      codDashboard: "Dashboard COD",
      codTitle: "Cambio de dirección",
      componentScores: "Puntajes por componente",
      deviceFamily: "Familia de dispositivos",
      distance: "Distancia",
      exerciseRows: "Filas de ejercicios",
      fmsCopy: "Tarjetas de puntaje de movimiento e imágenes de componentes.",
      fmsDashboard: "Dashboard FMS",
      fmsExerciseRows: "Filas de ejercicios FMS",
      forceFrame: "ForceFrame",
      forcePerKg: "Fuerza por kg",
      forcePlateDashboard: "Dashboard de plataforma de fuerza",
      forceTime: "Fuerza-tiempo",
      forcedecksCopy: "Saltos, aterrizajes, equilibrio y métricas fuerza-tiempo para monitoreo neuromuscular.",
      forceframeCopy: "Perfiles isométricos de cadera, ingle, hombro y tronco.",
      groupAverage: "Promedio del grupo",
      highestLoadedTest: "Mayor prueba cargada",
      hipGroin: "Cadera / ingle",
      impulse: "Impulso",
      isometricDashboard: "Dashboard isométrico",
      isometricPeak: "Pico isométrico",
      jumpHeight: "Altura de salto",
      jumpTesting: "Prueba de salto",
      landing: "Aterrizaje",
      latestFmsAssessments: "Evaluaciones FMS recientes",
      latestNordbordTests: "Pruebas NordBord recientes",
      latestYBalanceTests: "Pruebas Y Balance recientes",
      mappedTests: "pruebas mapeadas",
      maxForceAsymmetry: "Asimetría de fuerza máxima",
      maxImbalance: "Asimetría máx.",
      maxLeftForce: "Fuerza máx. izq.",
      maxRightForce: "Fuerza máx. der.",
      metricDetailRows: "Filas de detalle de métricas",
      metricRows: "filas de métricas",
      movement: "Movimiento",
      movementRecords: "Registros de pantalla de movimiento",
      nordbordCopy: "Vistas de fuerza, impulso, asimetría y tiempo al pico.",
      nordbordDashboard: "Dashboard NordBord",
      outOfTwentyOne: "Sobre 21 puntos",
      pendingSourceNote: "Este panel queda listo para conectar la fuente limpia cuando el feed esté disponible.",
      priority: "Prioridad",
      priorityFlags: "Alertas prioritarias",
      reachRecords: "Registros de alcance y asimetría",
      recovery: "Recuperación",
      riskFlags: "Alertas de riesgo",
      roleDemand: "Demanda por rol",
      screening: "Screening",
      shoulder: "Hombro",
      testCategories: "Categorías de pruebas",
      testTypes: "Tipos de prueba",
      testingBattery: "Batería de pruebas",
      testingBatterySub: "Pipeline de fuerza, movimiento, salto, asimetría y disponibilidad",
      thresholds: "Umbrales",
      trunk: "Tronco",
      valdCopy: "Pruebas NordBord e IDs de perfil mapeados.",
      valdDevices: "Dispositivos VALD",
      valdMetricRows: "filas de métricas VALD disponibles",
      yBalanceCopy: "Puntajes compuestos de alcance e indicadores de asimetría.",
      yBalanceDashboard: "Dashboard Y Balance",
      yBalanceMetrics: "Métricas Y Balance",
      yBalanceTests: "Pruebas Y Balance",
      yBalanceTitle: "Y Balance",
      yoyoCopy: "Capacidad aeróbica y recuperación intermitente.",
      yoyoDashboard: "Dashboard Yo-Yo",
      yoyoTitle: "Yo-Yo / Aeróbico",
    };
  }

  return {
    acceleration: "Acceleration",
    aerobic: "Aerobic",
    assessmentRows: "Assessment rows",
    assessments: "Assessments",
    asymmetry: "Asymmetry",
    asymmetryFlags: "Asymmetry flags",
    availableScores: "Available scores",
    avgComposite: "Avg composite",
    avgImbalance: "Avg imbalance",
    avgScore: "Avg score",
    balance: "Balance",
    braking: "Braking",
    capacity: "Capacity",
    cleanedMovementResults: "Cleaned movement screen results",
    cleanedReachResults: "Cleaned reach and asymmetry results",
    cmjCopy: "Jump height, impulse, landing, and asymmetry readiness tests.",
    cmjDashboard: "CMJ Dashboard",
    cmjTitle: "Countermovement Jump",
    codCopy: "505, agility, and braking strategy inputs for movement profiling.",
    codDashboard: "COD Dashboard",
    codTitle: "Change of Direction",
    componentScores: "Component scores",
    deviceFamily: "Device family",
    distance: "Distance",
    exerciseRows: "Exercise rows",
    fmsCopy: "Movement score cards and component images.",
    fmsDashboard: "FMS Dashboard",
    fmsExerciseRows: "FMS Exercise Rows",
    forceFrame: "ForceFrame",
    forcePerKg: "Force per kg",
    forcePlateDashboard: "Force plate dashboard",
    forceTime: "Force-time",
    forcedecksCopy: "Jump, landing, balance, and force-time metrics for neuromuscular monitoring.",
    forceframeCopy: "Isometric strength profiles across hip, groin, shoulder, and trunk tests.",
    groupAverage: "Group average",
    highestLoadedTest: "Highest loaded test",
    hipGroin: "Hip / groin",
    impulse: "Impulse",
    isometricDashboard: "Isometric dashboard",
    isometricPeak: "Isometric peak",
    jumpHeight: "Jump height",
    jumpTesting: "Jump testing",
    landing: "Landing",
    latestFmsAssessments: "Latest FMS Assessments",
    latestNordbordTests: "Latest NordBord Tests",
    latestYBalanceTests: "Latest Y Balance Tests",
    mappedTests: "mapped tests",
    maxForceAsymmetry: "Max-force asymmetry",
    maxImbalance: "Max imbalance",
    maxLeftForce: "Max left force",
    maxRightForce: "Max right force",
    metricDetailRows: "Metric detail rows",
    metricRows: "metric rows",
    movement: "Movement",
    movementRecords: "Movement screen records",
    nordbordCopy: "Force, impulse, asymmetry, and time-to-peak views.",
    nordbordDashboard: "NordBord Dashboard",
    outOfTwentyOne: "Out of 21 points",
    pendingSourceNote: "This panel is ready for the clean source once the feed is available.",
    priority: "Priority",
    priorityFlags: "Priority flags",
    reachRecords: "Reach and asymmetry records",
    recovery: "Recovery",
    riskFlags: "Risk flags",
    roleDemand: "Role demand",
    screening: "Screening",
    shoulder: "Shoulder",
    testCategories: "Testing categories",
    testTypes: "Test types",
    testingBattery: "Testing Battery",
    testingBatterySub: "Strength, movement, jump, asymmetry, and readiness testing pipeline",
    thresholds: "Thresholds",
    trunk: "Trunk",
    valdCopy: "Mapped NordBord tests and profile IDs.",
    valdDevices: "VALD devices",
    valdMetricRows: "VALD metric rows available",
    yBalanceCopy: "Composite reach scores and asymmetry flags.",
    yBalanceDashboard: "Y Balance Dashboard",
    yBalanceMetrics: "Y Balance Metrics",
    yBalanceTests: "Y Balance tests",
    yBalanceTitle: "Y Balance",
    yoyoCopy: "Aerobic capacity and intermittent recovery testing records.",
    yoyoDashboard: "Yo-Yo Dashboard",
    yoyoTitle: "Yo-Yo / Aerobic",
  };
}

function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value) && value > 0);
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function playerNameForAmsId(amsId: string | undefined) {
  return players.find((player) => player.amsId === amsId)?.name ?? amsId ?? "Unknown player";
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}
