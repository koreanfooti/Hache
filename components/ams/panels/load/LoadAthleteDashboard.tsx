"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { CleanGpsRow } from "@/lib/ams/types";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import { ChartTooltip, chartTooltipPosition, type ChartTooltipPayload, type ChartTooltipState } from "@/components/ams/ui/ChartTooltip";

type AthleteOption = {
  id: string;
  label: string;
};

type AthleteDay = {
  accel: number;
  date: string;
  decel: number;
  hsrAbs: number;
  hsrRel: number;
  maxSpeed: number;
  session: string;
  sessionName: string;
  sprintDistance: number;
  totalDistance: number;
};

const athleteCopy = {
  en: {
    title: "Individual Longitudinal Load",
    subtitle: "Daily WIMU/GPS volume and intensity relative to each athlete's own maximum.",
    athlete: "Athlete",
    totalDistance: "Distance volume and % of athlete max",
    hsr: "HSR absolute bars and HSR relative line",
    sprint: "Sprint distance bars and max-speed intensity line",
    neuro: "High-intensity acceleration / deceleration",
    noData: "No athlete rows available for the selected view.",
    from: "From",
    to: "To",
    reset: "Reset dates",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    visibleDays: "visible days",
  },
  es: {
    title: "Carga longitudinal individual",
    subtitle: "Volumen e intensidad diaria WIMU/GPS relativa al máximo propio del atleta.",
    athlete: "Atleta",
    totalDistance: "Distancia volumen y % del máximo del atleta",
    hsr: "Barras HSR absoluto y línea HSR relativo",
    sprint: "Barras sprint y línea de intensidad de velocidad máxima",
    neuro: "Aceleración / desaceleración de alta intensidad",
    noData: "No hay filas de atleta disponibles para la vista seleccionada.",
    from: "Desde",
    to: "Hasta",
    reset: "Reiniciar fechas",
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    visibleDays: "días visibles",
  },
};

export function LoadAthleteDashboard({ language, rows }: { language: AmsLanguage; rows: CleanGpsRow[] }) {
  const copy = athleteCopy[language];
  const athleteOptions = useMemo(() => athleteList(rows), [rows]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(athleteOptions[0]?.id ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [zoom, setZoom] = useState(1);
  const activeAthleteId = athleteOptions.some((option) => option.id === selectedAthleteId)
    ? selectedAthleteId
    : athleteOptions[0]?.id ?? "";
  const athleteRows = useMemo(
    () => rows.filter((row) => athleteId(row) === activeAthleteId).sort((a, b) => dateKey(a).localeCompare(dateKey(b))),
    [activeAthleteId, rows],
  );
  const activeAthleteLabel = athleteOptions.find((option) => option.id === activeAthleteId)?.label ?? copy.athlete;
  const days = useMemo(() => dailyAthleteRows(athleteRows), [athleteRows]);
  const dateBounds = useMemo(() => dateWindowBounds(days), [days]);
  const visibleDays = useMemo(() => filterDaysByDate(days, dateFrom, dateTo), [dateFrom, dateTo, days]);
  const zoomLabel = `${Math.round(zoom * 100)}%`;

  if (!athleteOptions.length || !days.length) {
    return (
      <section className="load-athlete-dashboard">
        <strong>{copy.noData}</strong>
      </section>
    );
  }

  return (
    <section className="load-athlete-dashboard">
      <header className="load-athlete-header">
        <div>
          <span className="section-kicker">WIMU/GPS</span>
          <h3>{copy.title}</h3>
          <p>{copy.subtitle}</p>
        </div>
        <label>
          <span>{copy.athlete}</span>
          <select value={activeAthleteId} onChange={(event) => setSelectedAthleteId(event.target.value)}>
            {athleteOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      </header>
      <div className="load-athlete-controls">
        <label>
          <span>{copy.from}</span>
          <input max={dateBounds.max} min={dateBounds.min} type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>{copy.to}</span>
          <input max={dateBounds.max} min={dateBounds.min} type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }}>
          {copy.reset}
        </button>
        <div className="load-athlete-zoom" aria-label={copy.title}>
          <button type="button" onClick={() => setZoom((value) => Math.max(0.65, Number((value - 0.2).toFixed(2))))}>{copy.zoomOut}</button>
          <span>{zoomLabel}</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(2.6, Number((value + 0.2).toFixed(2))))}>{copy.zoomIn}</button>
        </div>
        <small>{visibleDays.length} {copy.visibleDays}</small>
      </div>
      {visibleDays.length ? (
        <div className="load-athlete-chart-stack">
          <RelativeBarBand
            barClassName="load-athlete-distance-bar"
            color="#d31f2f"
            athleteLabel={activeAthleteLabel}
            days={visibleDays}
            zoom={zoom}
            lineColor="#d7b46a"
            title={copy.totalDistance}
            valueKey="totalDistance"
          />
          <ComboBand
            barClassName="load-athlete-hsr-bar"
            barKey="hsrAbs"
            athleteLabel={activeAthleteLabel}
            days={visibleDays}
            zoom={zoom}
            lineColor="#2f6dff"
            lineKey="hsrRel"
            title={copy.hsr}
          />
          <ComboBand
            barClassName="load-athlete-sprint-bar"
            barKey="sprintDistance"
            athleteLabel={activeAthleteLabel}
            days={visibleDays}
            zoom={zoom}
            lineColor="#8d6dff"
            lineKey="maxSpeed"
            speedTone
            title={copy.sprint}
          />
          <ClusterBand athleteLabel={activeAthleteLabel} days={visibleDays} title={copy.neuro} zoom={zoom} />
        </div>
      ) : (
        <strong className="load-athlete-empty">{copy.noData}</strong>
      )}
    </section>
  );
}

function RelativeBarBand({
  athleteLabel,
  barClassName,
  color,
  days,
  lineColor,
  title,
  valueKey,
  zoom,
}: {
  athleteLabel: string;
  barClassName: string;
  color: string;
  days: AthleteDay[];
  lineColor: string;
  title: string;
  valueKey: keyof Pick<AthleteDay, "totalDistance">;
  zoom: number;
}) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const maxValue = Math.max(1, ...days.map((day) => day[valueKey]));
  const points = days.map((day) => ({ ...day, percent: percentage(day[valueKey], maxValue) }));
  const width = chartWidth(days.length, zoom);
  const style = athleteChartStyle(width, zoom);
  const barWidth = 16 * barScale(zoom);

  return (
    <LongitudinalBand title={title} tooltip={tooltip} onTooltipClear={() => setTooltip(null)}>
      <svg className="load-athlete-svg" style={style} viewBox={`0 0 ${width} 170`} role="img">
        <BandGrid width={width} />
        {points.map((day, index) => {
          const x = pointX(index, zoom);
          const barHeight = Math.max(3, (day[valueKey] / maxValue) * 92);
          const y = 118 - barHeight;
          return (
            <g
              key={day.date}
              onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".load-athlete-band"), payload: relativeTooltip(athleteLabel, day, day[valueKey], day.percent) })}
            >
              <rect className={barClassName} x={x - barWidth / 2} y={y} width={barWidth} height={barHeight} rx="4" fill={color} />
              <text className="load-athlete-value" x={x} y={Math.max(15, y - 8)}>{compactNumber(day[valueKey])}</text>
              <text className="load-athlete-percent" x={x} y={Math.max(31, y + 14)}>{day.percent}%</text>
              <AxisLabels day={day} x={x} />
            </g>
          );
        })}
        <polyline className="load-athlete-line" fill="none" points={points.map((day, index) => `${pointX(index, zoom)},${118 - (day.percent / 100) * 92}`).join(" ")} stroke={lineColor} />
      </svg>
    </LongitudinalBand>
  );
}

function ComboBand({
  athleteLabel,
  barClassName,
  barKey,
  days,
  lineColor,
  lineKey,
  speedTone = false,
  title,
  zoom,
}: {
  athleteLabel: string;
  barClassName: string;
  barKey: keyof Pick<AthleteDay, "hsrAbs" | "sprintDistance">;
  days: AthleteDay[];
  lineColor: string;
  lineKey: keyof Pick<AthleteDay, "hsrRel" | "maxSpeed">;
  speedTone?: boolean;
  title: string;
  zoom: number;
}) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const maxBar = Math.max(1, ...days.map((day) => day[barKey]));
  const maxLine = Math.max(1, ...days.map((day) => day[lineKey]));
  const width = chartWidth(days.length, zoom);
  const style = athleteChartStyle(width, zoom);
  const barWidth = 22 * barScale(zoom);

  return (
    <LongitudinalBand title={title} tooltip={tooltip} onTooltipClear={() => setTooltip(null)}>
      <svg className="load-athlete-svg" style={style} viewBox={`0 0 ${width} 170`} role="img">
        <BandGrid width={width} />
        {days.map((day, index) => {
          const x = pointX(index, zoom);
          const barHeight = Math.max(2, (day[barKey] / maxBar) * 86);
          const y = 118 - barHeight;
          const linePercent = percentage(day[lineKey], maxLine);
          return (
            <g
              key={day.date}
              onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".load-athlete-band"), payload: comboTooltip(athleteLabel, day, barKey, day[barKey], lineKey, day[lineKey], linePercent) })}
            >
              <rect className={barClassName} x={x - barWidth / 2} y={y} width={barWidth} height={barHeight} rx="3" />
              <text className="load-athlete-value" x={x} y={Math.max(14, y - 8)}>{compactNumber(day[barKey])}</text>
              <text className={`load-athlete-percent ${speedTone ? speedToneClass(linePercent) : ""}`} x={x} y={Math.max(28, 118 - (linePercent / 100) * 86 - 8)}>
                {linePercent}%
              </text>
              <AxisLabels day={day} x={x} />
            </g>
          );
        })}
        <polyline className="load-athlete-line" fill="none" points={days.map((day, index) => `${pointX(index, zoom)},${118 - (percentage(day[lineKey], maxLine) / 100) * 86}`).join(" ")} stroke={lineColor} />
        {days.map((day, index) => {
          const linePercent = percentage(day[lineKey], maxLine);
          const cy = 118 - (linePercent / 100) * 86;
          const cx = pointX(index, zoom);
          return (
            <g
              key={`${day.date}-line`}
              onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".load-athlete-band"), payload: comboTooltip(athleteLabel, day, barKey, day[barKey], lineKey, day[lineKey], linePercent) })}
            >
              <circle className="load-athlete-line-hit" cx={cx} cy={cy} r={Math.max(10, 7 * zoom)} />
              <circle className="load-athlete-line-dot" cx={cx} cy={cy} r="4" />
            </g>
          );
        })}
      </svg>
    </LongitudinalBand>
  );
}

function ClusterBand({ athleteLabel, days, title, zoom }: { athleteLabel: string; days: AthleteDay[]; title: string; zoom: number }) {
  const [tooltip, setTooltip] = useState<ChartTooltipState | null>(null);
  const maxValue = Math.max(1, ...days.flatMap((day) => [day.accel, day.decel]));
  const width = chartWidth(days.length, zoom);
  const style = athleteChartStyle(width, zoom);
  const clusterWidth = 13 * barScale(zoom);

  return (
    <LongitudinalBand title={title} tooltip={tooltip} onTooltipClear={() => setTooltip(null)}>
      <svg className="load-athlete-svg" style={style} viewBox={`0 0 ${width} 170`} role="img">
        <BandGrid width={width} />
        {days.map((day, index) => {
          const x = pointX(index, zoom);
          const accelHeight = Math.max(2, (day.accel / maxValue) * 88);
          const decelHeight = Math.max(2, (day.decel / maxValue) * 88);
          return (
            <g
              key={day.date}
              onMouseMove={(event) => setTooltip({ ...chartTooltipPosition(event, ".load-athlete-band"), payload: clusterTooltip(athleteLabel, day) })}
            >
              <rect className="load-athlete-accel-bar" x={x - clusterWidth - 2} y={118 - accelHeight} width={clusterWidth} height={accelHeight} rx="3" />
              <rect className="load-athlete-decel-bar" x={x + 2} y={118 - decelHeight} width={clusterWidth} height={decelHeight} rx="3" />
              <text className="load-athlete-cluster-label" x={x - 8} y={Math.max(16, 118 - accelHeight + 16)}>{compactNumber(day.accel)}</text>
              <text className="load-athlete-cluster-label" x={x + 9} y={Math.max(16, 118 - decelHeight + 16)}>{compactNumber(day.decel)}</text>
              <AxisLabels day={day} x={x} />
            </g>
          );
        })}
      </svg>
    </LongitudinalBand>
  );
}

function LongitudinalBand({ children, onTooltipClear, title, tooltip }: { children: ReactNode; onTooltipClear: () => void; title: string; tooltip: ChartTooltipState | null }) {
  return (
    <article className="load-athlete-band" onMouseLeave={onTooltipClear}>
      <div className="load-athlete-band-title">{title}</div>
      <div className="load-athlete-scroll">{children}</div>
      <ChartTooltip tooltip={tooltip} />
    </article>
  );
}

function AxisLabels({ day, x }: { day: AthleteDay; x: number }) {
  return (
    <>
      <text className="load-athlete-axis-date" x={x} y="142" transform={`rotate(-32 ${x} 142)`}>{shortDate(day.date)}</text>
      <text className="load-athlete-axis-session" x={x} y="161">{day.session}</text>
    </>
  );
}

function BandGrid({ width }: { width: number }) {
  return (
    <g className="load-athlete-grid">
      {[26, 56, 86, 118].map((y) => <line key={y} x1="24" x2={width - 24} y1={y} y2={y} />)}
    </g>
  );
}

function athleteList(rows: CleanGpsRow[]): AthleteOption[] {
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = athleteId(row);
    if (!id) continue;
    map.set(id, athleteName(row));
  }
  return [...map.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function dailyAthleteRows(rows: CleanGpsRow[]): AthleteDay[] {
  const map = new Map<string, AthleteDay>();
  for (const row of rows) {
    const date = dateKey(row);
    if (!date) continue;
    const current = map.get(date) ?? {
      accel: 0,
      date,
      decel: 0,
      hsrAbs: 0,
      hsrRel: 0,
      maxSpeed: 0,
      session: sessionLabel(row),
      sessionName: sessionNameLabel(row),
      sprintDistance: 0,
      totalDistance: 0,
    };
    current.totalDistance += distanceValue(row);
    current.hsrAbs += hsrAbsValue(row);
    current.hsrRel += numberValue(row.hsrRelDistance);
    current.sprintDistance += numberValue(row.sprintDistance);
    current.accel += numberValue(row.highIntensityAccelerations);
    current.decel += numberValue(row.highIntensityDecelerations);
    current.maxSpeed = Math.max(current.maxSpeed, maxSpeedValue(row));
    current.session = current.session || sessionLabel(row);
    current.sessionName = mergeSessionNames(current.sessionName, sessionNameLabel(row));
    map.set(date, current);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function athleteId(row: CleanGpsRow) {
  return String(row.amsId || row.cleanPlayerName || row.sourcePlayerName || row.playerName || row.name || row.athlete || "").trim();
}

function athleteName(row: CleanGpsRow) {
  return String(row.cleanPlayerName || row.sourcePlayerName || row.playerName || row.name || row.athlete || row.amsId || "Unknown athlete").trim();
}

function sessionLabel(row: CleanGpsRow) {
  return String(row.weekMatchDay || row.matchDay || row.session_type || row.sessionName || "").trim() || "-";
}

function sessionNameLabel(row: CleanGpsRow) {
  return String(row.sessionName || row.session_name || row.session_type || row.sourceSessionId || "").trim() || "-";
}

function mergeSessionNames(current: string, next: string) {
  if (!next || next === "-") return current || "-";
  if (!current || current === "-") return next;
  if (current.includes(next)) return current;
  return `${current} / ${next}`;
}

function distanceValue(row: CleanGpsRow) {
  return numberValue(row.totalDistance ?? row.total_distance_m);
}

function hsrAbsValue(row: CleanGpsRow) {
  return numberValue(row.hsrAbsDistance ?? row.highIntensityDistance ?? row.high_intensity_m);
}

function maxSpeedValue(row: CleanGpsRow) {
  return numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed);
}

function dateKey(row: CleanGpsRow) {
  return String(row.date ?? "").slice(0, 10);
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return [month, day].filter(Boolean).join("/") || date;
}

function dateWindowBounds(days: AthleteDay[]) {
  const dates = days.map((day) => day.date).filter(Boolean);
  return { min: dates[0] ?? "", max: dates[dates.length - 1] ?? "" };
}

function filterDaysByDate(days: AthleteDay[], from: string, to: string) {
  return days.filter((day) => (!from || day.date >= from) && (!to || day.date <= to));
}

function chartWidth(count: number, zoom: number) {
  return Math.max(980, count * 54 * zoom + 72);
}

function pointX(index: number, zoom: number) {
  return 42 + index * 54 * zoom;
}

function barScale(zoom: number) {
  return Math.max(0.72, Math.min(2.05, zoom));
}

function athleteChartStyle(width: number, zoom: number) {
  return {
    "--load-athlete-axis-size": `${Math.min(11.5, 7.4 + zoom * 1.3)}px`,
    "--load-athlete-label-size": `${Math.min(15, 8.2 + zoom * 2.2)}px`,
    "--load-athlete-percent-size": `${Math.min(13.5, 7.5 + zoom * 1.9)}px`,
    maxWidth: "none",
    width: `${width}px`,
  } as CSSProperties;
}

function relativeTooltip(athleteLabel: string, day: AthleteDay, value: number, percent: number): ChartTooltipPayload {
  return baseTooltip(athleteLabel, day, [
    { label: "Total distance", value: `${compactNumber(value)} m`, tone: "red" },
    { label: "Player max share", value: `${percent}%`, tone: "gold" },
  ]);
}

function comboTooltip(
  athleteLabel: string,
  day: AthleteDay,
  barKey: keyof Pick<AthleteDay, "hsrAbs" | "sprintDistance">,
  barValue: number,
  lineKey: keyof Pick<AthleteDay, "hsrRel" | "maxSpeed">,
  lineValue: number,
  linePercent: number,
): ChartTooltipPayload {
  return baseTooltip(athleteLabel, day, [
    { label: metricLabel(barKey), value: metricValueText(barKey, barValue), tone: "red" },
    { label: metricLabel(lineKey), value: metricValueText(lineKey, lineValue), tone: lineKey === "maxSpeed" ? "blue" : "gold" },
    { label: `${metricLabel(lineKey)} share`, value: `${linePercent}%`, tone: "gold" },
  ]);
}

function clusterTooltip(athleteLabel: string, day: AthleteDay): ChartTooltipPayload {
  return baseTooltip(athleteLabel, day, [
    { label: "HI accelerations", value: compactNumber(day.accel), tone: "blue" },
    { label: "HI decelerations", value: compactNumber(day.decel), tone: "gold" },
  ]);
}

function baseTooltip(athleteLabel: string, day: AthleteDay, rows: ChartTooltipPayload["rows"]): ChartTooltipPayload {
  return {
    kicker: day.session,
    rows,
    subtitle: `${day.date} · ${day.sessionName}`,
    title: athleteLabel,
  };
}

function metricLabel(key: keyof Pick<AthleteDay, "hsrAbs" | "hsrRel" | "maxSpeed" | "sprintDistance">) {
  if (key === "hsrAbs") return "HSR absolute";
  if (key === "hsrRel") return "HSR relative";
  if (key === "sprintDistance") return "Sprint distance";
  return "Max speed";
}

function metricValueText(key: keyof Pick<AthleteDay, "hsrAbs" | "hsrRel" | "maxSpeed" | "sprintDistance">, value: number) {
  if (key === "maxSpeed") return `${compactNumber(value, 1)} km/h`;
  return `${compactNumber(value)} m`;
}

function percentage(value: number, maxValue: number) {
  return Math.round((value / Math.max(1, maxValue)) * 100);
}

function speedToneClass(percent: number) {
  if (percent >= 80) return "is-red";
  if (percent >= 60) return "is-yellow";
  return "is-green";
}
