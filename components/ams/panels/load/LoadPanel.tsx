"use client";

import { useEffect, useMemo, useState } from "react";
import { metricDefinitions } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { CleanGpsRow, LoadSummary } from "@/lib/ams/types";
import type { DataPanelCopy } from "@/components/ams/panels/panelTypes";
import { LoadVisualDashboard } from "@/components/ams/panels/load/LoadVisuals";
import {
  MetricCard,
  PanelIntro,
  localizedValue,
  type AmsLanguage,
} from "@/components/ams/ui/AmsUi";
import { DateSlicerField } from "@/components/ams/ui/DateSlicerField";

type LoadFilterPayload = {
  filters?: {
    allTeamsValue: string;
    dateFrom: string;
    dateTo: string;
    defaultTeam: string;
    selectedTeam: string;
    teams: string[];
    totalRows: number;
  };
  rows?: CleanGpsRow[];
  summary?: LoadSummary;
};

const ALL_TEAMS = "__all__";
const DEFAULT_TEAM = "Atlas Primer Equipo";

export function LoadPanel({
  copy,
  language,
  loadSummary,
}: {
  copy: DataPanelCopy;
  language: AmsLanguage;
  loadSummary: LoadSummary;
}) {
  const controls = loadControlCopy(language);
  const [selectedTeam, setSelectedTeam] = useState(DEFAULT_TEAM);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [teams, setTeams] = useState<string[]>(() => uniqueTeams(loadSummary.rows));
  const [filteredSummary, setFilteredSummary] = useState<LoadSummary>(loadSummary);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const visibleSummary = filteredSummary.rows.length || isFiltering ? filteredSummary : loadSummary;
  const visibleTeams = teams.length ? teams : uniqueTeams(loadSummary.rows);
  const metricInventory = useMemo(() => wimuMetricInventory(visibleSummary.rows), [visibleSummary.rows]);
  const selectedTeamLabel = selectedTeam === ALL_TEAMS ? controls.allTeams : selectedTeam;
  const filterStatus = filterError
    ? filterError
    : isFiltering
      ? controls.loading
      : `${compactNumber(visibleSummary.rows.length)} ${controls.records} · ${selectedTeamLabel}`;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    params.set("team", selectedTeam);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null;
        setIsFiltering(true);
        setFilterError(null);
        return fetch(`/api/ams/load?${params.toString()}`, { cache: "no-store", signal: controller.signal });
      })
      .then(async (response) => {
        if (!response) return;
        const payload = (await response.json()) as LoadFilterPayload;
        if (!response.ok) throw new Error("Unable to load filtered GPS data.");
        if (payload.filters?.teams?.length) setTeams(payload.filters.teams);
        if (!dateFrom && payload.filters?.dateFrom) setDateFrom(payload.filters.dateFrom);
        if (!dateTo && payload.filters?.dateTo) setDateTo(payload.filters.dateTo);
        if (payload.summary) setFilteredSummary(payload.summary);
        else if (payload.rows) setFilteredSummary(summarizeRows(payload.rows, controls.loadedFiltered));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFilteredSummary(loadSummary);
        setFilterError(error instanceof Error ? error.message : controls.error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFiltering(false);
      });

    return () => controller.abort();
  }, [controls.error, controls.loadedFiltered, dateFrom, dateTo, loadSummary, selectedTeam]);

  const dateRangeText = useMemo(() => {
    if (!dateFrom && !dateTo) return controls.latestWindow;
    return `${dateFrom || controls.openStart} → ${dateTo || controls.openEnd}`;
  }, [controls.latestWindow, controls.openEnd, controls.openStart, dateFrom, dateTo]);

  function handleTeamChange(team: string) {
    setSelectedTeam(team);
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.load.kicker}
        title={copy.load.title}
        copy={copy.load.copy}
      />
      <div className="load-source-control-row">
        <section className="load-filter-panel" aria-label={controls.filterLabel}>
          <div className="load-filter-heading">
            <div>
              <span>{controls.slicers}</span>
              <strong>{filterStatus}</strong>
            </div>
            <small>{dateRangeText}</small>
          </div>
          <div className="load-filter-grid">
            <label>
              <span>{controls.team}</span>
              <select value={selectedTeam} onChange={(event) => handleTeamChange(event.target.value)}>
                <option value={ALL_TEAMS}>{controls.allTeams}</option>
                {visibleTeams.map((team) => <option key={team} value={team}>{team}</option>)}
              </select>
            </label>
            <DateSlicerField
              emptyLabel={controls.noDateSelected}
              label={controls.from}
              language={language}
              tooltipDetail={dateRangeText}
              tooltipTitle={controls.startWindow}
              value={dateFrom}
              onChange={setDateFrom}
            />
            <DateSlicerField
              emptyLabel={controls.noDateSelected}
              label={controls.to}
              language={language}
              tooltipDetail={dateRangeText}
              tooltipTitle={controls.endWindow}
              value={dateTo}
              onChange={setDateTo}
            />
            <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              {controls.latest90}
            </button>
          </div>
        </section>
        <aside className="load-metrics-pane">
          <div className="load-metrics-pane-heading">
            <span>{controls.metricsPane}</span>
            <strong>{metricInventory.length} {controls.metrics}</strong>
          </div>
          <div className="load-metrics-list">
            {metricInventory.map((metric) => (
              <span key={metric.key}>
                <b>{metric.key}</b>
                <small>{compactNumber(metric.count)} {controls.rows}</small>
              </span>
            ))}
          </div>
        </aside>
      </div>
      <section className="metric-grid">
        <MetricCard label={copy.load.totalDistance} value={`${compactNumber(visibleSummary.totalDistance)} m`} detail={`${compactNumber(visibleSummary.sessions)} ${copy.common.sessions}`} />
        <MetricCard label={copy.load.highIntensity} value={`${compactNumber(visibleSummary.highIntensity)} m`} detail={copy.load.absoluteRelativeExposure} />
        <MetricCard label={copy.load.maxSpeed} value={`${compactNumber(visibleSummary.maxSpeed, 1)} km/h`} detail={copy.load.peakRecordedValue} />
        <MetricCard label={copy.load.dataStatus} value={localizedLoadStatus(visibleSummary.status, language)} detail={copy.load.servedFromPublicData} />
      </section>
      <LoadVisualDashboard language={language} rows={visibleSummary.rows} />
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

function summarizeRows(rows: CleanGpsRow[], status: string): LoadSummary {
  return {
    highIntensity: rows.reduce((total, row) => total + numberValue(row.hsrAbsDistance ?? row.highIntensityDistance ?? row.high_intensity_m), 0),
    maxSpeed: rows.reduce((max, row) => Math.max(max, numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed)), 0),
    rows,
    sessions: rows.length,
    status,
    totalDistance: rows.reduce((total, row) => total + numberValue(row.totalDistance ?? row.total_distance_m), 0),
  };
}

function uniqueTeams(rows: CleanGpsRow[]) {
  return [...new Set(rows.map((row) => row.team).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b));
}

function wimuMetricInventory(rows: CleanGpsRow[]) {
  const countByKey = new Map<string, number>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (value === undefined || value === null || String(value).trim() === "") continue;
      countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
    }
  }
  return [...countByKey.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function loadControlCopy(language: AmsLanguage) {
  if (language === "es") {
    return {
      allTeams: "Todos los equipos",
      error: "No se pudo cargar la carga filtrada.",
      filterLabel: "Filtros de demanda de carga",
      from: "Desde",
      latest90: "Últimos 90 días",
      latestWindow: "Ventana más reciente disponible",
      loadedFiltered: "Filas WIMU/GPS filtradas cargadas.",
      loading: "Cargando filtros...",
      metrics: "métricas",
      metricsPane: "Métricas WIMU/GPS",
      noDateSelected: "Sin fecha seleccionada",
      openEnd: "fin abierto",
      openStart: "inicio abierto",
      records: "registros",
      rows: "filas",
      slicers: "Slicers de GPS",
      startWindow: "Inicio de ventana",
      team: "Equipo",
      endWindow: "Fin de ventana",
      to: "Hasta",
    };
  }

  return {
    allTeams: "All teams",
    error: "Unable to load filtered load data.",
    filterLabel: "Load demand filters",
    from: "From",
    latest90: "Latest 90 days",
    latestWindow: "Latest available window",
    loadedFiltered: "Loaded filtered WIMU/GPS rows.",
    loading: "Loading filters...",
    metrics: "metrics",
    metricsPane: "WIMU/GPS metrics",
    noDateSelected: "No date selected",
    openEnd: "open end",
    openStart: "open start",
    records: "records",
    rows: "rows",
    slicers: "GPS slicers",
    startWindow: "Window start",
    team: "Team",
    endWindow: "Window end",
    to: "To",
  };
}

function localizedLoadStatus(status: string, language: AmsLanguage) {
  if (language === "en") return status;
  if (status.startsWith("Loaded")) {
    return status
      .replace("Loaded", "Cargados")
      .replace("filtered WIMU/GPS daily records", "registros diarios WIMU/GPS filtrados")
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
