"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { CleanGpsRow } from "@/lib/ams/types";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import { ChartTooltip, chartTooltipPosition, type ChartTooltipPayload, type ChartTooltipState } from "@/components/ams/ui/ChartTooltip";
import { LoadAthleteDashboard } from "@/components/ams/panels/load/LoadAthleteDashboard";

type LoadMetricKey = "totalDistance" | "hsrAbsDistance" | "hsrRelDistance" | "sprintDistance" | "highIntensityAccelerations" | "highIntensityDecelerations" | "playerLoad";
type AggregateMode = "sum" | "max" | "min" | "avg";

type LoadMetric = {
  key: LoadMetricKey;
  color: string;
  unit: string;
  aggregate: "sum" | "max" | "avg";
  label: Record<AmsLanguage, string>;
};

type ChartPoint = {
  id: string;
  label: string;
  value: number;
};

type NamedValue = {
  label: string;
  value: number;
  color?: string;
};

const loadMetrics: LoadMetric[] = [
  { key: "totalDistance", label: { en: "Total distance", es: "Distancia total" }, unit: "m", color: "#f2555b", aggregate: "sum" },
  { key: "hsrAbsDistance", label: { en: "HSR abs.", es: "HSR abs." }, unit: "m", color: "#d7b46a", aggregate: "sum" },
  { key: "hsrRelDistance", label: { en: "HSR rel.", es: "HSR rel." }, unit: "m", color: "#f0bd5b", aggregate: "sum" },
  { key: "sprintDistance", label: { en: "Sprint", es: "Sprint" }, unit: "m", color: "#ff8a3d", aggregate: "sum" },
  { key: "highIntensityAccelerations", label: { en: "HI Accel.", es: "Acel. AI" }, unit: "count", color: "#e24852", aggregate: "sum" },
  { key: "highIntensityDecelerations", label: { en: "HI Decel.", es: "Desac. AI" }, unit: "count", color: "#1e95ff", aggregate: "sum" },
  { key: "playerLoad", label: { en: "Player load", es: "Carga jugador" }, unit: "AU", color: "#29cd97", aggregate: "avg" },
];

const aggregateOptions: AggregateMode[] = ["sum", "max", "min", "avg"];

const chartCopy = {
  en: {
    trend: "Load Trend",
    trendSub: "Selectable GPS metric by recorded date",
    aggregation: "Daily calculation",
    filters: "Filters",
    close: "Close",
    selectAll: "Select all",
    clear: "Clear",
    trendDates: "Daily dates",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    visibleDays: "visible days",
    sum: "Sum",
    max: "Max",
    min: "Minimum",
    avg: "Average",
    sessionMix: "Session Mix",
    sessionMixSub: "Match, training, and recovery share",
    speed: "Speed Exposure",
    speedSub: "Peak-speed distribution by row",
    neuro: "Neuromuscular Load",
    neuroSub: "Acceleration vs deceleration volume",
    radar: "Team Profile",
    radarSub: "Normalized physical load profile",
    scatter: "Load Scatter",
    scatterSub: "Distance x high-intensity exposure",
    insights: "Performance Insights",
    noData: "No GPS rows available for this view yet.",
    match: "Match",
    training: "Training",
    recovery: "Recovery",
    other: "Other",
    distance: "Distance",
    hiIntensity: "Hi-int.",
    maxSpeed: "Speed",
    readiness: "Readiness",
    load: "Load",
  },
  es: {
    trend: "Tendencia de carga",
    trendSub: "Métrica GPS seleccionable por fecha registrada",
    aggregation: "Cálculo diario",
    filters: "Filtros",
    close: "Cerrar",
    selectAll: "Seleccionar todo",
    clear: "Limpiar",
    trendDates: "Fechas diarias",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    visibleDays: "días visibles",
    sum: "Suma",
    max: "Máximo",
    min: "Mínimo",
    avg: "Promedio",
    sessionMix: "Mezcla de sesiones",
    sessionMixSub: "Distribución partido, entrenamiento y recuperación",
    speed: "Exposición de velocidad",
    speedSub: "Distribución por velocidad pico",
    neuro: "Carga neuromuscular",
    neuroSub: "Volumen de aceleración vs desaceleración",
    radar: "Perfil del equipo",
    radarSub: "Perfil físico normalizado",
    scatter: "Dispersión de carga",
    scatterSub: "Distancia x exposición de alta intensidad",
    insights: "Insights de rendimiento",
    noData: "Todavía no hay filas GPS disponibles para esta vista.",
    match: "Partido",
    training: "Entrenamiento",
    recovery: "Recuperación",
    other: "Otro",
    distance: "Distancia",
    hiIntensity: "Alta int.",
    maxSpeed: "Velocidad",
    readiness: "Disponibilidad",
    load: "Carga",
  },
};

export function LoadVisualDashboard({ language, rows }: { language: AmsLanguage; rows: CleanGpsRow[] }) {
  const [selectedMetricKey, setSelectedMetricKey] = useState<LoadMetricKey>("totalDistance");
  const [selectedAggregate, setSelectedAggregate] = useState<AggregateMode>("sum");
  const [hiddenTrendDates, setHiddenTrendDates] = useState<string[]>([]);
  const [isTrendFilterOpen, setIsTrendFilterOpen] = useState(false);
  const copy = chartCopy[language];
  const selectedMetric = loadMetrics.find((metric) => metric.key === selectedMetricKey) ?? loadMetrics[0];
  const sortedRows = useMemo(
    () => [...rows].filter((row) => row.date).sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [rows],
  );
  const trendDateOptions = useMemo(() => trendDateFilterOptions(sortedRows), [sortedRows]);
  const trendRows = useMemo(
    () => aggregateByDate(sortedRows.filter((row) => !hiddenTrendDates.includes(dateKey(row))), selectedMetric, selectedAggregate),
    [hiddenTrendDates, selectedAggregate, selectedMetric, sortedRows],
  );
  const sessionMix = useMemo(() => sessionMixValues(sortedRows, language), [language, sortedRows]);
  const speedExposure = useMemo(() => speedExposureValues(sortedRows), [sortedRows]);
  const neuroLoad = useMemo(() => neuroLoadValues(sortedRows, language), [language, sortedRows]);
  const radarValues = useMemo(() => radarProfileValues(sortedRows, language), [language, sortedRows]);
  const scatterRows = useMemo(() => sortedRows.slice(-120), [sortedRows]);
  const insights = useMemo(() => performanceInsights(sortedRows, language), [language, sortedRows]);

  if (!sortedRows.length) {
    return (
      <section className="load-visual-empty">
        <strong>{copy.noData}</strong>
      </section>
    );
  }

  return (
    <section className="load-visual-dashboard">
      <article className="load-chart-panel load-wide-chart">
        <div className="panel-heading load-trend-heading">
          <div>
            <h3>{copy.trend}</h3>
            <span>{copy.trendSub}</span>
          </div>
          <div className="load-trend-header-actions">
            <div className="load-metric-buttons" aria-label={copy.trend}>
              {loadMetrics.map((metric) => (
                <button
                  className={metric.key === selectedMetricKey ? "is-active" : ""}
                  key={metric.key}
                  type="button"
                  onClick={() => setSelectedMetricKey(metric.key)}
                >
                  {metric.label[language]}
                </button>
              ))}
            </div>
            <button className="load-filter-toggle" type="button" onClick={() => setIsTrendFilterOpen((isOpen) => !isOpen)}>
              {copy.filters}
            </button>
          </div>
        </div>
        <div className="load-trend-control-row">
          <div className="load-aggregate-buttons" aria-label={copy.aggregation}>
            <span>{copy.aggregation}</span>
            {aggregateOptions.map((option) => (
              <button
                className={option === selectedAggregate ? "is-active" : ""}
                key={option}
                type="button"
                onClick={() => setSelectedAggregate(option)}
              >
                {copy[option]}
              </button>
            ))}
          </div>
          <small>
            {trendRows.length} {copy.visibleDays}
          </small>
        </div>
        <LoadTrendFilterDrawer
          copy={copy}
          hiddenDates={hiddenTrendDates}
          isOpen={isTrendFilterOpen}
          options={trendDateOptions}
          onClear={() => setHiddenTrendDates(trendDateOptions.map((option) => option.id))}
          onClose={() => setIsTrendFilterOpen(false)}
          onSelectAll={() => setHiddenTrendDates([])}
          onToggleDate={(dateId) => {
            setHiddenTrendDates((current) => (current.includes(dateId) ? current.filter((id) => id !== dateId) : [...current, dateId]));
          }}
        />
        <TrendBarChart copy={copy} metric={selectedMetric} points={trendRows} />
      </article>

      <article className="load-chart-panel load-wide-chart">
        <LoadAthleteDashboard language={language} rows={sortedRows} />
      </article>

      <article className="load-chart-panel">
        <ChartHeading title={copy.sessionMix} subtitle={copy.sessionMixSub} />
        <DonutChart values={sessionMix} />
      </article>

      <article className="load-chart-panel">
        <ChartHeading title={copy.speed} subtitle={copy.speedSub} />
        <VerticalBars values={speedExposure} />
      </article>

      <article className="load-chart-panel">
        <ChartHeading title={copy.neuro} subtitle={copy.neuroSub} />
        <VerticalBars values={neuroLoad} />
      </article>

      <article className="load-chart-panel">
        <ChartHeading title={copy.radar} subtitle={copy.radarSub} />
        <RadarChart values={radarValues} />
      </article>

      <article className="load-chart-panel load-wide-chart">
        <ChartHeading title={copy.scatter} subtitle={copy.scatterSub} />
        <ScatterPlot rows={scatterRows} language={language} />
      </article>

      <article className="load-chart-panel load-insight-card">
        <ChartHeading title={copy.insights} subtitle={`${compactNumber(sortedRows.length)} WIMU/GPS rows`} />
        <div className="load-insight-list">
          {insights.map((insight) => (
            <article key={insight.title}>
              <strong>{insight.title}</strong>
              <p>{insight.body}</p>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function ChartHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="panel-heading">
      <div>
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}

function TrendBarChart({ copy, metric, points }: { copy: typeof chartCopy.en; metric: LoadMetric; points: ChartPoint[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const [zoom, setZoom] = useState(1);
  const width = Math.max(780, points.length * 58 * zoom + 84);
  const height = 280;
  const padX = 42;
  const bottomPad = 58;
  const topPad = 26;
  const plotHeight = height - bottomPad - topPad;
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const slot = (width - padX * 2) / Math.max(1, points.length);
  const barWidth = Math.max(8, Math.min(54, slot * 0.48));
  const zoomLabel = `${Math.round(zoom * 100)}%`;
  const chartStyle = {
    "--trend-label-size": `${Math.min(12, 7.5 + zoom * 1.8)}px`,
    "--trend-value-size": `${Math.min(16, 8.5 + zoom * 2.8)}px`,
    maxWidth: "none",
    width: `${width}px`,
  } as CSSProperties;

  return (
    <>
      <div className="load-chart-toolbar" aria-label="Load trend zoom">
        <button type="button" onClick={() => setZoom((value) => Math.max(0.65, Number((value - 0.2).toFixed(2))))}>{copy.zoomOut}</button>
        <span>{zoomLabel}</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(2.6, Number((value + 0.2).toFixed(2))))}>{copy.zoomIn}</button>
      </div>
      <div className="load-trend-scroll" tabIndex={0} onMouseLeave={() => setTooltip(null)}>
        <svg className="load-svg-chart" style={chartStyle} viewBox={`0 0 ${width} ${height}`} role="img">
          <ChartGrid width={width} height={height} left={padX} right={20} top={topPad} bottom={bottomPad} />
          {points.map((point, index) => {
            const barHeight = (point.value / maxValue) * plotHeight;
            const center = padX + index * slot + slot / 2;
            const y = height - bottomPad - barHeight;
            return (
              <g
                key={point.id}
                onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".load-chart-panel"), payload: loadTrendTooltip(metric, point) })}
              >
                <rect className="load-trend-bar" x={center - barWidth / 2} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="5" style={{ fill: metric.color }} />
                {slot > 32 ? <text className="load-chart-value" x={center} y={Math.max(15, y - 8)}>{metricValueLabel(point.value, metric)}</text> : null}
                <text className="load-chart-label" x={center} y={height - 30} transform={`rotate(-35 ${center} ${height - 30})`}>{point.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <ChartTooltip tooltip={tooltip} />
    </>
  );
}

function LoadTrendFilterDrawer({
  copy,
  hiddenDates,
  isOpen,
  options,
  onClear,
  onClose,
  onSelectAll,
  onToggleDate,
}: {
  copy: typeof chartCopy.en;
  hiddenDates: string[];
  isOpen: boolean;
  options: Array<{ id: string; label: string; count: number }>;
  onClear: () => void;
  onClose: () => void;
  onSelectAll: () => void;
  onToggleDate: (dateId: string) => void;
}) {
  return (
    <aside className={`load-trend-filter-drawer${isOpen ? " is-open" : ""}`} aria-hidden={!isOpen}>
      <div className="load-trend-filter-header">
        <div>
          <strong>{copy.filters}</strong>
          <span>{copy.trendDates}</span>
        </div>
        <button type="button" onClick={onClose}>
          {copy.close}
        </button>
      </div>
      <div className="load-trend-filter-actions">
        <button type="button" onClick={onSelectAll}>
          {copy.selectAll}
        </button>
        <button type="button" onClick={onClear}>
          {copy.clear}
        </button>
      </div>
      <div className="load-trend-date-checkboxes">
        {options.map((option) => (
          <label key={option.id}>
            <input checked={!hiddenDates.includes(option.id)} type="checkbox" onChange={() => onToggleDate(option.id)} />
            <span>{option.label}</span>
            <small>{option.count}</small>
          </label>
        ))}
      </div>
    </aside>
  );
}

function DonutChart({ values }: { values: NamedValue[] }) {
  const total = Math.max(1, values.reduce((sum, item) => sum + item.value, 0));
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const segments = values.reduce<Array<NamedValue & { dashOffset: number; length: number }>>((items, item) => {
    const previousOffset = items.reduce((sum, segment) => sum + segment.length, 0);
    const length = (item.value / total) * circumference;
    return [...items, { ...item, dashOffset: -previousOffset, length }];
  }, []);

  return (
    <div className="load-donut-wrap">
      <svg className="load-donut-chart" viewBox="0 0 180 180" role="img">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="24" />
        {segments.map((item) => {
          return (
            <circle
              key={item.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeDasharray={`${item.length} ${circumference - item.length}`}
              strokeDashoffset={item.dashOffset}
              strokeLinecap="round"
              strokeWidth="24"
              transform="rotate(-90 90 90)"
            />
          );
        })}
        <text className="load-donut-total" x="90" y="86">{compactNumber(total)}</text>
        <text className="load-donut-caption" x="90" y="106">rows</text>
      </svg>
      <ChartLegend values={values} />
    </div>
  );
}

function VerticalBars({ values }: { values: NamedValue[] }) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const width = 340;
  const height = 230;
  const padX = 34;
  const bottomPad = 46;
  const topPad = 26;
  const maxValue = Math.max(1, ...values.map((item) => item.value));
  const slot = (width - padX * 2) / Math.max(1, values.length);
  const barWidth = Math.max(24, Math.min(58, slot * 0.52));

  return (
    <>
      <svg className="load-svg-chart" viewBox={`0 0 ${width} ${height}`} role="img" onMouseLeave={() => setTooltip(null)}>
        <ChartGrid width={width} height={height} left={padX} right={20} top={topPad} bottom={bottomPad} />
        {values.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - topPad - bottomPad);
          const center = padX + index * slot + slot / 2;
          const y = height - bottomPad - barHeight;
          return (
            <g
              key={item.label}
              onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".load-chart-panel"), payload: namedValueTooltip(item) })}
            >
              <rect x={center - barWidth / 2} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="7" fill={item.color ?? "#d31f2f"} />
              <text className="load-chart-value" x={center} y={Math.max(15, y - 8)}>{compactNumber(item.value)}</text>
              <text className="load-chart-label" x={center} y={height - 20}>{item.label}</text>
            </g>
          );
        })}
      </svg>
      <ChartTooltip tooltip={tooltip} />
    </>
  );
}

function RadarChart({ values }: { values: NamedValue[] }) {
  const width = 340;
  const height = 260;
  const cx = width / 2;
  const cy = height / 2 + 4;
  const radius = 86;
  const polygon = values.map((item, index) => radarPoint(cx, cy, radius * (item.value / 100), index, values.length)).map(pointString).join(" ");

  return (
    <svg className="load-svg-chart load-radar-chart" viewBox={`0 0 ${width} ${height}`} role="img">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon key={scale} className="load-radar-ring" points={values.map((_, index) => pointString(radarPoint(cx, cy, radius * scale, index, values.length))).join(" ")} />
      ))}
      {values.map((item, index) => {
        const outer = radarPoint(cx, cy, radius, index, values.length);
        const label = radarPoint(cx, cy, radius + 24, index, values.length);
        return (
          <g key={item.label}>
            <line className="load-radar-axis" x1={cx} y1={cy} x2={outer.x} y2={outer.y} />
            <text className="load-chart-label" x={label.x} y={label.y}>{item.label}</text>
          </g>
        );
      })}
      <polygon className="load-radar-area" points={polygon} />
      {values.map((item, index) => {
        const point = radarPoint(cx, cy, radius * (item.value / 100), index, values.length);
        return <circle key={item.label} className="load-radar-dot" cx={point.x} cy={point.y} r="4" />;
      })}
    </svg>
  );
}

function ScatterPlot({ language, rows }: { language: AmsLanguage; rows: CleanGpsRow[] }) {
  const width = 780;
  const height = 280;
  const padX = 50;
  const bottomPad = 44;
  const topPad = 24;
  const maxX = Math.max(1, ...rows.map(totalDistanceValue));
  const maxY = Math.max(1, ...rows.map(highIntensityValue));
  const copy = chartCopy[language];

  return (
    <svg className="load-svg-chart load-scatter-chart" viewBox={`0 0 ${width} ${height}`} role="img">
      <ChartGrid width={width} height={height} left={padX} right={22} top={topPad} bottom={bottomPad} />
      {rows.map((row, index) => {
        const x = padX + (totalDistanceValue(row) / maxX) * (width - padX - 24);
        const y = height - bottomPad - (highIntensityValue(row) / maxY) * (height - topPad - bottomPad);
        const isMatch = matchCategory(row, language) === copy.match;
        return <circle key={`${row.sourceSessionId ?? row.date}-${index}`} className={isMatch ? "is-match" : ""} cx={x} cy={y} r={isMatch ? 4.5 : 3.2} />;
      })}
      <text className="load-axis-label" x={width / 2} y={height - 6}>{copy.distance}</text>
      <text className="load-axis-label" x="14" y={height / 2} transform={`rotate(-90 14 ${height / 2})`}>{copy.hiIntensity}</text>
    </svg>
  );
}

function ChartGrid({ width, height, left, right, top, bottom }: { width: number; height: number; left: number; right: number; top: number; bottom: number }) {
  return (
    <g className="load-chart-grid">
      {[0, 1, 2, 3].map((index) => {
        const y = top + index * ((height - top - bottom) / 3);
        return <line key={index} x1={left} x2={width - right} y1={y} y2={y} />;
      })}
    </g>
  );
}

function ChartLegend({ values }: { values: NamedValue[] }) {
  return (
    <div className="load-chart-legend">
      {values.map((item) => (
        <span key={item.label}>
          <i style={{ background: item.color }} />
          {item.label} <b>{compactNumber(item.value)}</b>
        </span>
      ))}
    </div>
  );
}

function aggregateByDate(rows: CleanGpsRow[], metric: LoadMetric, mode: AggregateMode) {
  const map = new Map<string, number[]>();
  for (const row of rows) {
    const key = dateKey(row);
    if (!key) continue;
    const value = metricValue(row, metric.key);
    map.set(key, [...(map.get(key) ?? []), value]);
  }

  return [...map.entries()].map(([date, values]) => ({
    id: date,
    label: shortDate(date),
    value: aggregateMetricValues(values, mode),
  }));
}

function trendDateFilterOptions(rows: CleanGpsRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = dateKey(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([id, count]) => ({ id, label: longDate(id), count }));
}

function aggregateMetricValues(values: number[], mode: AggregateMode) {
  const cleanValues = values.filter((value) => Number.isFinite(value));
  if (!cleanValues.length) return 0;
  if (mode === "max") return Math.max(...cleanValues);
  if (mode === "min") return Math.min(...cleanValues);
  if (mode === "avg") return cleanValues.reduce((total, value) => total + value, 0) / cleanValues.length;
  return cleanValues.reduce((total, value) => total + value, 0);
}

function sessionMixValues(rows: CleanGpsRow[], language: AmsLanguage): NamedValue[] {
  const copy = chartCopy[language];
  const colors = {
    [copy.match]: "#d31f2f",
    [copy.training]: "#d7b46a",
    [copy.recovery]: "#29cd97",
    [copy.other]: "#7f1821",
  };
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = matchCategory(row, language);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, value]) => ({ label, value, color: colors[label] ?? "#f2555b" }));
}

function speedExposureValues(rows: CleanGpsRow[]): NamedValue[] {
  return [
    { label: "21-24", value: rows.filter((row) => maxSpeedValue(row) >= 21 && maxSpeedValue(row) < 24).length, color: "#d7b46a" },
    { label: "24-27", value: rows.filter((row) => maxSpeedValue(row) >= 24 && maxSpeedValue(row) < 27).length, color: "#f2555b" },
    { label: "27+", value: rows.filter((row) => maxSpeedValue(row) >= 27).length, color: "#d31f2f" },
  ];
}

function neuroLoadValues(rows: CleanGpsRow[], language: AmsLanguage): NamedValue[] {
  return [
    { label: language === "es" ? "Acel. AI" : "HI Accel.", value: sum(rows, highIntensityAccelerationsValue), color: "#e24852" },
    { label: language === "es" ? "Desac. AI" : "HI Decel.", value: sum(rows, highIntensityDecelerationsValue), color: "#1e95ff" },
  ];
}

function radarProfileValues(rows: CleanGpsRow[], language: AmsLanguage): NamedValue[] {
  const copy = chartCopy[language];
  return [
    { label: copy.distance, value: clamp(average(rows, totalDistanceValue) / 120) },
    { label: copy.hiIntensity, value: clamp(average(rows, highIntensityValue) / 15) },
    { label: copy.maxSpeed, value: clamp(average(rows, maxSpeedValue) * 3) },
    { label: copy.readiness, value: readinessProxy(rows) },
    { label: copy.load, value: clamp(average(rows, playerLoadValue)) },
  ];
}

function performanceInsights(rows: CleanGpsRow[], language: AmsLanguage) {
  const distance = average(rows, totalDistanceValue);
  const highIntensityRatio = distance ? average(rows, highIntensityValue) / distance : 0;
  const maxSpeed = Math.max(0, ...rows.map(maxSpeedValue));
  const neuroRatio = sum(rows, highIntensityAccelerationsValue) / Math.max(1, sum(rows, highIntensityDecelerationsValue));

  if (language === "es") {
    return [
      { title: "Carga de partido", body: `La fila promedio registra ${compactNumber(distance)} m con ${compactNumber(highIntensityRatio * 100, 1)}% de alta intensidad.` },
      { title: "Velocidad", body: `La velocidad pico del filtro es ${compactNumber(maxSpeed, 1)} km/h. Vigila exposiciones semanales sobre 85-90% del pico.` },
      { title: "Neuromuscular", body: `La relación aceleración/desaceleración de alta intensidad es ${compactNumber(neuroRatio, 2)}, útil para revisar fatiga mecánica.` },
    ];
  }

  return [
    { title: "Match load", body: `Average row load is ${compactNumber(distance)} m with ${compactNumber(highIntensityRatio * 100, 1)}% high-intensity exposure.` },
    { title: "Speed", body: `Peak speed in this feed is ${compactNumber(maxSpeed, 1)} km/h. Watch weekly exposure above 85-90% of peak.` },
    { title: "Neuromuscular", body: `High-intensity acceleration/deceleration ratio is ${compactNumber(neuroRatio, 2)}, useful for mechanical fatigue review.` },
  ];
}

function matchCategory(row: CleanGpsRow, language: AmsLanguage) {
  const copy = chartCopy[language];
  const session = String(row.session_type ?? row.sessionName ?? row.session_name ?? "").toLowerCase();
  const isMatch = String(row.isMatch ?? "").trim() === "1" || session.includes(" vs ") || session.includes("partido");
  if (isMatch) return copy.match;
  if (session.includes("rec") || session.includes("regen") || session.includes("compensatorio")) return copy.recovery;
  if (session) return copy.training;
  return copy.other;
}

function totalDistanceValue(row: CleanGpsRow) {
  return numberValue(row.totalDistance ?? row.total_distance_m);
}

function highIntensityValue(row: CleanGpsRow) {
  return numberValue(row.hsrAbsDistance ?? row.highIntensityDistance ?? row.high_intensity_m);
}

function maxSpeedValue(row: CleanGpsRow) {
  return numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed);
}

function playerLoadValue(row: CleanGpsRow) {
  return numberValue(row.playerLoad);
}

function highIntensityAccelerationsValue(row: CleanGpsRow) {
  return numberValue(row.highIntensityAccelerations);
}

function highIntensityDecelerationsValue(row: CleanGpsRow) {
  return numberValue(row.highIntensityDecelerations);
}

function metricValue(row: CleanGpsRow, key: LoadMetricKey) {
  if (key === "totalDistance") return totalDistanceValue(row);
  if (key === "hsrAbsDistance") return highIntensityValue(row);
  if (key === "highIntensityAccelerations") return highIntensityAccelerationsValue(row);
  if (key === "highIntensityDecelerations") return highIntensityDecelerationsValue(row);
  return numberValue(row[key]);
}

function average(rows: CleanGpsRow[], getter: (row: CleanGpsRow) => number) {
  const values = rows.map(getter).filter((value) => value > 0);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function sum(rows: CleanGpsRow[], getter: (row: CleanGpsRow) => number) {
  return rows.reduce((total, row) => total + getter(row), 0);
}

function readinessProxy(rows: CleanGpsRow[]) {
  const wellnessValues = rows.flatMap((row) => [row.wellnessFatigue, row.wellnessSleep, row.wellnessDoms, row.wellnessStress, row.wellnessMood].map(numberValue)).filter((value) => value > 0);
  if (wellnessValues.length) {
    return clamp((wellnessValues.reduce((total, value) => total + value, 0) / wellnessValues.length) * 20);
  }
  const load = average(rows, playerLoadValue);
  return clamp(100 - load * 0.35);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function dateKey(row: CleanGpsRow) {
  return String(row.date ?? "").slice(0, 10);
}

function shortDate(value: string) {
  const [, month, day] = value.split("-");
  return [month, day].filter(Boolean).join("/") || value;
}

function longDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function metricValueLabel(value: number, metric: LoadMetric) {
  if (metric.unit === "count") return compactNumber(value);
  if (metric.unit === "AU") return compactNumber(value, 1);
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function loadTrendTooltip(metric: LoadMetric, point: ChartPoint): ChartTooltipPayload {
  return {
    kicker: "Load trend",
    rows: [
      { label: "Metric", value: metric.label.en, tone: "gold" },
      { label: "Value", value: `${metricValueLabel(point.value, metric)} ${metric.unit}`, tone: "red" },
    ],
    subtitle: point.id,
    title: point.label,
  };
}

function namedValueTooltip(item: NamedValue): ChartTooltipPayload {
  return {
    kicker: "Chart value",
    rows: [
      { label: "Value", value: compactNumber(item.value), tone: "gold" },
    ],
    title: item.label,
  };
}

function radarPoint(cx: number, cy: number, radius: number, index: number, total: number) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function pointString(point: { x: number; y: number }) {
  return `${point.x},${point.y}`;
}
