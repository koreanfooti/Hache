import Image from "next/image";
import { useMemo, useState } from "react";
import { players, type Player } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import type { ValdNordbordMetricRow, ValdNordbordTestRow } from "@/lib/ams/types";
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

const nordbordLogo = "/ams/assets/testing/nordbord-logo.png";

export function NordbordDashboard({ copy, language, metrics, tests }: NordbordDashboardProps) {
  const labels = nordbordLabels(language);
  const orderedTests = useMemo(() => sortNordbordRows(tests), [tests]);
  const playerIds = useMemo(() => unique(orderedTests.map((row) => row.amsId)), [orderedTests]);
  const playerById = useMemo(() => new Map(players.map((player) => [player.amsId, player])), []);
  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedPlayerId, setSelectedPlayerId] = useState(playerIds[0] ?? "");
  const [selectedTestType, setSelectedTestType] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hiddenTestIds, setHiddenTestIds] = useState<string[]>([]);
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
  const rowsBeforeTestFilter = useMemo(
    () => activePlayerRows.filter((row) => {
      const date = dateInputValue(row.testDateUtc);
      const isAfterFrom = !fromDate || !date || date >= fromDate;
      const isBeforeTo = !toDate || !date || date <= toDate;
      const isType = selectedTestType === "all" || row.testTypeName === selectedTestType;

      return isAfterFrom && isBeforeTo && isType;
    }),
    [activePlayerRows, fromDate, selectedTestType, toDate],
  );
  const testFilterOptions = useMemo(
    () => rowsBeforeTestFilter.map((row) => ({
      id: nordbordTestKey(row),
      label: formatDisplayDate(row.testDateUtc),
      type: row.testTypeName ?? "NordBord",
    })),
    [rowsBeforeTestFilter],
  );
  const filteredRows = useMemo(
    () => rowsBeforeTestFilter.filter((row) => !hiddenTestIds.includes(nordbordTestKey(row))),
    [hiddenTestIds, rowsBeforeTestFilter],
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
          <button className="nordbord-filter-toggle" type="button" onClick={() => setIsFilterOpen((isOpen) => !isOpen)}>
            {labels.filters}
          </button>
        </div>
      </header>

      <aside className={isFilterOpen ? "nordbord-filter-drawer is-open" : "nordbord-filter-drawer"} aria-label={labels.filters}>
        <div className="nordbord-filter-header">
          <strong>{labels.filters}</strong>
          <button type="button" onClick={() => setIsFilterOpen(false)}>{labels.close}</button>
        </div>
        <div className="nordbord-filter-actions">
          <button type="button" onClick={() => setHiddenTestIds([])}>{labels.selectAll}</button>
          <button type="button" onClick={() => setHiddenTestIds(testFilterOptions.map((option) => option.id))}>{labels.clear}</button>
        </div>
        <div className="nordbord-filter-section">
          <span>{labels.testDates}</span>
          <div className="nordbord-date-checkboxes">
            {testFilterOptions.map((option) => {
              const isChecked = !hiddenTestIds.includes(option.id);

              return (
                <label key={option.id}>
                  <input
                    checked={isChecked}
                    type="checkbox"
                    onChange={() => setHiddenTestIds((currentIds) => (
                      isChecked
                        ? [...currentIds, option.id]
                        : currentIds.filter((id) => id !== option.id)
                    ))}
                  />
                  <span>{option.label}</span>
                  <small>{option.type}</small>
                </label>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="nordbord-layout">
        <aside className="nordbord-player-panel">
          <div className="nordbord-player-photo-card">
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
  const height = 318;
  const padding = { bottom: 66, left: 42, right: 20, top: 30 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const values = points.flatMap((point) => [point.left, point.right]);
  const maxForce = Math.max(100, ...values) * 1.16;
  const slot = innerWidth / Math.max(1, points.length);
  const barWidth = Math.max(10, Math.min(24, slot * 0.23));
  const yFor = (value: number) => padding.top + innerHeight - (value / maxForce) * innerHeight;

  return (
    <section className="nordbord-chart-card">
      <div className="nordbord-chart-legend">
        <span><i className="is-left" />{labels.leftMaxForce}</span>
        <span><i className="is-right" />{labels.rightMaxForce}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={labels.forceChart}>
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const y = padding.top + innerHeight - tick * innerHeight;
          return <line className="nordbord-grid-line" key={tick} x1={padding.left} x2={width - padding.right} y1={y} y2={y} />;
        })}
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
              <text className="nordbord-axis-label" transform={`translate(${centerX - 18} ${height - 20}) rotate(-30)`}>{point.displayDate}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

function AsymmetryLineChart({ labels, points }: { labels: ReturnType<typeof nordbordLabels>; points: ForceSeriesPoint[] }) {
  const width = 980;
  const height = 214;
  const padding = { bottom: 54, left: 42, right: 20, top: 24 };
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
              <text className="nordbord-axis-label" transform={`translate(${x - 18} ${height - 18}) rotate(-28)`}>{point.displayDate}</text>
            </g>
          );
        })}
        <text className="nordbord-y-label" transform={`translate(15 ${height / 2 + 30}) rotate(-90)`}>{labels.asymmetry}</text>
      </svg>
    </section>
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
      filters: "Filtros",
      foot: "Pie",
      forceChart: "Fuerza máxima izquierda y derecha por fecha",
      forcePerKg: "Fuerza por kg",
      from: "Desde",
      height: "Altura",
      info: "Información",
      latestTest: "Última prueba",
      leftChange: "L cambio de max %",
      leftMaxForce: "L max fuerza (N)",
      clear: "Limpiar",
      close: "Cerrar",
      maxAsymmetry: "Max desequilibrio (%)",
      number: "Número",
      player: "Jugador",
      position: "Posición",
      rightChange: "R cambio de max %",
      rightMaxForce: "R max fuerza (N)",
      selectAll: "Seleccionar todo",
      testDates: "Fechas de prueba",
      timeToMax: "Tiempo al pico",
      title: "NordBord",
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
    filters: "Filters",
    foot: "Foot",
    forceChart: "Left and right max force by date",
    forcePerKg: "Force per kg",
    from: "From",
    height: "Height",
    info: "Information",
    latestTest: "Latest test",
    leftChange: "L change from max %",
    leftMaxForce: "L max force (N)",
    clear: "Clear",
    close: "Close",
    maxAsymmetry: "Max asymmetry (%)",
    number: "Number",
    player: "Player",
    position: "Position",
    rightChange: "R change from max %",
    rightMaxForce: "R max force (N)",
    selectAll: "Select all",
    testDates: "Test dates",
    timeToMax: "Time to max",
    title: "NordBord",
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
    displayDate: formatAxisDate(row.testDateUtc),
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

function nordbordTestKey(row: ValdNordbordTestRow) {
  return row.testId ?? `${row.amsId}-${row.testDateUtc}-${row.testTypeName}`;
}

function formatShortDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string | undefined) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return value?.slice(0, 10) || "-";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function formatAxisDate(value: string | undefined) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return value?.slice(0, 10) || "-";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
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
