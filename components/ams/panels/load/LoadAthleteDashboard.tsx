"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { CleanGpsRow } from "@/lib/ams/types";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";

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
  },
};

export function LoadAthleteDashboard({ language, rows }: { language: AmsLanguage; rows: CleanGpsRow[] }) {
  const copy = athleteCopy[language];
  const athleteOptions = useMemo(() => athleteList(rows), [rows]);
  const [selectedAthleteId, setSelectedAthleteId] = useState(athleteOptions[0]?.id ?? "");
  const activeAthleteId = athleteOptions.some((option) => option.id === selectedAthleteId)
    ? selectedAthleteId
    : athleteOptions[0]?.id ?? "";
  const athleteRows = useMemo(
    () => rows.filter((row) => athleteId(row) === activeAthleteId).sort((a, b) => dateKey(a).localeCompare(dateKey(b))),
    [activeAthleteId, rows],
  );
  const days = useMemo(() => dailyAthleteRows(athleteRows), [athleteRows]);

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
      <div className="load-athlete-chart-stack">
        <RelativeBarBand
          barClassName="load-athlete-distance-bar"
          color="#d31f2f"
          days={days}
          lineColor="#d7b46a"
          title={copy.totalDistance}
          valueKey="totalDistance"
        />
        <ComboBand
          barClassName="load-athlete-hsr-bar"
          barKey="hsrAbs"
          days={days}
          lineColor="#2f6dff"
          lineKey="hsrRel"
          title={copy.hsr}
        />
        <ComboBand
          barClassName="load-athlete-sprint-bar"
          barKey="sprintDistance"
          days={days}
          lineColor="#8d6dff"
          lineKey="maxSpeed"
          speedTone
          title={copy.sprint}
        />
        <ClusterBand days={days} title={copy.neuro} />
      </div>
    </section>
  );
}

function RelativeBarBand({
  barClassName,
  color,
  days,
  lineColor,
  title,
  valueKey,
}: {
  barClassName: string;
  color: string;
  days: AthleteDay[];
  lineColor: string;
  title: string;
  valueKey: keyof Pick<AthleteDay, "totalDistance">;
}) {
  const maxValue = Math.max(1, ...days.map((day) => day[valueKey]));
  const points = days.map((day) => ({ ...day, percent: percentage(day[valueKey], maxValue) }));

  return (
    <LongitudinalBand title={title}>
      <svg className="load-athlete-svg" viewBox={`0 0 ${chartWidth(days.length)} 170`} role="img">
        <BandGrid width={chartWidth(days.length)} />
        {points.map((day, index) => {
          const x = pointX(index);
          const barHeight = Math.max(3, (day[valueKey] / maxValue) * 92);
          const y = 118 - barHeight;
          return (
            <g key={day.date}>
              <rect className={barClassName} x={x - 8} y={y} width="16" height={barHeight} rx="4" fill={color} />
              <text className="load-athlete-value" x={x} y={Math.max(15, y - 8)}>{compactNumber(day[valueKey])}</text>
              <text className="load-athlete-percent" x={x} y={Math.max(31, y + 14)}>{day.percent}%</text>
              <AxisLabels day={day} x={x} />
            </g>
          );
        })}
        <polyline className="load-athlete-line" fill="none" points={points.map((day, index) => `${pointX(index)},${118 - (day.percent / 100) * 92}`).join(" ")} stroke={lineColor} />
      </svg>
    </LongitudinalBand>
  );
}

function ComboBand({
  barClassName,
  barKey,
  days,
  lineColor,
  lineKey,
  speedTone = false,
  title,
}: {
  barClassName: string;
  barKey: keyof Pick<AthleteDay, "hsrAbs" | "sprintDistance">;
  days: AthleteDay[];
  lineColor: string;
  lineKey: keyof Pick<AthleteDay, "hsrRel" | "maxSpeed">;
  speedTone?: boolean;
  title: string;
}) {
  const maxBar = Math.max(1, ...days.map((day) => day[barKey]));
  const maxLine = Math.max(1, ...days.map((day) => day[lineKey]));

  return (
    <LongitudinalBand title={title}>
      <svg className="load-athlete-svg" viewBox={`0 0 ${chartWidth(days.length)} 170`} role="img">
        <BandGrid width={chartWidth(days.length)} />
        {days.map((day, index) => {
          const x = pointX(index);
          const barHeight = Math.max(2, (day[barKey] / maxBar) * 86);
          const y = 118 - barHeight;
          const linePercent = percentage(day[lineKey], maxLine);
          return (
            <g key={day.date}>
              <rect className={barClassName} x={x - 11} y={y} width="22" height={barHeight} rx="3" />
              <text className="load-athlete-value" x={x} y={Math.max(14, y - 8)}>{compactNumber(day[barKey])}</text>
              <text className={`load-athlete-percent ${speedTone ? speedToneClass(linePercent) : ""}`} x={x} y={Math.max(28, 118 - (linePercent / 100) * 86 - 8)}>
                {linePercent}%
              </text>
              <AxisLabels day={day} x={x} />
            </g>
          );
        })}
        <polyline className="load-athlete-line" fill="none" points={days.map((day, index) => `${pointX(index)},${118 - (percentage(day[lineKey], maxLine) / 100) * 86}`).join(" ")} stroke={lineColor} />
        {days.map((day, index) => (
          <circle key={`${day.date}-line`} className="load-athlete-line-dot" cx={pointX(index)} cy={118 - (percentage(day[lineKey], maxLine) / 100) * 86} r="4" />
        ))}
      </svg>
    </LongitudinalBand>
  );
}

function ClusterBand({ days, title }: { days: AthleteDay[]; title: string }) {
  const maxValue = Math.max(1, ...days.flatMap((day) => [day.accel, day.decel]));

  return (
    <LongitudinalBand title={title}>
      <svg className="load-athlete-svg" viewBox={`0 0 ${chartWidth(days.length)} 170`} role="img">
        <BandGrid width={chartWidth(days.length)} />
        {days.map((day, index) => {
          const x = pointX(index);
          const accelHeight = Math.max(2, (day.accel / maxValue) * 88);
          const decelHeight = Math.max(2, (day.decel / maxValue) * 88);
          return (
            <g key={day.date}>
              <rect className="load-athlete-accel-bar" x={x - 15} y={118 - accelHeight} width="13" height={accelHeight} rx="3" />
              <rect className="load-athlete-decel-bar" x={x + 2} y={118 - decelHeight} width="13" height={decelHeight} rx="3" />
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

function LongitudinalBand({ children, title }: { children: ReactNode; title: string }) {
  return (
    <article className="load-athlete-band">
      <div className="load-athlete-band-title">{title}</div>
      <div className="load-athlete-scroll">{children}</div>
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

function chartWidth(count: number) {
  return Math.max(980, count * 54 + 72);
}

function pointX(index: number) {
  return 42 + index * 54;
}

function percentage(value: number, maxValue: number) {
  return Math.round((value / Math.max(1, maxValue)) * 100);
}

function speedToneClass(percent: number) {
  if (percent >= 80) return "is-red";
  if (percent >= 60) return "is-yellow";
  return "is-green";
}
