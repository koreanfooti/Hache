import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { metricDefinitions, players } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { injuryGoogleSheetHtmlUrl } from "@/lib/ams/injury-source";
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
  localizedValue,
  type AmsLanguage,
} from "@/components/ams/ui/AmsUi";

type RecoveryCopy = Record<string, string | readonly string[]> & {
  kicker: string;
  title: string;
  copy: string;
};

type InjuryCauseFilter = "all" | "direct" | "indirect";
type DevelopmentView = "position" | "blocks" | "battery";

type InjuryMapDot = {
  bodyRegion?: string;
  count: number;
  days: number;
  key: string;
  laterality?: string;
  mapX: number;
  mapY: number;
};

const gustavoFerrareisTestPlayer = "Gustavo Ferrareis";
const bodyCompositionSheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUcyFgPRUf5wsz0647lu_T3QlLDfXvcwrkEu0A9vnVJYpHujNMHjGxuyqYRl6RhyVFp3Hke-97wkPt/pubhtml";

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
  const [selectedPlayer, setSelectedPlayer] = useState(gustavoFerrareisTestPlayer);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCause, setSelectedCause] = useState<InjuryCauseFilter>("all");
  const allLabel = copy.injury.all ?? "All";
  const playerOptions = useMemo(
    () => {
      const injuryPlayers = unique(injuries.map((injury) => injury.playerName).filter(Boolean));
      const orderedPlayers = injuryPlayers.includes(gustavoFerrareisTestPlayer)
        ? injuryPlayers
        : [gustavoFerrareisTestPlayer, ...injuryPlayers];

      return ["all", ...orderedPlayers];
    },
    [injuries],
  );
  const typeOptions = useMemo(
    () => ["all", ...unique(injuries.map((injury) => injury.injuryType).filter(Boolean))],
    [injuries],
  );
  const yearOptions = useMemo(
    () => [
      "all",
      ...unique(injuries.map((injury) => String(injury.startDate || "").slice(0, 4)).filter((year) => year.length === 4))
        .sort((a, b) => b.localeCompare(a)),
    ],
    [injuries],
  );
  const filteredInjuries = useMemo(
    () => injuries
      .filter((injury) => {
        const year = String(injury.startDate || "").slice(0, 4);
        return (selectedPlayer === "all" || injury.playerName === selectedPlayer)
          && (selectedType === "all" || injury.injuryType === selectedType)
          && (selectedYear === "all" || year === selectedYear)
          && (selectedCause === "all" || injuryCauseKind(injury.cause) === selectedCause);
      })
      .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate))),
    [injuries, selectedCause, selectedPlayer, selectedType, selectedYear],
  );
  const totalDaysLost = filteredInjuries.reduce((total, injury) => total + numberValue(injury.totalDaysLost), 0);
  const topRegion = mostCommon(filteredInjuries.map((injury) => injury.bodyRegion).filter(Boolean));
  const latestInjury = filteredInjuries[0];
  const injuryDots = useMemo(() => buildInjuryMapDots(filteredInjuries), [filteredInjuries]);

  return (
    <div className="panel-stack injury-history-panel">
      <section className="injury-history-hero">
        <div>
          <span className="section-kicker">{copy.injury.sourceKicker ?? copy.injury.kicker}</span>
          <h2>{copy.injury.title}</h2>
          <p>{copy.injury.copy}</p>
        </div>
        <a className="source-open-button" href={injuryGoogleSheetHtmlUrl} target="_blank" rel="noopener noreferrer">
          {copy.injury.openSource ?? "Open Source"}
        </a>
      </section>

      <section className="injury-filter-panel" aria-label={copy.injury.filters ?? "Injury filters"}>
        <label>
          <span>{copy.injury.athlete ?? "Athlete"}</span>
          <select value={selectedPlayer} onChange={(event) => setSelectedPlayer(event.target.value)}>
            {playerOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? allLabel : option}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.injury.injuryType ?? "Injury Type"}</span>
          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? allLabel : localizedValue(option, language)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.injury.year ?? "Year"}</span>
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? allLabel : option}
              </option>
            ))}
          </select>
        </label>
        <div className="injury-cause-filter">
          <span>{copy.injury.cause ?? "Cause"}</span>
          <div className="injury-cause-toggle" role="group" aria-label={copy.injury.cause ?? "Cause"}>
            {(["all", "direct", "indirect"] as InjuryCauseFilter[]).map((cause) => (
              <button
                className={selectedCause === cause ? "is-active" : ""}
                key={cause}
                type="button"
                onClick={() => setSelectedCause(cause)}
              >
                {injuryCauseFilterLabel(cause, copy)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="metric-grid injury-kpi-grid">
        <MetricCard label={copy.injury.injuryEvents} value={compactNumber(filteredInjuries.length)} detail={copy.injury.filteredRows ?? copy.injury.cleanInjuryRecords} />
        <MetricCard label={copy.injury.daysLost} value={compactNumber(totalDaysLost)} detail={copy.injury.totalDays ?? copy.injury.totalUnavailableDays} />
        <MetricCard label={copy.injury.topRegion} value={topRegion ? displayInjuryRegion(topRegion, language) : copy.common.pending} detail={copy.injury.mappedLocation ?? copy.injury.mostFrequentRegion} />
        <MetricCard label={copy.injury.latestRecord} value={latestInjury?.startDate || copy.common.noData} detail={latestInjury?.playerName || copy.common.waitingForSource} />
      </section>

      <section className="injury-history-layout">
        <article className="injury-map-card">
          <div className="panel-heading">
            <h3>{copy.injury.bodyMap ?? "Body Map"}</h3>
            <span>{copy.injury.bodyMapSub ?? "Dots represent filtered injury locations"}</span>
          </div>
          <div className="injury-body-map-wrap">
            <Image src="/ams/assets/injuries/body-map.png" alt="" width={400} height={350} priority={false} />
            <div className="injury-map-dots" aria-label={copy.injury.bodyMap ?? "Body Map"}>
              {injuryDots.map((dot) => {
                const size = 15 + (dot.count / Math.max(1, injuryDots[0]?.count ?? 1)) * 9;
                const title = `${dot.count} · ${displayInjuryRegion(dot.bodyRegion, language)} · ${displayInjurySide(dot.laterality, language)} · ${compactNumber(dot.days)} ${copy.injury.daysLabel ?? "days"}`;

                return (
                  <button
                    aria-label={title}
                    className="injury-dot"
                    key={dot.key}
                    style={{
                      "--dot-left": `${dot.mapX}%`,
                      "--dot-size": `${size}px`,
                      "--dot-top": `${dot.mapY}%`,
                    } as CSSProperties}
                    title={title}
                    type="button"
                  >
                    <span>{dot.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </article>

        <article className="injury-table-card">
          <div className="panel-heading">
            <h3>{copy.injury.historyView ?? copy.injury.latestRecords}</h3>
            <span>{copy.injury.tableSub ?? copy.injury.recentMedicalEvents}</span>
          </div>
          {filteredInjuries.length ? (
            <div className="injury-table-wrap">
              <table className="injury-table">
                <thead>
                  <tr>
                    <th>{copy.injury.athlete ?? "Athlete"}</th>
                    <th>{copy.injury.injuryDescription ?? "Injury Description"}</th>
                    <th>{copy.injury.injuryType ?? "Injury Type"}</th>
                    <th>{copy.injury.bodyRegion ?? "Body Region"}</th>
                    <th>{copy.injury.laterality ?? "Laterality"}</th>
                    <th>{copy.injury.cause ?? "Cause"}</th>
                    <th>{copy.injury.startDate ?? "Start Date"}</th>
                    <th>{copy.injury.endDate ?? "End Date"}</th>
                    <th>{copy.injury.daysLost ?? "Days Lost"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInjuries.map((injury) => (
                    <tr key={injury.injuryId ?? `${injury.playerName}-${injury.startDate}-${injury.injury}`}>
                      <td><strong>{injury.playerName || copy.common.unknownPlayer}</strong></td>
                      <td>{injury.injury || copy.common.unclassified}</td>
                      <td>{injury.injuryType || copy.common.unclassified}</td>
                      <td>{displayInjuryRegion(injury.bodyRegion, language)}</td>
                      <td>{displayInjurySide(injury.laterality, language)}</td>
                      <td>{displayInjuryCause(injury.cause, language)}</td>
                      <td>{injury.startDate || copy.common.noDate}</td>
                      <td>{injury.endDate || copy.common.noDate}</td>
                      <td>{compactNumber(numberValue(injury.totalDaysLost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="injury-empty-state">{copy.common.noRecords}</div>
          )}
        </article>
      </section>
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
  onOpenBodyComposition,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  fms: FmsAssessmentRow[];
  fmsExerciseScores: FmsExerciseScoreRow[];
  yBalance: YBalanceAssessmentRow[];
  yBalanceMetrics: YBalanceMetricRow[];
  valdNordbordTests: ValdNordbordTestRow[];
  valdNordbordMetrics: ValdNordbordMetricRow[];
  onOpenBodyComposition: () => void;
}) {
  const [developmentView, setDevelopmentView] = useState<DevelopmentView>("battery");
  const latestFms = [...fms].sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso))).slice(0, 5);
  const latestNordbord = [...valdNordbordTests]
    .sort((a, b) => String(b.testDateUtc).localeCompare(String(a.testDateUtc)))
    .slice(0, 5);
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
    <div className="panel-stack development-panel">
      <section className="development-module-grid">
        <button
          className={developmentView === "position" ? "development-module-card priority is-active" : "development-module-card priority"}
          type="button"
          onClick={() => setDevelopmentView("position")}
        >
          <span>{copy.development.physicalBenchmarking ?? "Physical Benchmarking"}</span>
          <strong>{copy.development.positionProfile ?? "Position Profile"}</strong>
          <p>{copy.development.physicalBenchmarkingCopy ?? "Speed, aerobic power, jump, strength, and asymmetry benchmarks against role demands."}</p>
        </button>
        <button
          className={developmentView === "blocks" ? "development-module-card is-active" : "development-module-card"}
          type="button"
          onClick={() => setDevelopmentView("blocks")}
        >
          <span>{copy.development.developmentPlan ?? "Development Plan"}</span>
          <strong>{copy.development.blocks ?? "Blocks"}</strong>
          <p>{copy.development.developmentPlanCopy ?? "Training objectives by player, phase, and staff owner."}</p>
        </button>
        <button className="development-module-card" type="button" onClick={onOpenBodyComposition}>
          <span>{copy.development.anthropometric ?? "Anthropometric"}</span>
          <strong>{copy.development.bodyComp ?? "Body Comp"}</strong>
          <p>{copy.development.anthropometricCopy ?? "Body composition, ISAK skinfolds, girths, and longitudinal growth markers by player and category."}</p>
        </button>
        <button
          className={developmentView === "battery" ? "development-module-card module-action is-active" : "development-module-card module-action"}
          type="button"
          onClick={() => setDevelopmentView("battery")}
        >
          <span>{copy.development.testing ?? "Testing"}</span>
          <strong>{copy.development.battery ?? "Battery"}</strong>
          <p>{copy.development.testingCopy ?? "CMJ, sprint splits, COD, Yo-Yo, force plate, and gym testing inputs."}</p>
        </button>
      </section>

      {developmentView === "battery" ? (
        <section className="testing-battery-page">
          <div className="panel-heading">
            <div>
              <h3>{copy.development.valdTesting ?? "VALD Testing Battery"}</h3>
              <span>{copy.development.valdTestingSub ?? "Strength, asymmetry, force, and readiness testing pipeline"}</span>
            </div>
          </div>
          <article className="testing-brand-card">
            <Image src="/ams/assets/testing/vald-logo.png" alt="" width={190} height={86} />
            <div>
              <strong>VALD</strong>
              <p>{copy.development.valdCopy}</p>
            </div>
          </article>
          <section className="testing-device-grid">
            <TestingDeviceCard image="/ams/assets/testing/nordbord-logo.png" title="NordBord" copy={copy.development.nordbordCopy} stat={`${compactNumber(valdNordbordTests.length)} ${copy.common.tests}`} />
            <TestingDeviceCard label="02" title="ForceFrame" copy={copy.development.forceframeCopy ?? "Isometric strength profiles across hip, groin, shoulder, and trunk tests."} stat={copy.common.pending} />
            <TestingDeviceCard label="03" title="ForceDecks" copy={copy.development.forcedecksCopy ?? "Jump, landing, balance, and force-time metrics for neuromuscular monitoring."} stat={copy.common.pending} />
            <TestingDeviceCard image="/ams/assets/testing/fms-logo.jpeg" title="FMS" copy={copy.development.fmsCopy} stat={`${compactNumber(fms.length)} ${copy.common.records}`} />
            <TestingDeviceCard image="/ams/assets/testing/ybt-logo.svg" title="YBT" copy={copy.development.ybtCopy} stat={`${compactNumber(yBalance.length)} ${copy.common.tests}`} />
            <TestingDeviceCard label="CMJ" title="Countermovement Jump" copy={copy.development.cmjCopy ?? "Jump height, impulse, landing, and asymmetry readiness tests."} stat={copy.common.waitingForSource} />
            <TestingDeviceCard label="COD" title="Change of Direction" copy={copy.development.codCopy ?? "505, agility, and braking strategy inputs for movement profiling."} stat={copy.common.waitingForSource} />
            <TestingDeviceCard label="YY" title="Yo-Yo / Aerobic" copy={copy.development.yoyoCopy ?? "Aerobic capacity and intermittent recovery testing records."} stat={copy.common.waitingForSource} />
          </section>
          <section className="metric-grid testing-summary-grid">
            <MetricCard label={copy.development.fmsAssessments} value={compactNumber(fms.length)} detail={copy.development.movementRecords} />
            <MetricCard label="FMS exercise rows" value={compactNumber(fmsExerciseScores.length)} detail={`${compactNumber(flaggedFmsExercises)} priority/asymmetry flags`} />
            <MetricCard label="NordBord tests" value={compactNumber(valdNordbordTests.length)} detail={`${compactNumber(averageNordbordImbalance, 1)}% avg max-force asymmetry`} />
            <MetricCard label={copy.development.yBalanceTests} value={compactNumber(yBalance.length)} detail={`${compactNumber(yBalanceMetrics.length)} metric rows`} />
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
        </section>
      ) : (
        <section className="development-detail-panel">
          <span>{developmentView === "position" ? copy.development.physicalBenchmarking : copy.development.developmentPlan}</span>
          <h3>{developmentView === "position" ? copy.development.positionProfile : copy.development.blocks}</h3>
          <p>{developmentView === "position" ? copy.development.physicalBenchmarkingCopy : copy.development.developmentPlanCopy}</p>
        </section>
      )}
    </div>
  );
}

function TestingDeviceCard({
  copy,
  image,
  label,
  stat,
  title,
}: {
  copy: string;
  image?: string;
  label?: string;
  stat: string;
  title: string;
}) {
  return (
    <article className="testing-device-card">
      {image ? <Image src={image} alt="" width={124} height={84} /> : <span>{label}</span>}
      <div>
        <strong>{title}</strong>
        <p>{copy}</p>
        <small>{stat}</small>
      </div>
    </article>
  );
}

export function BodyCompositionPanel({
  copy,
  language,
  rows,
  onBackToDevelopment,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  rows: BodyCompRow[];
  onBackToDevelopment: () => void;
}) {
  const categoryOptions = useMemo(() => unique(rows.map((row) => row.category ?? row.sourceCategory).filter(Boolean)), [rows]);
  const [selectedCategory, setSelectedCategory] = useState("U21");
  const [selectedPlayer, setSelectedPlayer] = useState("all");
  const [selectedDate, setSelectedDate] = useState("latest");
  const activeCategory = categoryOptions.includes(selectedCategory) ? selectedCategory : categoryOptions[0] ?? selectedCategory;
  const categoryRows = useMemo(
    () => rows.filter((row) => (row.category ?? row.sourceCategory) === activeCategory),
    [activeCategory, rows],
  );
  const playerOptions = useMemo(() => ["all", ...unique(categoryRows.map((row) => row.playerName ?? row.player_name).filter(Boolean))], [categoryRows]);
  const playerRows = useMemo(
    () => categoryRows.filter((row) => selectedPlayer === "all" || (row.playerName ?? row.player_name) === selectedPlayer),
    [categoryRows, selectedPlayer],
  );
  const dateOptions = useMemo(
    () => ["latest", ...unique(playerRows.map((row) => row.testDate ?? row.date).filter(Boolean)).sort((a, b) => b.localeCompare(a))],
    [playerRows],
  );
  const rowsForView = useMemo(() => {
    if (selectedDate !== "latest") return playerRows.filter((row) => (row.testDate ?? row.date) === selectedDate);
    return latestBodyCompRowsByPlayer(playerRows);
  }, [playerRows, selectedDate]);
  const profileRow = rowsForView[0] ?? latestBodyCompRowsByPlayer(categoryRows)[0];
  const teamLatestRows = useMemo(() => latestBodyCompRowsByPlayer(categoryRows), [categoryRows]);
  const teamAverageWeight = average(teamLatestRows.map((row) => row.weightKg));
  const compositionSegments = bodyCompositionSegments(profileRow);
  const bodyCompMarkers = bodyCompositionMarkers(profileRow, language);
  const somatotypeRows = selectedPlayer === "all" ? teamLatestRows : bodyCompSeriesRows(playerRows);
  const energyRows = bodyCompEnergyRows(profileRow);
  const recordRows = selectedPlayer === "all" ? teamLatestRows : bodyCompSeriesRows(playerRows).slice(0, 12);

  return (
    <div className="panel-stack body-composition-dashboard">
      <section className="body-composition-hero">
        <div>
          <span className="section-kicker">{copy.bodyComp.kicker}</span>
          <h2>{copy.bodyComp.title}</h2>
          <p>{copy.bodyComp.copy}</p>
        </div>
        <div className="body-composition-actions">
          <span>{compactNumber(rows.length)} {language === "es" ? "registros locales" : "local records"}</span>
          <a className="source-open-button" href={bodyCompositionSheetUrl} target="_blank" rel="noopener noreferrer">
            {copy.bodyComp.openSource ?? "Open Source"}
          </a>
          <button className="source-open-button" type="button" onClick={onBackToDevelopment}>
            {copy.bodyComp.home ?? "Home"}
          </button>
        </div>
      </section>

      <section className="body-composition-controls" aria-label={copy.bodyComp.controls ?? "Body composition controls"}>
        <div className="body-composition-control-group">
          <span>{copy.bodyComp.team ?? "Team"}</span>
          <div className="body-composition-category-toggle" role="group" aria-label={copy.bodyComp.team ?? "Team"}>
            {categoryOptions.map((category) => (
              <button
                className={activeCategory === category ? "is-active" : ""}
                key={category}
                type="button"
                onClick={() => {
                  setSelectedCategory(category);
                  setSelectedPlayer("all");
                  setSelectedDate("latest");
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <label>
          <span>{copy.bodyComp.athlete ?? "Athlete"}</span>
          <select value={selectedPlayer} onChange={(event) => { setSelectedPlayer(event.target.value); setSelectedDate("latest"); }}>
            {playerOptions.map((option) => (
              <option key={option} value={option}>{option === "all" ? (copy.bodyComp.all ?? "All") : option}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{copy.bodyComp.date ?? "Date"}</span>
          <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
            {dateOptions.map((option) => (
              <option key={option} value={option}>{option === "latest" ? (copy.bodyComp.latest ?? "Latest") : option}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="metric-grid body-composition-kpis">
        <MetricCard label={copy.bodyComp.weightKg ?? "Weight"} value={bodyCompMetric(profileRow?.weightKg, 1)} detail="kg" />
        <MetricCard label={copy.bodyComp.bmi ?? "BMI"} value={bodyCompMetric(profileRow?.bmi, 1)} detail="kg/m²" />
        <MetricCard label={copy.bodyComp.muscleMass ?? "Muscle Mass"} value={bodyCompMetric(profileRow?.muscleKg, 1)} detail="kg" />
        <MetricCard label={copy.bodyComp.skinfoldSum ?? "Σ 6 Skinfolds"} value={bodyCompMetric(profileRow?.skinfold6, 1)} detail="mm" />
      </section>

      <section className="body-composition-layout">
        <aside className="body-composition-team-card">
          <span>{copy.bodyComp.teamAverage ?? "Team Average"}</span>
          <h3>{copy.bodyComp.averageWeight ?? "Average Weight"}</h3>
          <strong>{bodyCompMetric(teamAverageWeight, 1)}</strong>
          <small>{copy.bodyComp.weightKg ?? "Weight"} (kg) · {compactNumber(teamLatestRows.length)} {language === "es" ? "jugadores" : "players"}</small>
        </aside>

        <article className="body-composition-map-card">
          <div className="panel-heading">
            <h3>{copy.bodyComp.bodyCompMap ?? "Anthropometry Map"}</h3>
            <span>{profileRow?.playerName ?? profileRow?.player_name ?? `${activeCategory} ${copy.bodyComp.all ?? "All"}`}</span>
          </div>
          <div className="body-composition-map-wrap">
            <Image src="/ams/assets/injuries/body-map.png" alt="" width={400} height={350} />
            <div className="body-composition-markers">
              {bodyCompMarkers.map((marker) => (
                <span
                  className="body-composition-marker"
                  key={marker.label}
                  style={{ "--marker-left": `${marker.x}%`, "--marker-top": `${marker.y}%` } as CSSProperties}
                  title={`${marker.label}: ${marker.value}`}
                >
                  <strong>{marker.value}<em>cm</em></strong>
                  <small>{marker.label}</small>
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="body-composition-profile-card">
          <div className="panel-heading">
            <h3>{copy.bodyComp.compositionProfile ?? "Composition Profile"}</h3>
            <span>{copy.bodyComp.compositionProfileSub ?? "Mass model in kg and percent share"}</span>
          </div>
          <div className="body-composition-pie-layout">
            <div
              className="body-composition-pie"
              style={{ "--pie": compositionPieGradient(compositionSegments) } as CSSProperties}
              aria-label={copy.bodyComp.compositionProfile ?? "Composition Profile"}
            />
            <div className="body-composition-legend">
              {compositionSegments.map((segment) => (
                <span key={segment.label}>
                  <i style={{ background: segment.color }} />
                  <strong>{segment.label}</strong>
                  <small>{bodyCompMetricUnit(segment.value, "kg", 1)} · {compactNumber(segment.percent, 1)}%</small>
                </span>
              ))}
            </div>
          </div>
        </article>

        <article className="body-composition-somatotype-card">
          <div className="panel-heading">
            <h3>{copy.bodyComp.somatotypeChart ?? "Somatotype"}</h3>
            <span>{copy.bodyComp.somatotypeSub ?? "Heath-Carter ISAK profile dots"}</span>
          </div>
          <div className="somatotype-plot" aria-label={copy.bodyComp.somatotypeChart ?? "Somatotype"}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <path d="M50 8 C32 26 20 55 14 86 C34 91 66 91 86 86 C80 55 68 26 50 8Z" />
              <line x1="50" y1="8" x2="50" y2="92" />
              <line x1="14" y1="38" x2="50" y2="62" />
              <line x1="86" y1="38" x2="50" y2="62" />
            </svg>
            <span className="somato-label meso">Mesomorphy</span>
            <span className="somato-label endo">Endomorphy</span>
            <span className="somato-label ecto">Ectomorphy</span>
            {somatotypeRows.map((row, index) => {
              const point = somatotypePoint(row);
              return (
                <i
                  className={index % 3 === 0 ? "is-gold" : ""}
                  key={`${row.playerId ?? row.playerName}-${row.testDate}-${index}`}
                  style={{ "--somato-left": `${point.x}%`, "--somato-top": `${point.y}%` } as CSSProperties}
                  title={`${row.playerName}: ${point.label}`}
                />
              );
            })}
          </div>
        </article>

        <article className="body-composition-chart-card body-composition-weight-card">
          <div className="panel-heading">
            <h3>{copy.bodyComp.weightTracking ?? "Weight Tracking"}</h3>
            <span>{copy.bodyComp.weightTrackingSub ?? "Longitudinal player record"}</span>
          </div>
          <div className="body-composition-mini-bars">
            {bodyCompSeriesRows(playerRows).slice(-10).map((row, index) => (
              <span key={`${row.playerId}-${row.testDate}-${index}`} style={{ "--bar-height": `${Math.max(8, Math.min(100, numberValue(row.weightKg) * 1.15))}%` } as CSSProperties}>
                <i />
                <small>{String(row.testDate ?? "").slice(5) || index + 1}</small>
              </span>
            ))}
          </div>
        </article>

        <article className="body-composition-chart-card body-composition-energy-card">
          <div className="panel-heading">
            <h3>{copy.bodyComp.energyExpenditure ?? "Energy Expenditure"}</h3>
            <span>{copy.bodyComp.energyExpenditureSub ?? "Estimated calories by activity level"}</span>
          </div>
          <div className="body-composition-energy-list">
            {energyRows.map((row) => (
              <span key={row.label}>
                <strong>{row.label}</strong>
                <i style={{ "--energy-width": `${row.width}%` } as CSSProperties} />
                <small>{bodyCompMetricUnit(row.value, "kcal", 0)}</small>
              </span>
            ))}
          </div>
        </article>

        <article className="body-composition-table-card">
          <div className="panel-heading">
            <h3>{copy.bodyComp.latestRecords}</h3>
            <span>{copy.bodyComp.recentDates}</span>
          </div>
          <div className="body-composition-table-wrap">
            <table className="body-composition-table">
              <thead>
                <tr>
                  <th>{copy.bodyComp.athlete ?? "Athlete"}</th>
                  <th>{copy.bodyComp.date ?? "Date"}</th>
                  <th>{copy.bodyComp.weightKg ?? "Weight"}</th>
                  <th>{copy.bodyComp.bmi ?? "BMI"}</th>
                  <th>{copy.bodyComp.muscleMass ?? "Muscle"}</th>
                  <th>{copy.bodyComp.skinfoldSum ?? "Σ 6 Skinfolds"}</th>
                  <th>{copy.bodyComp.waist ?? "Waist"}</th>
                  <th>{copy.bodyComp.hip ?? "Hip"}</th>
                </tr>
              </thead>
              <tbody>
                {recordRows.map((row, index) => (
                  <tr key={`${row.playerId ?? row.playerName}-${row.testDate}-${index}`}>
                    <td><strong>{row.playerName ?? row.player_name ?? copy.common.unknownPlayer}</strong></td>
                    <td>{row.testDate ?? row.date ?? copy.common.noDate}</td>
                    <td>{bodyCompMetric(row.weightKg, 1)}</td>
                    <td>{bodyCompMetric(row.bmi, 1)}</td>
                    <td>{bodyCompMetric(row.muscleKg, 1)}</td>
                    <td>{bodyCompMetric(row.skinfold6, 1)}</td>
                    <td>{bodyCompMetric(row.waistCm, 1)}</td>
                    <td>{bodyCompMetric(row.hipCm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
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

function injuryCauseFilterLabel(cause: InjuryCauseFilter, copy: DataPanelCopy) {
  if (cause === "direct") return copy.injury.directCause ?? "Direct";
  if (cause === "indirect") return copy.injury.indirectCause ?? "Indirect";
  return copy.injury.all ?? "All";
}

function injuryCauseKind(cause: string | undefined) {
  const normalized = normalizeIdentityText(cause);
  if (normalized.includes("indirecta")) return "indirect";
  if (normalized.includes("directa")) return "direct";
  return "other";
}

function buildInjuryMapDots(rows: InjuryRow[]) {
  const groups = new Map<string, InjuryMapDot>();

  rows.forEach((row) => {
    const mapX = numberValue(row.mapX);
    const mapY = numberValue(row.mapY);
    if (!mapX || !mapY) return;

    const key = `${Math.round(mapX)}-${Math.round(mapY)}-${row.bodyRegion ?? ""}-${row.laterality ?? ""}`;
    const currentDot = groups.get(key) ?? {
      bodyRegion: row.bodyRegion,
      count: 0,
      days: 0,
      key,
      laterality: row.laterality,
      mapX,
      mapY,
    };

    currentDot.count += 1;
    currentDot.days += numberValue(row.totalDaysLost);
    groups.set(key, currentDot);
  });

  return [...groups.values()].sort((a, b) => b.count - a.count);
}

function displayInjuryRegion(region: string | undefined, language: AmsLanguage) {
  const regionLabels: Record<AmsLanguage, Record<string, string>> = {
    en: {
      abdomen: "Abdomen",
      ankle: "Ankle",
      back: "Back",
      calf: "Calf",
      chest: "Chest",
      elbow: "Elbow",
      foot: "Foot",
      glute: "Glute",
      hamstring: "Hamstring",
      head: "Head",
      hip_groin: "Hip/Groin",
      knee: "Knee",
      lumbar: "Lumbar",
      neck: "Neck",
      other: "Other",
      quad_thigh: "Quad/Thigh",
      shoulder: "Shoulder",
      upper_arm: "Upper Arm",
      wrist_hand: "Wrist/Hand",
    },
    es: {
      abdomen: "Abdomen",
      ankle: "Tobillo",
      back: "Espalda",
      calf: "Pantorrilla",
      chest: "Pecho",
      elbow: "Codo",
      foot: "Pie",
      glute: "Glúteo",
      hamstring: "Isquiosurales",
      head: "Cabeza",
      hip_groin: "Cadera/Ingle",
      knee: "Rodilla",
      lumbar: "Lumbar",
      neck: "Cuello",
      other: "Otro",
      quad_thigh: "Cuádriceps/Muslo",
      shoulder: "Hombro",
      upper_arm: "Brazo",
      wrist_hand: "Muñeca/Mano",
    },
  };

  const key = String(region || "").trim();
  return regionLabels[language][key] ?? humanizeInjuryValue(key || "-");
}

function displayInjurySide(laterality: string | undefined, language: AmsLanguage) {
  const normalized = normalizeIdentityText(laterality);
  if (normalized.includes("izquierda")) return language === "es" ? "Izquierda" : "Left";
  if (normalized.includes("derecha")) return language === "es" ? "Derecha" : "Right";
  if (normalized.includes("bilateral")) return "Bilateral";
  return laterality || "-";
}

function displayInjuryCause(cause: string | undefined, language: AmsLanguage) {
  const kind = injuryCauseKind(cause);
  if (kind === "indirect") return language === "es" ? "Indirecta" : "Indirect";
  if (kind === "direct") return language === "es" ? "Directa" : "Direct";
  return cause || "-";
}

function humanizeInjuryValue(value: string) {
  return String(value || "-").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeIdentityText(value: string | undefined) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function bodyCompMetric(value: unknown, digits = 1) {
  const numericValue = numberValue(value);
  return numericValue ? compactNumber(numericValue, digits) : "-";
}

function bodyCompMetricUnit(value: unknown, unit: string, digits = 1) {
  const metric = bodyCompMetric(value, digits);
  return metric === "-" ? "-" : `${metric} ${unit}`;
}

function bodyCompSeriesRows(rows: BodyCompRow[]) {
  return [...rows].sort((a, b) => String(a.testDate ?? a.date).localeCompare(String(b.testDate ?? b.date)));
}

function latestBodyCompRowsByPlayer(rows: BodyCompRow[]) {
  const latestByPlayer = new Map<string, BodyCompRow>();

  bodyCompSeriesRows(rows).forEach((row) => {
    const key = String(row.playerId ?? row.playerName ?? row.player_name ?? "").trim();
    if (key) latestByPlayer.set(key, row);
  });

  return [...latestByPlayer.values()].sort((a, b) =>
    String(a.playerName ?? a.player_name).localeCompare(String(b.playerName ?? b.player_name)),
  );
}

function bodyCompositionMarkers(row: BodyCompRow | undefined, language: AmsLanguage) {
  const labels = language === "es"
    ? { arm: "Brazo", chest: "Pecho", hip: "Cadera", waist: "Cintura" }
    : { arm: "Arm", chest: "Chest", hip: "Hip", waist: "Waist" };
  const markers: Array<[keyof BodyCompRow, string, number, number]> = [
    ["chestCm", labels.chest, 24, 35],
    ["armCm", labels.arm, 18, 52],
    ["waistCm", labels.waist, 26, 62],
    ["hipCm", labels.hip, 27, 73],
  ];

  return markers
    .map(([key, label, x, y]) => ({ label, value: bodyCompMetric(row?.[key], 1), x, y }))
    .filter((marker) => marker.value !== "-");
}

function bodyCompositionSegments(row: BodyCompRow | undefined) {
  const rawSegments = [
    { color: "#fb5360", label: "Adipose", value: numberValue(row?.adiposeKg) },
    { color: "#dbc06d", label: "Muscle Mass", value: numberValue(row?.muscleKg) },
    { color: "#9e1622", label: "Residual", value: numberValue(row?.residualKg) },
    { color: "#f2c457", label: "Bone", value: numberValue(row?.boneKg) },
  ];
  const total = rawSegments.reduce((sum, segment) => sum + segment.value, 0);

  return rawSegments.map((segment) => ({
    ...segment,
    percent: total ? segment.value / total * 100 : 0,
  }));
}

function compositionPieGradient(segments: ReturnType<typeof bodyCompositionSegments>) {
  let cursor = 0;
  const slices = segments.map((segment) => {
    const start = cursor;
    cursor += segment.percent;
    return `${segment.color} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${slices.join(", ")})`;
}

function bodyCompEnergyRows(row: BodyCompRow | undefined) {
  const rows = [
    { label: "Basal", value: numberValue(row?.basalKcal) },
    { label: "Rest", value: numberValue(row?.restKcal) },
    { label: "Light", value: numberValue(row?.lightKcal) },
    { label: "Moderate", value: numberValue(row?.moderateKcal) },
    { label: "Match", value: numberValue(row?.matchKcal) },
  ];
  const max = Math.max(1, ...rows.map((item) => item.value));

  return rows.map((item) => ({ ...item, width: item.value / max * 100 }));
}

function somatotypeComponents(row: BodyCompRow | undefined) {
  const skinfold = numberValue(row?.skinfold6);
  const muscle = numberValue(row?.muscleKg);
  const adipose = numberValue(row?.adiposeKg);
  const height = numberValue(row?.heightCm);
  const weight = numberValue(row?.weightKg);
  const endo = Math.max(1, Math.min(7, skinfold / 16));
  const meso = Math.max(1, Math.min(7, (muscle / Math.max(1, weight)) * 10));
  const ecto = Math.max(1, Math.min(7, height && weight ? height / Math.cbrt(weight) / 12 : 2.5));

  return {
    ecto,
    endo: adipose ? Math.max(endo, Math.min(7, adipose / 3.5)) : endo,
    meso,
  };
}

function somatotypePoint(row: BodyCompRow | undefined) {
  const somato = somatotypeComponents(row);
  const x = Math.max(12, Math.min(88, 50 + (somato.ecto - somato.endo) * 7));
  const y = Math.max(10, Math.min(88, 82 - somato.meso * 10 + (somato.endo + somato.ecto) * 2));

  return {
    label: `${compactNumber(somato.endo, 1)}-${compactNumber(somato.meso, 1)}-${compactNumber(somato.ecto, 1)}`,
    x,
    y,
  };
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
