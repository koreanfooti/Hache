"use client";

import Image from "next/image";
import { type CSSProperties, useState } from "react";
import type { Player } from "@/lib/ams/content";
import { compactNumber } from "@/lib/ams/data";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import {
  amsSourceDefinitions,
  amsSourceRecordLabel,
  localizedAmsSourceLabel,
  type AmsSourceDefinition,
} from "@/lib/ams/source-registry";
import { panelCopy } from "@/components/ams/config/copy";
import { isMvpSourceKey } from "@/components/ams/config/mvp";
import { PanelIntro, localizedValue, type AmsLanguage } from "@/components/ams/ui/AmsUi";
import type {
  LoadSummary,
  RawSourcePreview,
  SourceData,
  SyncAuditRow,
} from "@/lib/ams/types";

type RegistrySortField = "number" | "name";
type RegistrySortDirection = "asc" | "desc";
type RegistryTone = "synced" | "partial" | "pending";
type RegistrySource = { label: string; tone: RegistryTone };
type PlayerRegistryRow = {
  player: Player;
  sources: RegistrySource[];
  percent: number;
  connectedCount: number;
  totalCount: number;
  tone: RegistryTone;
};

export function SettingsPanel({
  language,
  loadSummary,
  rosterPlayers,
  sourceData,
  visiblePlayerIds,
  onTogglePlayerInView,
  onSetPlayersInView,
}: {
  language: AmsLanguage;
  loadSummary: LoadSummary;
  rosterPlayers: Player[];
  sourceData: SourceData;
  visiblePlayerIds: string[];
  onTogglePlayerInView: (playerId: string) => void;
  onSetPlayersInView: (playerIds: string[]) => void;
}) {
  const copy = panelCopy[language];
  const [activePreview, setActivePreview] = useState<RawSourcePreview | null>(null);
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [registrySearch, setRegistrySearch] = useState("");
  const [registrySortField, setRegistrySortField] = useState<RegistrySortField>("number");
  const [registrySortDirection, setRegistrySortDirection] = useState<RegistrySortDirection>("asc");
  const mvpSources = amsSourceDefinitions.filter((source) => isMvpSourceKey(source.key));
  const registryRows = buildPlayerRegistryRows(rosterPlayers, loadSummary, sourceData, registrySortField, registrySortDirection)
    .filter((row) => registryPlayerMatches(row.player, registrySearch));
  const allVisibleRowsSelected = registryRows.length > 0 && registryRows.every((row) => visiblePlayerIds.includes(row.player.id));

  function toggleVisibleRegistryRows() {
    if (!registryRows.length) return;

    if (allVisibleRowsSelected) {
      const filteredIds = new Set(registryRows.map((row) => row.player.id));
      const nextIds = visiblePlayerIds.filter((id) => !filteredIds.has(id));
      onSetPlayersInView(nextIds.length ? nextIds : [registryRows[0].player.id]);
      return;
    }

    onSetPlayersInView(Array.from(new Set([...visiblePlayerIds, ...registryRows.map((row) => row.player.id)])));
  }

  async function openSourcePreview(source: AmsSourceDefinition) {
    setLoadingPath(source.path);
    setActivePreview(null);

    try {
      const response = await fetch(`/api/ams/source-preview?path=${encodeURIComponent(source.path)}`);
      const payload = (await response.json()) as RawSourcePreview;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to open source preview.");
      }

      setActivePreview(payload);
    } catch (error) {
      setActivePreview({
        label: source.label,
        path: source.path,
        columns: [],
        rows: [],
        rowCount: 0,
        truncated: false,
        error: error instanceof Error ? error.message : "Unable to open source preview.",
      });
    } finally {
      setLoadingPath(null);
    }
  }

  return (
    <div className="panel-stack">
      <PanelIntro
        kicker={copy.settings.kicker}
        title={copy.settings.title}
        copy={copy.settings.copy}
      />
      <section className="source-table">
        {mvpSources.map((source) => (
          <article className="source-row" key={source.path}>
            <div className="source-meta">
              <strong>{localizedAmsSourceLabel(source, language)}</strong>
              <code>{source.path}</code>
            </div>
            <div className="source-actions">
              <span>{amsSourceRecordLabel(source, { loadSummary, sourceData }, language)}</span>
              <button
                className="source-open-button"
                type="button"
                onClick={() => openSourcePreview(source)}
                disabled={loadingPath === source.path}
              >
                {loadingPath === source.path
                  ? language === "es" ? "Cargando..." : "Loading..."
                  : language === "es" ? "Abrir fuente" : "Open Source"}
              </button>
            </div>
          </article>
        ))}
      </section>
      <section className="player-registry-panel">
        <div className="panel-heading compact">
          <div>
            <span>{language === "es" ? "Conexiones por jugador" : "Player Source Connections"}</span>
            <h3>{language === "es" ? "Registro de jugadores" : "Player Registry"}</h3>
          </div>
          <div className="registry-header-tools">
            <label className="registry-search">
              <span>{language === "es" ? "Buscar" : "Search"}</span>
              <input
                type="search"
                value={registrySearch}
                onChange={(event) => setRegistrySearch(event.target.value)}
                placeholder={language === "es" ? "Nombre, número o ID..." : "Name, number, or ID..."}
              />
            </label>
            <button className="registry-select-all" type="button" onClick={toggleVisibleRegistryRows}>
              {allVisibleRowsSelected
                ? language === "es" ? "Quitar visibles" : "Clear shown"
                : language === "es" ? "Seleccionar visibles" : "Select all"}
            </button>
            <div className="registry-sort-controls" aria-label={language === "es" ? "Ordenar registro" : "Order registry"}>
              <button
                className={registrySortField === "number" ? "is-active" : ""}
                type="button"
                onClick={() => setRegistrySortField("number")}
              >
                {language === "es" ? "Número" : "Number"}
              </button>
              <button
                className={registrySortField === "name" ? "is-active" : ""}
                type="button"
                onClick={() => setRegistrySortField("name")}
              >
                {language === "es" ? "Nombre" : "A-Z"}
              </button>
              <button
                className={registrySortDirection === "asc" ? "is-active" : ""}
                type="button"
                onClick={() => setRegistrySortDirection("asc")}
                aria-label={language === "es" ? "Orden ascendente" : "Sort ascending"}
              >
                ↑
              </button>
              <button
                className={registrySortDirection === "desc" ? "is-active" : ""}
                type="button"
                onClick={() => setRegistrySortDirection("desc")}
                aria-label={language === "es" ? "Orden descendente" : "Sort descending"}
              >
                ↓
              </button>
            </div>
            <strong>
              {Math.round(registryRows.reduce((total, row) => total + row.percent, 0) / Math.max(registryRows.length, 1))}%
              {" "}
              {language === "es" ? "promedio" : "avg"}
            </strong>
          </div>
        </div>
        <div className="registry-list">
          {registryRows.map((row) => (
            <article className="registry-player-row" key={row.player.amsId}>
              <div className="registry-player-main">
                <label className="registry-selector">
                  <input
                    type="checkbox"
                    checked={visiblePlayerIds.includes(row.player.id)}
                    disabled={visiblePlayerIds.length === 1 && visiblePlayerIds.includes(row.player.id)}
                    onChange={() => onTogglePlayerInView(row.player.id)}
                    aria-label={`${language === "es" ? "Mostrar" : "Show"} ${row.player.name}`}
                  />
                  <span className="registry-player-visual">
                    {hasPlayerPhoto(row.player) ? (
                      <Image src={row.player.photo} alt="" width={54} height={54} />
                    ) : (
                      <span>{row.player.number || "-"}</span>
                    )}
                    <small>{row.player.number || "-"}</small>
                  </span>
                </label>
                <div>
                  <strong>{row.player.name}</strong>
                  <small>{row.player.amsId} · {localizedValue(row.player.position, language)}</small>
                </div>
              </div>
              <div className="source-chips">
                {row.sources.map((source) => (
                  <span className={`status-chip ${source.tone}`} key={`${row.player.amsId}-${source.label}`}>
                    {localizedRegistrySource(source.label, language)}
                  </span>
                ))}
              </div>
              <SyncMeter row={row} language={language} />
            </article>
          ))}
        </div>
      </section>
      {activePreview && (
        <section className="raw-source-view">
          <div className="panel-heading compact">
            <div>
              <span>{language === "es" ? "Vista de fuente" : "Source Preview"}</span>
              <h3>{localizedAmsSourceLabel(activePreview.label, language)}</h3>
            </div>
            <code>{activePreview.path}</code>
          </div>
          {activePreview.error ? (
            <p className="empty-profile">{activePreview.error}</p>
          ) : (
            <>
              <p>
                {language === "es" ? "Mostrando" : "Showing"} {activePreview.rowCount}
                {activePreview.totalRows ? ` / ${compactNumber(activePreview.totalRows)}` : ""}{" "}
                {language === "es" ? "filas" : "rows"}
                {activePreview.truncated ? ` (${language === "es" ? "vista previa limitada" : "preview limited"})` : ""}.
              </p>
              <div className="raw-zoom-controls">
                <span>{language === "es" ? "Zoom de tabla" : "Table zoom"}: {previewZoom}%</span>
                <button type="button" onClick={() => setPreviewZoom((value) => Math.max(70, value - 10))}>−</button>
                <button type="button" onClick={() => setPreviewZoom(100)}>
                  {language === "es" ? "Restablecer" : "Reset"}
                </button>
                <button type="button" onClick={() => setPreviewZoom((value) => Math.min(160, value + 10))}>+</button>
              </div>
              <div className="raw-table-wrap">
                <table
                  className="raw-data-table"
                  style={{ fontSize: `${(previewZoom / 100) * 0.76}rem` } as CSSProperties}
                >
                  <thead>
                    <tr>
                      {activePreview.columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activePreview.rows.map((row, index) => (
                      <tr key={`${activePreview.path}-${index}`}>
                        {activePreview.columns.map((column) => (
                          <td key={column}>{formatRawValue(row[column])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function formatRawValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function SyncMeter({ row, language }: { row: PlayerRegistryRow; language: AmsLanguage }) {
  const label = row.tone === "synced"
    ? language === "es" ? "conectado" : "synced"
    : row.tone === "partial"
      ? language === "es" ? "parcial" : "partial"
      : language === "es" ? "pendiente" : "pending";

  return (
    <div className={`sync-meter ${row.tone}`} aria-label={`${row.percent}% ${label}`}>
      <div className="sync-meter-top">
        <strong>{row.percent}%</strong>
        <span>{label}</span>
      </div>
      <div className="sync-meter-track">
        <span style={{ width: `${row.percent}%` }} />
      </div>
      <small>{row.connectedCount} / {row.totalCount} {language === "es" ? "fuentes" : "sources"}</small>
    </div>
  );
}

function buildPlayerRegistryRows(
  rosterPlayers: Player[],
  loadSummary: LoadSummary,
  sourceData: SourceData,
  sortField: RegistrySortField,
  sortDirection: RegistrySortDirection,
): PlayerRegistryRow[] {
  const sortedRows = rosterPlayers.map((player) => {
    const auditSources = ["Bio", "Photo", "LigaMX", "SofaScore", "Match", "Sessions"].map((source) => ({
      label: source,
      tone: auditSourceTone(sourceData.syncAudit, player.amsId, source),
    }));

    const bodyCompMatch = sourceData.bodyComp.some((row) => normalizeIdentityName(row.playerName ?? row.player_name) === normalizeIdentityName(player.name));
    const sourceChecks: RegistrySource[] = [
      ...auditSources,
      { label: "WIMU/GPS", tone: loadSummary.rows.some((row) => row.amsId === player.amsId) ? "synced" : "pending" },
      { label: "Injury", tone: sourceData.injuries.some((row) => row.amsId === player.amsId || normalizeIdentityName(row.playerName) === normalizeIdentityName(player.name)) ? "synced" : "pending" },
      { label: "Body Comp", tone: bodyCompMatch ? "synced" : "pending" },
      { label: "FMS", tone: sourceData.fms.some((row) => row.amsId === player.amsId) ? "synced" : "pending" },
      { label: "Y Balance", tone: sourceData.yBalance.some((row) => row.amsId === player.amsId) ? "synced" : "pending" },
      { label: "External Tests", tone: sourceData.externalTestAssessments.some((row) => row.amsId === player.amsId) ? "synced" : "pending" },
      { label: "Mobility", tone: sourceData.mobilityScreenAssessments.some((row) => row.amsId === player.amsId) ? "synced" : "pending" },
      { label: "MSK", tone: sourceData.musculoskeletalScreenAssessments.some((row) => row.amsId === player.amsId) ? "synced" : "pending" },
      { label: "NordBord", tone: sourceData.valdNordbordTests.some((row) => row.amsId === player.amsId) ? "synced" : "pending" },
      { label: "Rehab", tone: sourceData.rehabServices.length ? "partial" : "pending" },
    ];

    const connectedCount = sourceChecks.filter((source) => source.tone === "synced").length;
    const partialCount = sourceChecks.filter((source) => source.tone === "partial").length;
    const percent = Math.round(((connectedCount + partialCount * 0.5) / sourceChecks.length) * 100);
    const tone: RegistryTone = percent >= 85 ? "synced" : percent >= 45 ? "partial" : "pending";

    return {
      player,
      sources: sourceChecks,
      percent,
      connectedCount,
      totalCount: sourceChecks.length,
      tone,
    };
  });

  return sortedRows.sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortField === "number") {
      const numberDelta = playerNumberValue(a.player) - playerNumberValue(b.player);
      if (numberDelta !== 0) return numberDelta * direction;
    }

    return a.player.name.localeCompare(b.player.name) * direction;
  });
}

function auditSourceTone(syncAudit: SyncAuditRow[], amsId: string, source: string): RegistryTone {
  const row = syncAudit.find((item) => item.amsId === amsId && item.source === source);
  if (!row) return "pending";
  if (String(row.hasData).toLowerCase() === "true") return "synced";
  return Number(row.recordCount ?? 0) > 0 ? "partial" : "pending";
}

function localizedRegistrySource(label: string, language: AmsLanguage) {
  if (language === "en") return label;
  const labels: Record<string, string> = {
    Bio: "Bio",
    Photo: "Foto",
    LigaMX: "LigaMX",
    SofaScore: "SofaScore",
    Match: "Partidos",
    Sessions: "Sesiones",
    "WIMU/GPS": "WIMU/GPS",
    Injury: "Lesiones",
    "Body Comp": "Comp. corporal",
    FMS: "FMS",
    "Y Balance": "Y Balance",
    "External Tests": "Pruebas externas",
    Mobility: "Movilidad",
    MSK: "MSK",
    NordBord: "NordBord",
    Rehab: "Rehab",
  };
  return labels[label] ?? label;
}

function normalizeIdentityName(value: string | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

function playerNumberValue(player: Player) {
  const parsed = Number(player.number);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function registryPlayerMatches(player: Player, searchTerm: string) {
  const query = normalizeIdentityName(searchTerm);
  if (!query) return true;

  return [
    player.name,
    player.amsId,
    String(player.number ?? ""),
    player.position,
    player.nationality,
  ].some((value) => normalizeIdentityName(value).includes(query));
}
