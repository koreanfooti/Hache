"use client";

import { useMemo, useState } from "react";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { CleanGpsRow } from "@/lib/ams/types";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

type LoadMetricKey = "totalDistance" | "hsrAbsDistance" | "hsrRelDistance" | "sprintDistance" | "accelerations" | "decelerations" | "playerLoad";

type LoadMetric = {
  key: LoadMetricKey;
  color: string;
  unit: string;
  aggregate: "sum" | "max" | "avg";
  label: Record<AmsLanguage, string>;
};

type ChartPoint = {
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
  { key: "accelerations", label: { en: "Accel.", es: "Acel." }, unit: "count", color: "#e24852", aggregate: "sum" },
  { key: "decelerations", label: { en: "Decel.", es: "Desacel." }, unit: "count", color: "#9f111d", aggregate: "sum" },
  { key: "playerLoad", label: { en: "Player load", es: "Carga jugador" }, unit: "AU", color: "#29cd97", aggregate: "avg" },
];

const chartCopy = {
  en: {
    trend: "Load Trend",
    trendSub: "Selectable GPS metric by recorded date",
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
  const copy = chartCopy[language];
  const selectedMetric = loadMetrics.find((metric) => metric.key === selectedMetricKey) ?? loadMetrics[0];
  const sortedRows = useMemo(
    () => [...rows].filter((row) => row.date).sort((a, b) => String(a.date).localeCompare(String(b.date))),
    [rows],
  );
  const trendRows = useMemo(() => aggregateByDate(sortedRows, selectedMetric).slice(-16), [selectedMetric, sortedRows]);
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
        <div className="panel-heading">
          <div>
            <h3>{copy.trend}</h3>
            <span>{copy.trendSub}</span>
          </div>
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
        </div>
        <TrendBarChart metric={selectedMetric} points={trendRows} />
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

function TrendBarChart({ metric, points }: { metric: LoadMetric; points: ChartPoint[] }) {
  const width = 780;
  const height = 280;
  const padX = 42;
  const bottomPad = 58;
  const topPad = 26;
  const plotHeight = height - bottomPad - topPad;
  const maxValue = Math.max(1, ...points.map((point) => point.value));
  const slot = (width - padX * 2) / Math.max(1, points.length);
  const barWidth = Math.max(8, Math.min(28, slot * 0.48));

  return (
    <svg className="load-svg-chart" viewBox={`0 0 ${width} ${height}`} role="img">
      <ChartGrid width={width} height={height} left={padX} right={20} top={topPad} bottom={bottomPad} />
      {points.map((point, index) => {
        const barHeight = (point.value / maxValue) * plotHeight;
        const center = padX + index * slot + slot / 2;
        const y = height - bottomPad - barHeight;
        const labelEvery = Math.max(1, Math.ceil(points.length / 8));
        return (
          <g key={point.label}>
            <rect className="load-trend-bar" x={center - barWidth / 2} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="5" style={{ fill: metric.color }} />
            {slot > 38 ? <text className="load-chart-value" x={center} y={Math.max(15, y - 8)}>{metricValueLabel(point.value, metric)}</text> : null}
            {index % labelEvery === 0 || index === points.length - 1 ? (
              <text className="load-chart-label" x={center} y={height - 30} transform={`rotate(-35 ${center} ${height - 30})`}>{point.label}</text>
            ) : null}
          </g>
        );
      })}
    </svg>
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
  const width = 340;
  const height = 230;
  const padX = 34;
  const bottomPad = 46;
  const topPad = 26;
  const maxValue = Math.max(1, ...values.map((item) => item.value));
  const slot = (width - padX * 2) / Math.max(1, values.length);
  const barWidth = Math.max(24, Math.min(58, slot * 0.52));

  return (
    <svg className="load-svg-chart" viewBox={`0 0 ${width} ${height}`} role="img">
      <ChartGrid width={width} height={height} left={padX} right={20} top={topPad} bottom={bottomPad} />
      {values.map((item, index) => {
        const barHeight = (item.value / maxValue) * (height - topPad - bottomPad);
        const center = padX + index * slot + slot / 2;
        const y = height - bottomPad - barHeight;
        return (
          <g key={item.label}>
            <rect x={center - barWidth / 2} y={y} width={barWidth} height={Math.max(2, barHeight)} rx="7" fill={item.color ?? "#d31f2f"} />
            <text className="load-chart-value" x={center} y={Math.max(15, y - 8)}>{compactNumber(item.value)}</text>
            <text className="load-chart-label" x={center} y={height - 20}>{item.label}</text>
          </g>
        );
      })}
    </svg>
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

function aggregateByDate(rows: CleanGpsRow[], metric: LoadMetric) {
  const map = new Map<string, { value: number; count: number }>();
  for (const row of rows) {
    const key = String(row.date ?? "").slice(0, 10);
    if (!key) continue;
    const current = map.get(key) ?? { value: metric.aggregate === "max" ? 0 : 0, count: 0 };
    const value = metricValue(row, metric.key);
    current.value = metric.aggregate === "max" ? Math.max(current.value, value) : current.value + value;
    current.count += 1;
    map.set(key, current);
  }

  return [...map.entries()].map(([date, item]) => ({
    label: shortDate(date),
    value: metric.aggregate === "avg" ? item.value / Math.max(1, item.count) : item.value,
  }));
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
    { label: language === "es" ? "Acel." : "Accel.", value: sum(rows, accelerationsValue), color: "#e24852" },
    { label: language === "es" ? "Desac." : "Decel.", value: sum(rows, decelerationsValue), color: "#9f111d" },
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
  const neuroRatio = sum(rows, accelerationsValue) / Math.max(1, sum(rows, decelerationsValue));

  if (language === "es") {
    return [
      { title: "Carga de partido", body: `La fila promedio registra ${compactNumber(distance)} m con ${compactNumber(highIntensityRatio * 100, 1)}% de alta intensidad.` },
      { title: "Velocidad", body: `La velocidad pico del filtro es ${compactNumber(maxSpeed, 1)} km/h. Vigila exposiciones semanales sobre 85-90% del pico.` },
      { title: "Neuromuscular", body: `La relación aceleración/desaceleración es ${compactNumber(neuroRatio, 2)}, útil para revisar fatiga mecánica.` },
    ];
  }

  return [
    { title: "Match load", body: `Average row load is ${compactNumber(distance)} m with ${compactNumber(highIntensityRatio * 100, 1)}% high-intensity exposure.` },
    { title: "Speed", body: `Peak speed in this feed is ${compactNumber(maxSpeed, 1)} km/h. Watch weekly exposure above 85-90% of peak.` },
    { title: "Neuromuscular", body: `Acceleration/deceleration ratio is ${compactNumber(neuroRatio, 2)}, useful for mechanical fatigue review.` },
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

function accelerationsValue(row: CleanGpsRow) {
  return numberValue(row.accelerations);
}

function decelerationsValue(row: CleanGpsRow) {
  return numberValue(row.decelerations);
}

function metricValue(row: CleanGpsRow, key: LoadMetricKey) {
  if (key === "totalDistance") return totalDistanceValue(row);
  if (key === "hsrAbsDistance") return highIntensityValue(row);
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

function shortDate(value: string) {
  const [, month, day] = value.split("-");
  return [month, day].filter(Boolean).join("/") || value;
}

function metricValueLabel(value: number, metric: LoadMetric) {
  if (metric.unit === "count") return compactNumber(value);
  if (metric.unit === "AU") return compactNumber(value, 1);
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function radarPoint(cx: number, cy: number, radius: number, index: number, total: number) {
  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

function pointString(point: { x: number; y: number }) {
  return `${point.x},${point.y}`;
}
