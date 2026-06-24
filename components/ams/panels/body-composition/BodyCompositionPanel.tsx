import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { BodyCompRow } from "@/lib/ams/types";
import type { DataPanelCopy } from "@/components/ams/panels/panelTypes";
import { MetricCard, type AmsLanguage } from "@/components/ams/ui/AmsUi";
import { ChartTooltip, chartTooltipPosition, type ChartTooltipPayload, type ChartTooltipState } from "@/components/ams/ui/ChartTooltip";

const bodyCompositionSheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQUcyFgPRUf5wsz0647lu_T3QlLDfXvcwrkEu0A9vnVJYpHujNMHjGxuyqYRl6RhyVFp3Hke-97wkPt/pubhtml";

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
  const [energyTooltip, setEnergyTooltip] = useState<ChartTooltipState | null>(null);
  const [somatotypeTooltip, setSomatotypeTooltip] = useState<ChartTooltipState | null>(null);
  const [weightTooltip, setWeightTooltip] = useState<ChartTooltipState | null>(null);
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

        <article className="body-composition-somatotype-card" onMouseLeave={() => setSomatotypeTooltip(null)}>
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
                  onMouseMove={(event) => setSomatotypeTooltip({ ...chartTooltipPosition(event, ".body-composition-somatotype-card"), payload: somatotypeTooltipPayload(row, point) })}
                />
              );
            })}
          </div>
          <ChartTooltip tooltip={somatotypeTooltip} />
        </article>

        <article className="body-composition-chart-card body-composition-weight-card" onMouseLeave={() => setWeightTooltip(null)}>
          <div className="panel-heading">
            <h3>{copy.bodyComp.weightTracking ?? "Weight Tracking"}</h3>
            <span>{copy.bodyComp.weightTrackingSub ?? "Longitudinal player record"}</span>
          </div>
          <div className="body-composition-mini-bars">
            {bodyCompSeriesRows(playerRows).slice(-10).map((row, index) => (
              <span
                key={`${row.playerId}-${row.testDate}-${index}`}
                style={{ "--bar-height": `${Math.max(8, Math.min(100, numberValue(row.weightKg) * 1.15))}%` } as CSSProperties}
                onMouseMove={(event) => setWeightTooltip({ ...chartTooltipPosition(event, ".body-composition-weight-card"), payload: weightTooltipPayload(row) })}
              >
                <i />
                <small>{String(row.testDate ?? "").slice(5) || index + 1}</small>
              </span>
            ))}
          </div>
          <ChartTooltip tooltip={weightTooltip} />
        </article>

        <article className="body-composition-chart-card body-composition-energy-card" onMouseLeave={() => setEnergyTooltip(null)}>
          <div className="panel-heading">
            <h3>{copy.bodyComp.energyExpenditure ?? "Energy Expenditure"}</h3>
            <span>{copy.bodyComp.energyExpenditureSub ?? "Estimated calories by activity level"}</span>
          </div>
          <div className="body-composition-energy-list">
            {energyRows.map((row) => (
              <span
                key={row.label}
                onMouseMove={(event) => setEnergyTooltip({ ...chartTooltipPosition(event, ".body-composition-energy-card"), payload: energyTooltipPayload(row, profileRow) })}
              >
                <strong>{row.label}</strong>
                <i style={{ "--energy-width": `${row.width}%` } as CSSProperties} />
                <small>{bodyCompMetricUnit(row.value, "kcal", 0)}</small>
              </span>
            ))}
          </div>
          <ChartTooltip tooltip={energyTooltip} />
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

function somatotypeTooltipPayload(row: BodyCompRow, point: ReturnType<typeof somatotypePoint>): ChartTooltipPayload {
  const somato = somatotypeComponents(row);

  return {
    kicker: "Heath-Carter ISAK profile",
    rows: [
      { label: "Endomorphy", value: compactNumber(somato.endo, 1), tone: "gold" },
      { label: "Mesomorphy", value: compactNumber(somato.meso, 1), tone: "red" },
      { label: "Ectomorphy", value: compactNumber(somato.ecto, 1), tone: "blue" },
      { label: "Plot", value: point.label, tone: "green" },
    ],
    subtitle: row.testDate ?? row.date ?? "No date",
    title: row.playerName ?? row.player_name ?? "Unknown athlete",
  };
}

function weightTooltipPayload(row: BodyCompRow): ChartTooltipPayload {
  return {
    kicker: "Weight tracking",
    rows: [
      { label: "Weight", value: bodyCompMetricUnit(row.weightKg, "kg", 1), tone: "red" },
      { label: "BMI", value: bodyCompMetric(row.bmi, 1), tone: "gold" },
    ],
    subtitle: row.testDate ?? row.date ?? "No date",
    title: row.playerName ?? row.player_name ?? "Unknown athlete",
  };
}

function energyTooltipPayload(row: ReturnType<typeof bodyCompEnergyRows>[number], profileRow: BodyCompRow | undefined): ChartTooltipPayload {
  return {
    kicker: "Energy expenditure",
    rows: [
      { label: "Activity", value: row.label, tone: "gold" },
      { label: "Estimated kcal", value: bodyCompMetricUnit(row.value, "kcal", 0), tone: row.label === "Match" ? "red" : "green" },
    ],
    subtitle: profileRow?.testDate ?? profileRow?.date ?? "Latest",
    title: profileRow?.playerName ?? profileRow?.player_name ?? "Team profile",
  };
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value) && value > 0);
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}
