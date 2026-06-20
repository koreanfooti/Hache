import Image from "next/image";
import { useMemo, useState } from "react";
import { players, type Player } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import type { ValdNordbordMetricRow, ValdNordbordTestRow } from "@/lib/ams/source-types";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

type NordbordDashboardProps = {
  copy: {
    common: Record<string, string>;
    development: Record<string, string>;
  };
  language: AmsLanguage;
  metrics: ValdNordbordMetricRow[];
  tests: ValdNordbordTestRow[];
};

type ForceSeriesPoint = {
  asymmetry: number;
  date: string;
  displayDate: string;
  left: number;
  right: number;
  testId: string;
  type: string;
};

const atlasLogo = "/ams/assets/hp-ams-logo.svg";
const nordbordLogo = "/ams/assets/testing/nordbord-logo.png";

export function NordbordDashboard({ copy, language, metrics, tests }: NordbordDashboardProps) {
  const labels = nordbordLabels(language);
  const orderedTests = useMemo(() => sortNordbordRows(tests), [tests]);
  const playerIds = useMemo(() => unique(orderedTests.map((row) => row.amsId)), [orderedTests]);
  const playerById = useMemo(() => new Map(players.map((player) => [player.amsId, player])), []);
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedPlayerId, setSelectedPlayerId] = useState(playerIds[0] ?? "");
  const [selectedTestType, setSelectedTestType] = useState("all");
  const allDates = useMemo(() => unique(orderedTests.map((row) => dateInputValue(row.testDateUtc))).sort(), [orderedTests]);
  const [fromDate, setFromDate] = useState(allDates[0] ?? "");
  const [toDate, setToDate] = useState(allDates.at(-1) ?? "");
  const positionOptions = useMemo(() => {
    const positions = playerIds
      .map((id) => playerById.get(id)?.position)
      .filter(Boolean);

    return ["all", ...unique(positions)];
  }, [playerById, playerIds]);
  const filteredPlayerIds = useMemo(
    () => playerIds.filter((id) => selectedPosition === "all" || (playerById.get(id)?.position ?? labels.unassigned) === selectedPosition),
    [labels.unassigned, playerById, playerIds, selectedPosition],
  );
  const activePlayerId = filteredPlayerIds.includes(selectedPlayerId) ? selectedPlayerId : filteredPlayerIds[0] ?? playerIds[0] ?? "";
  const activePlayer = playerById.get(activePlayerId) ?? fallbackPlayer(activePlayerId, copy.common.unknownPlayer);
  const activePlayerRows = useMemo(
    () => orderedTests.filter((row) => row.amsId === activePlayerId),
    [activePlayerId, orderedTests],
  );
  const testTypeOptions = useMemo(() => ["all", ...unique(activePlayerRows.map((row) => row.testTypeName))], [activePlayerRows]);
  const filteredRows = useMemo(
    () => activePlayerRows.filter((row) => {
      const date = dateInputValue(row.testDateUtc);
      const isAfterFrom = !fromDate || !date || date >= fromDate;
      const isBeforeTo = !toDate || !date || date <= toDate;
      const isType = selectedTestType === "all" || row.testTypeName === selectedTestType;

      return isAfterFrom && isBeforeTo && isType;
    }),
    [activePlayerRows, fromDate, selectedTestType, toDate],
  );
  const series = useMemo(() => filteredRows.map(rowToSeriesPoint), [filteredRows]);
  const latestTest = filteredRows.at(-1);
  const leftMaxReference = maxValue(filteredRows.map((row) => row.leftMaxForce));
  const rightMaxReference = maxValue(filteredRows.map((row) => row.rightMaxForce));
  const leftMax = numberValue(latestTest?.leftMaxForce);
  const rightMax = numberValue(latestTest?.rightMaxForce);
  const leftChange = changeFromMax(leftMax, leftMaxReference);
  const rightChange = changeFromMax(rightMax, rightMaxReference);
  const asymmetryValues = series.map((point) => point.asymmetry);
  const averageAsymmetry = average(asymmetryValues);
  const maximumAsymmetry = Math.max(0, ...asymmetryValues.map((value) => Math.abs(value)));
  const selectedMetric = metrics.find((row) => row.testId === latestTest?.testId);

  return (
    <article className="nordbord-powerbi-dashboard">
      <header className="nordbord-report-header">
        <div className="nordbord-date-slicer" aria-label={labels.dateSlicer}>
          <label>
            <span>{labels.from}</span>
            <input value={fromDate} min={allDates[0] ?? undefined} max={toDate || allDates.at(-1) || undefined} type="date" onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label>
            <span>{labels.to}</span>
            <input value={toDate} min={fromDate || allDates[0] || undefined} max={allDates.at(-1) || undefined} type="date" onChange={(event) => setToDate(event.target.value)} />
          </label>
          <label>
            <span>{labels.category}</span>
            <select value={selectedTestType} onChange={(event) => setSelectedTestType(event.target.value)}>
              {testTypeOptions.map((type) => (
                <option key={type} value={type}>{type === "all" ? labels.all : type}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="nordbord-title-lockup">
          <h3>{labels.title}</h3>
          <Image src={nordbordLogo} alt="NordBord logo" width={134} height={64} />
        </div>
        <div className="nordbord-atlas-lockup">
          <span>Atlas FC {language === "es" ? "Rendimiento" : "Performance"}</span>
          <Image src={atlasLogo} alt="Atlas FC" width={76} height={76} />
        </div>
      </header>

      <section className="nordbord-layout">
        <aside className="nordbord-player-panel">
          <div className="nordbord-player-photo-card">
            <Image className="nordbord-player-crest" src={atlasLogo} alt="" width={210} height={210} />
            {hasPlayerPhoto(activePlayer) ? (
              <Image className="nordbord-player-photo" src={activePlayer.photo} alt="" width={240} height={240} />
            ) : (
              <span className="nordbord-player-photo-fallback">{activePlayer.number}</span>
            )}
          </div>
          <strong className="nordbord-player-title">{labels.player}</strong>
          <label className="nordbord-player-select">
            <span>{labels.player}</span>
            <select value={activePlayerId} onChange={(event) => setSelectedPlayerId(event.target.value)}>
              {filteredPlayerIds.map((id) => {
                const player = playerById.get(id) ?? fallbackPlayer(id, copy.common.unknownPlayer);
                return <option key={id} value={id}>{player.name}</option>;
              })}
            </select>
          </label>
          <div className="nordbord-info-card">
            <h4>{labels.info}</h4>
            <div>
              <span>{labels.number}</span>
              <strong>{activePlayer.number}</strong>
            </div>
            <div>
              <span>{labels.age}</span>
              <strong>{activePlayer.age}</strong>
            </div>
            <div>
              <span>{labels.height}</span>
              <strong>{activePlayer.height}</strong>
            </div>
            <div>
              <span>{labels.foot}</span>
              <strong>{activePlayer.foot}</strong>
            </div>
            <div className="nordbord-info-wide">
              <span>{labels.position}</span>
              <strong>{positionLabel(activePlayer.position, language)}</strong>
            </div>
            <div className="nordbord-info-wide">
              <span>{labels.latestTest}</span>
              <strong>{formatShortDate(latestTest?.testDateUtc) || copy.common.noDate}</strong>
            </div>
          </div>
        </aside>

        <main className="nordbord-report-main">
          <div className="nordbord-position-row">
            <span>{labels.position}</span>
            <div role="group" aria-label={labels.position}>
              {positionOptions.map((position) => (
                <button
                  className={(selectedPosition === position ? "is-active " : "") + "nordbord-position-button"}
                  key={position}
                  type="button"
                  onClick={() => setSelectedPosition(position)}
                >
                  {position === "all" ? labels.all : positionLabel(position, language)}
                </button>
              ))}
            </div>
          </div>

          <section className="nordbord-kpi-row">
            <NordbordKpi label={labels.leftMaxForce} value={forceLabel(leftMax)} />
            <NordbordKpi label={labels.rightMaxForce} value={forceLabel(rightMax)} />
            <NordbordKpi label={labels.leftChange} value={percentLabel(leftChange)} tone={changeTone(leftChange)} />
            <NordbordKpi label={labels.rightChange} value={percentLabel(rightChange)} tone={changeTone(rightChange)} />
            <NordbordKpi label={labels.avgAsymmetry} value={percentLabel(averageAsymmetry)} />
            <NordbordKpi label={labels.maxAsymmetry} value={percentLabel(maximumAsymmetry)} />
          </section>

          {series.length ? (
            <>
              <ForceBarChart labels={labels} points={series} />
              <AsymmetryLineChart labels={labels} points={series} />
            </>
          ) : (
            <div className="nordbord-empty-state">{copy.common.noRecords}</div>
          )}

          {selectedMetric ? (
            <section className="nordbord-metric-ribbon">
              <span>{labels.forcePerKg}: {forcePerKgLabel(selectedMetric.leftMaxForcePerKg)} / {forcePerKgLabel(selectedMetric.rightMaxForcePerKg)}</span>
              <span>{labels.timeToMax}: {secondsLabel(selectedMetric.leftAvgTimeToMaxForceSeconds)} / {secondsLabel(selectedMetric.rightAvgTimeToMaxForceSeconds)}</span>
            </section>
          ) : null}
        </main>
      </section>
    </article>
  );
}

function NordbordKpi({ label, tone = "neutral", value }: { label: string; tone?: string; value: string }) {
  return (
    <article className={`nordbord-kpi-card is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ForceBarChart({ labels, points }: { labels: ReturnType<typeof nordbordLabels>; points: ForceSeriesPoint[] }) {
  const width = 980;
  const height = 292;
  const padding = { bottom: 54, left: 42, right: 20, top: 30 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = points.flatMap((point) => [point.left, point.right]);
  const p25 = percentile(values, 25);
  const p50 = percentile(values, 50);
  const p75 = percentile(values, 75);
  const maxForce = Math.max(100, ...values, p75) * 1.16;
  const slot = innerWidth / Math.max(1, points.length);
  const barWidth = Math.max(10, Math.min(24, slot * 0.23));
  const yFor = (value: number) => padding.top + innerHeight - (value / maxForce) * innerHeight;
  const lineY = (value: number) => yFor(value);

  return (
    <section className="nordbord-chart-card">
      <div className="nordbord-chart-legend">
        <span><i className="is-left" />{labels.leftMaxForce}</span>
        <span><i className="is-right" />{labels.rightMaxForce}</span>
        <span><i className="is-p50" />{labels.percentile50}</span>
        <span><i className="is-p75" />{labels.percentile75}</span>
        <span><i className="is-p25" />{labels.percentile25}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.forceChart}>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding.top + innerHeight - tick * innerHeight;
          return <line className="nordbord-grid-line" key={tick} x1={padding.left} x2={width - padding.right} y1={y} y2={y} />;
        })}
        <ThresholdLine label={`${labels.median}: ${compactNumber(p50, 0)}`} value={p50} x1={padding.left} x2={width - padding.right} y={lineY(p50)} tone="p50" />
        <ThresholdLine label={compactNumber(p75, 0)} value={p75} x1={padding.left} x2={width - padding.right} y={lineY(p75)} tone="p75" />
        <ThresholdLine label={compactNumber(p25, 0)} value={p25} x1={padding.left} x2={width - padding.right} y={lineY(p25)} tone="p25" />
        {points.map((point, index) => {
          const centerX = padding.left + slot * index + slot / 2;
          const leftHeight = innerHeight - (yFor(point.left) - padding.top);
          const rightHeight = innerHeight - (yFor(point.right) - padding.top);

          return (
            <g key={point.testId}>
              <rect className="nordbord-force-bar is-left" x={centerX - barWidth - 2} y={yFor(point.left)} width={barWidth} height={Math.max(2, leftHeight)} rx="2" />
              <rect className="nordbord-force-bar is-right" x={centerX + 2} y={yFor(point.right)} width={barWidth} height={Math.max(2, rightHeight)} rx="2" />
              <text className="nordbord-bar-value" x={centerX - barWidth / 2 - 2} y={yFor(point.left) - 8}>{compactNumber(point.left, 0)}</text>
              <text className="nordbord-bar-value" x={centerX + barWidth / 2 + 2} y={yFor(point.right) - 8}>{compactNumber(point.right, 0)}</text>
              <text className="nordbord-axis-label" transform={`translate(${centerX - 18} ${height - 18}) rotate(-36)`}>{point.displayDate}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function AsymmetryLineChart({ labels, points }: { labels: ReturnType<typeof nordbordLabels>; points: ForceSeriesPoint[] }) {
  const width = 980;
  const height = 192;
  const padding = { bottom: 44, left: 42, right: 20, top: 20 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = points.map((point) => point.asymmetry);
  const minValue = Math.min(-40, ...values) - 4;
  const maxValue = Math.max(20, ...values) + 4;
  const xFor = (index: number) => padding.left + (innerWidth / Math.max(1, points.length - 1)) * index;
  const yFor = (value: number) => padding.top + ((maxValue - value) / (maxValue - minValue)) * innerHeight;
  const polyline = points.map((point, index) => `${xFor(index)},${yFor(point.asymmetry)}`).join(" ");
  const zeroY = yFor(0);

  return (
    <section className="nordbord-chart-card nordbord-line-card">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.asymmetryChart}>
        <line className="nordbord-grid-line is-zero" x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} />
        <polyline className="nordbord-asymmetry-line" points={polyline} />
        {points.map((point, index) => {
          const x = xFor(index);
          const y = yFor(point.asymmetry);
          return (
            <g key={point.testId}>
              <circle className="nordbord-asymmetry-dot" cx={x} cy={y} r="3.6" />
              <text className="nordbord-line-value" x={x} y={y - 10}>{compactNumber(point.asymmetry, 0)}</text>
              <text className="nordbord-axis-label" transform={`translate(${x - 18} ${height - 14}) rotate(-32)`}>{point.displayDate}</text>
            </g>
          );
        })}
        <text className="nordbord-y-label" transform={`translate(15 ${height / 2 + 30}) rotate(-90)`}>{labels.asymmetry}</text>
      </svg>
    </section>
  );
}

function ThresholdLine({ label, tone, x1, x2, y }: { label: string; tone: string; value: number; x1: number; x2: number; y: number }) {
  return (
    <g>
      <line className={`nordbord-threshold-line is-${tone}`} x1={x1} x2={x2} y1={y} y2={y} />
      <text className={`nordbord-threshold-label is-${tone}`} x={x1 + 14} y={y - 7}>{label}</text>
    </g>
  );
}

function nordbordLabels(language: AmsLanguage) {
  if (language === "es") {
    return {
      age: "Edad",
      all: "Todos",
      asymmetry: "Desequilibrio (%)",
      asymmetryChart: "Desequilibrio por fecha",
      avgAsymmetry: "Promedio desequilibrio (%)",
      category: "Categoría",
      dateSlicer: "Filtro de fecha",
      foot: "Pie",
      forceChart: "Fuerza máxima izquierda y derecha por fecha",
      forcePerKg: "Fuerza por kg",
      from: "Desde",
      height: "Altura",
      info: "Información",
      latestTest: "Última prueba",
      leftChange: "L cambio de max %",
      leftMaxForce: "L max fuerza (N)",
      maxAsymmetry: "Max desequilibrio (%)",
      median: "Mediana",
      number: "Número",
      percentile25: "Percentil 25",
      percentile50: "Percentil 50",
      percentile75: "Percentil 75",
      player: "Jugador",
      position: "Posición",
      rightChange: "R cambio de max %",
      rightMaxForce: "R max fuerza (N)",
      timeToMax: "Tiempo al pico",
      title: "Prueba - NordBord",
      to: "Hasta",
      unassigned: "Sin asignar",
    };
  }

  return {
    age: "Age",
    all: "All",
    asymmetry: "Asymmetry (%)",
    asymmetryChart: "Asymmetry percentage by date",
    avgAsymmetry: "Average asymmetry (%)",
    category: "Category",
    dateSlicer: "Date slicer",
    foot: "Foot",
    forceChart: "Left and right max force by date",
    forcePerKg: "Force per kg",
    from: "From",
    height: "Height",
    info: "Information",
    latestTest: "Latest test",
    leftChange: "L change from max %",
    leftMaxForce: "L max force (N)",
    maxAsymmetry: "Max asymmetry (%)",
    median: "Median",
    number: "Number",
    percentile25: "25th percentile",
    percentile50: "50th percentile",
    percentile75: "75th percentile",
    player: "Player",
    position: "Position",
    rightChange: "R change from max %",
    rightMaxForce: "R max force (N)",
    timeToMax: "Time to max",
    title: "Test - NordBord",
    to: "To",
    unassigned: "Unassigned",
  };
}

function sortNordbordRows(rows: ValdNordbordTestRow[]) {
  return [...rows].sort((a, b) => String(a.testDateUtc).localeCompare(String(b.testDateUtc)));
}

function rowToSeriesPoint(row: ValdNordbordTestRow): ForceSeriesPoint {
  const left = numberValue(row.leftMaxForce);
  const right = numberValue(row.rightMaxForce);

  return {
    asymmetry: signedAsymmetry(left, right),
    date: dateInputValue(row.testDateUtc),
    displayDate: formatShortDate(row.testDateUtc),
    left,
    right,
    testId: row.testId ?? `${row.amsId}-${row.testDateUtc}`,
    type: row.testTypeName ?? "NordBord",
  };
}

function signedAsymmetry(left: number, right: number) {
  const peak = Math.max(left, right);
  return peak ? ((left - right) / peak) * 100 : 0;
}

function changeFromMax(value: number, maxReference: number) {
  if (!maxReference) return 0;
  return ((value - maxReference) / maxReference) * 100;
}

function changeTone(value: number) {
  if (value >= 0) return "positive";
  if (value <= -15) return "red";
  if (value <= -10) return "orange";
  if (value <= -5) return "gold";
  return "neutral";
}

function percentile(values: number[], percent: number) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const index = (percent / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function maxValue(values: unknown[]) {
  return Math.max(0, ...values.map(numberValue));
}

function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value));
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

function forceLabel(value: number) {
  return value ? compactNumber(value, 2) : "-";
}

function percentLabel(value: number) {
  if (!Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${compactNumber(value, 2)}`;
}

function forcePerKgLabel(value: unknown) {
  const numericValue = numberValue(value);
  return numericValue ? `${compactNumber(numericValue, 2)} N/kg` : "-";
}

function secondsLabel(value: unknown) {
  const numericValue = numberValue(value);
  return numericValue ? `${compactNumber(numericValue, 2)} s` : "-";
}

function dateInputValue(value: string | undefined) {
  return formatShortDate(value);
}

function formatShortDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function fallbackPlayer(amsId: string, unknownPlayer: string): Player {
  return {
    age: "-",
    amsId,
    foot: "-",
    height: "-",
    id: amsId || "unknown-player",
    name: amsId || unknownPlayer,
    nationality: "-",
    number: "-",
    photo: "",
    position: "Unassigned",
    status: "pending",
    weight: "-",
  };
}

function positionLabel(position: string | undefined, language: AmsLanguage) {
  const labels: Record<string, string> = language === "es"
    ? {
      Defender: "Defensa",
      Forward: "Delantero",
      Goalkeeper: "Portero",
      Midfielder: "Mediocampista",
      Unassigned: "Sin asignar",
    }
    : {};

  return labels[position ?? ""] ?? position ?? "-";
}
