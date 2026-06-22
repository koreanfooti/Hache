"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import type { AmsSection, Player } from "@/lib/ams/content";
import { navItems } from "@/lib/ams/content";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import {
  isMvpSidebarSection,
  mvpSectionLabel,
  mvpSourceCards,
  type MvpSourceCardId,
} from "@/components/ams/config/mvp";
import { panelCopy, uiCopy } from "@/components/ams/config/copy";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import type { CleanGpsRow, LoadSummary, SourceData } from "@/lib/ams/types";

export function AppHeader({
  activeLabel,
  canOpenCalendar,
  canOpenSettings,
  language,
  roleLabel,
  userName,
  onGoHome,
  onLanguageChange,
  onOpenCalendar,
  onOpenSettings,
  onSignOut,
}: {
  activeLabel: string;
  canOpenCalendar: boolean;
  canOpenSettings: boolean;
  language: AmsLanguage;
  roleLabel: string;
  userName: string;
  onGoHome: () => void;
  onLanguageChange: (language: AmsLanguage) => void;
  onOpenCalendar: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}) {
  const copy = uiCopy[language];

  return (
    <header className="ams-header">
      <button className="ams-brand" type="button" onClick={onGoHome} aria-label={copy.home}>
        <Image
          src="/ams/assets/clubs/10445.png"
          alt="Atlas FC crest"
          width={86}
          height={86}
          priority
        />
        <div>
          <p>{copy.appEyebrow}</p>
          <h1>{copy.appTitle}</h1>
        </div>
      </button>
      <div className="ams-header-actions">
        {canOpenCalendar ? (
          <button className="calendar-button" type="button" onClick={onOpenCalendar} aria-label={copy.calendar}>
            <Image src="/ams/assets/calendar-clock.png" alt="" width={28} height={28} />
          </button>
        ) : null}
        <span className="language-action" aria-label={copy.language}>
          <button
            className={language === "en" ? "is-active" : ""}
            type="button"
            onClick={() => onLanguageChange("en")}
            aria-label="Switch to English"
          >
            🇬🇧
          </button>
          <button
            className={language === "es" ? "is-active" : ""}
            type="button"
            onClick={() => onLanguageChange("es")}
            aria-label="Cambiar a español"
          >
            🇲🇽
          </button>
        </span>
        {canOpenSettings ? (
          <button className="data-source-action" type="button" onClick={onOpenSettings} aria-label={copy.openSettings}>
            {mvpSectionLabel("settings", language)}
          </button>
        ) : null}
        <span className="active-section-pill">{activeLabel}</span>
        <span className="auth-user-pill">
          <strong>{userName}</strong>
          <small>{roleLabel}</small>
        </span>
        <button className="sign-out-action" type="button" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </header>
  );
}

export function ModuleNav({
  activeSection,
  allowedSections,
  language,
  onSelect,
}: {
  activeSection: AmsSection;
  allowedSections: AmsSection[];
  language: AmsLanguage;
  onSelect: (section: AmsSection) => void;
}) {
  const copy = uiCopy[language];
  const sectionLabels: Partial<Record<AmsSection, string>> = copy.sections;

  return (
    <nav className="ams-module-nav" aria-label="AMS modules">
      <div className="ams-module-nav-inner">
        {navItems.filter((item) =>
          allowedSections.includes(item.id)
          && isMvpSidebarSection(item.id),
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeSection ? "is-active" : ""}
            onClick={() => onSelect(item.id)}
          >
            <span className="module-nav-mark" aria-hidden="true">{moduleNavMark(item.id)}</span>
            <span className="module-nav-text">
              <small>{item.eyebrow}</small>
              <strong>{mvpSectionLabel(item.id, language) ?? sectionLabels[item.id] ?? item.label}</strong>
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function moduleNavMark(section: AmsSection) {
  const marks: Partial<Record<AmsSection, string>> = {
    biography: "ID",
    bodyComp: "%",
    development: "P",
    injury: "+",
    load: "L",
    recovery: "R",
  };

  return marks[section] ?? "H";
}

export function ContextStrip({ language, playerCount }: { language: AmsLanguage; playerCount: number }) {
  const copy = uiCopy[language];

  return (
    <section className="club-context">
      <div>
        <span className="section-kicker">{copy.contextKicker}</span>
        <p>{copy.contextCopy}</p>
      </div>
      <div className="context-stat">
        <strong>{playerCount}</strong>
        <span>{copy.playersInView}</span>
      </div>
    </section>
  );
}

export function PlayerStrip({
  language,
  playersInView,
  selectedPlayerId,
  onNext,
  onPrevious,
  onSelect,
}: {
  language: AmsLanguage;
  playersInView: Player[];
  selectedPlayerId: string;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (playerId: string) => void;
}) {
  const carouselPlayers = [...playersInView, ...playersInView];
  const copy = uiCopy[language];

  return (
    <section className="player-carousel-panel" aria-label={copy.playerCarousel}>
      <div className="player-carousel-header">
        <div>
          <span className="section-kicker">{copy.playerCarousel}</span>
          <strong>{copy.playerCarousel}</strong>
        </div>
        <div className="player-carousel-controls">
          <button type="button" onClick={onPrevious} aria-label={copy.showPreviousPlayer}>
            ‹
          </button>
          <button type="button" onClick={onNext} aria-label={copy.showNextPlayer}>
            ›
          </button>
        </div>
      </div>
      <div className="player-strip">
        <div className="player-strip-track">
          {carouselPlayers.map((player, index) => {
            const fallbackNumber = player.number && String(player.number) !== "-" ? String(player.number) : "";

            return (
              <button
                key={`${player.id}-${index}`}
                type="button"
                className={player.id === selectedPlayerId ? "player-pill is-active" : "player-pill"}
                onClick={() => onSelect(player.id)}
                tabIndex={index >= playersInView.length ? -1 : 0}
                aria-hidden={index >= playersInView.length}
              >
                <span className="player-photo">
                  {hasPlayerPhoto(player) ? (
                    <Image src={player.photo} alt="" width={72} height={72} />
                  ) : (
                    <span className="player-photo-fallback">{fallbackNumber}</span>
                  )}
                </span>
                <span>
                  <strong>{player.name}</strong>
                  <small>{player.amsId}</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function OverviewPanel({
  currentTime,
  language,
  loadSummary,
  sourceData,
  selectedPlayer,
  visiblePlayers,
  allowedSections,
  onSelectPlayer,
  onSelectSection,
}: {
  currentTime: Date | null;
  language: AmsLanguage;
  loadSummary: LoadSummary;
  sourceData: SourceData;
  selectedPlayer: Player;
  visiblePlayers: Player[];
  allowedSections: AmsSection[];
  onSelectPlayer: (playerId: string) => void;
  onSelectSection: (section: AmsSection) => void;
}) {
  const copy = uiCopy[language];
  const sectionLabels: Partial<Record<AmsSection, string>> = copy.sections;
  const dashboardCopy = dashboardLabels(language);
  const dateText = dashboardDateLabel(currentTime, language);
  const overviewCopy = overviewLabels(language, selectedPlayer.name);
  const playerRows = playerLoadRows(selectedPlayer, loadSummary.rows);
  const sessionRows = (playerRows.length ? playerRows : loadSummary.rows)
    .filter((row) => row.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 7);
  const trendRows = [...sessionRows].reverse().slice(-6);
  const lastDistanceKm = loadDistanceKm(sessionRows[0]);
  const sourceCards = mvpSourceCards.map((card) => ({
    ...card,
    count: sourceCount(card.id, loadSummary, sourceData),
    detail: sourceDetail(card.id, language),
  }));
  const testingRows = sourceData.fms.length + sourceData.yBalance.length + sourceData.valdNordbordTests.length;
  const quickActions = [
    {
      section: "load" as const,
      label: sectionLabels.load ?? "Load Demand",
      value: compactNumber(loadSummary.sessions),
      detail: panelCopy[language].common.records,
    },
    {
      section: "injury" as const,
      label: sectionLabels.injury ?? "Injury History",
      value: compactNumber(sourceData.injuries.length),
      detail: panelCopy[language].common.injuries,
    },
    {
      section: "development" as const,
      label: sectionLabels.development ?? "Physical Development",
      value: compactNumber(testingRows),
      detail: panelCopy[language].common.tests,
    },
    {
      section: "bodyComp" as const,
      label: mvpSectionLabel("bodyComp", language) ?? "Body Composition",
      value: compactNumber(sourceData.bodyComp.length),
      detail: panelCopy[language].common.records,
    },
    {
      section: "recovery" as const,
      label: sectionLabels.recovery ?? "Recovery",
      value: compactNumber(sourceData.rehabServices.length),
      detail: panelCopy[language].common.records,
    },
    {
      section: "settings" as const,
      label: mvpSectionLabel("settings", language) ?? "Data Sources",
      value: compactNumber(mvpSourceCards.length),
      detail: overviewCopy.sourceRegistry,
    },
  ].filter((action) => allowedSections.includes(action.section));

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <span>{dashboardCopy.kicker}</span>
          <h2>{overviewCopy.title}</h2>
          <p>{dashboardCopy.heroBody}</p>
        </div>
        <div className="dashboard-player-count">
          <strong>{visiblePlayers.length}</strong>
          <small>{copy.playersInView}</small>
        </div>
      </section>

      <section className="dashboard-roster" aria-label={copy.playerCarousel}>
        <span>{dashboardCopy.squadRoster}</span>
        <div className="dashboard-roster-track">
          {visiblePlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              className={player.id === selectedPlayer.id ? "is-active" : ""}
              onClick={() => onSelectPlayer(player.id)}
            >
              <span className="dashboard-roster-photo">
                {hasPlayerPhoto(player) ? (
                  <Image src={player.photo} alt="" width={42} height={42} />
                ) : (
                  <b>{player.number || ""}</b>
                )}
              </span>
              <span>
                <strong>{player.name}</strong>
                <small>{player.amsId}</small>
              </span>
              <em>{player.number || "-"}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-focus-card">
        <div className="dashboard-focus-player">
          <span>{overviewCopy.player}</span>
          <div>
            <span className="dashboard-focus-photo">
              {hasPlayerPhoto(selectedPlayer) ? (
                <Image src={selectedPlayer.photo} alt="" width={76} height={76} />
              ) : (
                <b>{selectedPlayer.number || ""}</b>
              )}
            </span>
            <div>
              <h3>{selectedPlayer.name}</h3>
              <p>#{selectedPlayer.number || "-"} · {selectedPlayer.amsId}</p>
              <div className="dashboard-focus-tags">
                <small>{selectedPlayer.status === "synced" ? dashboardCopy.active : dashboardCopy.review}</small>
                <small>{selectedPlayer.position}</small>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-focus-metrics">
          <article>
            <span>{overviewCopy.medical}</span>
            <strong>{compactNumber(sourceData.injuries.length)}</strong>
            <small>{overviewCopy.injuryRows}</small>
          </article>
          <article>
            <span>{overviewCopy.performance}</span>
            <strong>{compactNumber(loadSummary.rows.length)}</strong>
            <small>{overviewCopy.gpsRows}</small>
          </article>
          <article>
            <span>{dashboardCopy.lastSession}</span>
            <strong>{compactNumber(lastDistanceKm, 1)}</strong>
            <small>{dashboardCopy.totalDistanceKm}</small>
          </article>
        </div>
        <time>{dateText}</time>
      </section>

      <section className="dashboard-kpi-grid">
        {quickActions.map((action) => (
          <button
            key={action.section}
            type="button"
            onClick={() => onSelectSection(action.section)}
          >
            <span>{action.label}</span>
            <strong>{action.value}</strong>
            <small>{action.detail}</small>
          </button>
        ))}
      </section>

      <section className="dashboard-lower-grid">
        <article className="dashboard-session-card">
          <div className="dashboard-card-heading">
            <div>
              <span>{sectionLabels.load ?? "Load Demand"}</span>
              <h3>{dashboardCopy.sessionLog} - {selectedPlayer.name}</h3>
            </div>
            <small>{dashboardCopy.latestRows}</small>
          </div>
          <div className="dashboard-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{dashboardCopy.date}</th>
                  <th>{dashboardCopy.sessionType}</th>
                  <th>{dashboardCopy.distance}</th>
                  <th>{dashboardCopy.highSpeed}</th>
                  <th>{dashboardCopy.loadScore}</th>
                </tr>
              </thead>
              <tbody>
                {sessionRows.map((row, index) => {
                  const score = dashboardLoadScore(row);
                  return (
                    <tr key={`${row.date ?? "no-date"}-${row.amsId ?? row.cleanPlayerName ?? row.playerName ?? "player"}-${row.sessionName ?? row.session_type ?? "session"}-${index}`}>
                      <td>{formatShortDate(row.date, language)}</td>
                      <td>{loadSessionType(row)}</td>
                      <td>{compactNumber(loadDistanceKm(row), 1)}</td>
                      <td>{compactNumber(loadHighSpeed(row), 2)}</td>
                      <td className={score >= 800 ? "is-hot" : score >= 500 ? "is-warm" : ""}>{score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="dashboard-trend-card">
          <div className="dashboard-card-heading">
            <div>
              <span>{dashboardCopy.weeklyLoadTrend}</span>
              <h3>{dashboardCopy.lastSix}</h3>
            </div>
          </div>
          <div className="dashboard-trend-chart">
            {trendRows.map((row, index) => {
              const score = dashboardLoadScore(row);
              return (
                <span key={`${row.date}-${index}`} style={{ "--bar-height": `${Math.max(12, Math.min(100, score / 10))}%` } as CSSProperties}>
                  <i />
                  <small>W{index + 1}</small>
                </span>
              );
            })}
          </div>
          <dl>
            <div>
              <dt>{dashboardCopy.avgLoad}</dt>
              <dd>{compactNumber(averageLoadScore(sessionRows))}</dd>
            </div>
            <div>
              <dt>{dashboardCopy.peakSession}</dt>
              <dd className="is-hot">{compactNumber(Math.max(0, ...sessionRows.map(dashboardLoadScore)))}</dd>
            </div>
            <div>
              <dt>{dashboardCopy.monotonyIndex}</dt>
              <dd className="is-warm">{compactNumber(loadMonotony(sessionRows), 2)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="dashboard-source-section">
        <span>{dashboardCopy.connectedSources}</span>
        <div className="dashboard-source-grid">
          {sourceCards.map((item) => (
            <article key={item.id}>
              <Image src={item.asset} alt="" width={32} height={32} />
              <div>
                <strong>{item.labels[language]}</strong>
                <small>{compactNumber(item.count)} {item.detail}</small>
              </div>
              <i />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function dashboardLabels(language: AmsLanguage) {
  if (language === "es") {
    return {
      active: "Activo",
      avgLoad: "Carga media 7 dias",
      connectedSources: "Fuentes conectadas",
      date: "Fecha",
      distance: "Distancia (km)",
      heroBody: "Vista integrada para carga diaria, riesgo medico, desarrollo, recuperacion, biografia y cobertura de fuentes.",
      highSpeed: "Alta velocidad",
      kicker: "Monitoreo primer equipo",
      lastSession: "Ultima sesion",
      lastSix: "Ultimas 6 semanas",
      latestRows: "Ultimas filas GPS",
      loadScore: "Carga",
      monotonyIndex: "Indice monotonia",
      peakSession: "Pico sesion",
      records: "registros",
      review: "Revision",
      sessionLog: "Registro de sesiones",
      sessionType: "Tipo de sesion",
      squadRoster: "Plantilla",
      totalDistanceKm: "distancia total (km)",
      weeklyLoadTrend: "Tendencia carga semanal",
    };
  }

  return {
    active: "Active",
    avgLoad: "7-day avg load",
    connectedSources: "Connected data sources",
    date: "Date",
    distance: "Distance (km)",
    heroBody: "Integrated staff view for daily load, medical risk, development, recovery, biography, and source coverage.",
    highSpeed: "High speed",
    kicker: "First team monitoring",
    lastSession: "Last session",
    lastSix: "Last 6 weeks",
    latestRows: "Latest GPS rows",
    loadScore: "Load score",
    monotonyIndex: "Monotony index",
    peakSession: "Peak session",
    records: "records",
    review: "Review",
    sessionLog: "Session log",
    sessionType: "Session type",
    squadRoster: "Squad roster",
    totalDistanceKm: "total distance (km)",
    weeklyLoadTrend: "Weekly load trend",
  };
}

function playerLoadRows(player: Player, rows: CleanGpsRow[]) {
  const playerName = normalizeName(player.name);

  return rows.filter((row) => {
    if (row.amsId && row.amsId === player.amsId) return true;
    const rowName = normalizeName(row.cleanPlayerName ?? row.playerName ?? row.name ?? row.athlete ?? row.sourcePlayerName ?? "");
    return Boolean(rowName) && rowName === playerName;
  });
}

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function loadDistanceMeters(row: CleanGpsRow | undefined) {
  return numberValue(row?.totalDistance ?? row?.total_distance_m);
}

function loadDistanceKm(row: CleanGpsRow | undefined) {
  return loadDistanceMeters(row) / 1000;
}

function loadHighSpeed(row: CleanGpsRow | undefined) {
  return numberValue(row?.maxSpeedKmh ?? row?.max_speed_kmh ?? row?.maxSpeed);
}

function loadSessionType(row: CleanGpsRow) {
  const explicitType = row.sessionName ?? row.session_type;
  if (explicitType) return String(explicitType);
  return String(row.isMatch ?? "").toLowerCase() === "true" ? "Match Day" : "Training";
}

function dashboardLoadScore(row: CleanGpsRow) {
  const distanceScore = loadDistanceKm(row) * 58;
  const speedScore = loadHighSpeed(row) * 12;
  const intensityScore = numberValue(row.hsrAbsDistance ?? row.high_intensity_m ?? row.highIntensityDistance) / 35;
  return Math.round(Math.min(999, distanceScore + speedScore + intensityScore));
}

function averageLoadScore(rows: CleanGpsRow[]) {
  if (!rows.length) return 0;
  return rows.reduce((total, row) => total + dashboardLoadScore(row), 0) / rows.length;
}

function loadMonotony(rows: CleanGpsRow[]) {
  if (rows.length < 2) return 0;
  const scores = rows.map(dashboardLoadScore);
  const average = scores.reduce((total, score) => total + score, 0) / scores.length;
  const variance = scores.reduce((total, score) => total + (score - average) ** 2, 0) / scores.length;
  const deviation = Math.sqrt(variance);
  return deviation ? average / deviation : 0;
}

function formatShortDate(value: string | undefined, language: AmsLanguage) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(parsed);
}

function dashboardDateLabel(value: Date | null, language: AmsLanguage) {
  if (!value) return language === "es" ? "Hoy" : "Today";
  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Mexico_City",
    weekday: "long",
  }).format(value);
}

function overviewLabels(language: AmsLanguage, playerName: string) {
  if (language === "es") {
    return {
      body: `Vista ejecutiva para revisar carga, historial médico, pruebas, composición y recuperación antes de profundizar en ${playerName}.`,
      gpsRows: "filas WIMU/GPS cargadas",
      injuryRows: "registros médicos limpios",
      kicker: "MVP listo para dirección",
      medical: "Cobertura médica",
      performance: "Cobertura física",
      player: "Jugador en foco",
      sourceRegistry: "fuentes activas",
      title: "Centro de mando médico y rendimiento",
    };
  }

  return {
    body: `Director view for checking load, medical history, testing, composition, and recovery before drilling into ${playerName}.`,
    gpsRows: "loaded WIMU/GPS rows",
    injuryRows: "clean medical records",
    kicker: "Presentation-ready MVP",
    medical: "Medical coverage",
    performance: "Performance coverage",
    player: "Player in focus",
    sourceRegistry: "active sources",
    title: "Medical and performance command center",
  };
}

function sourceCount(id: MvpSourceCardId, loadSummary: LoadSummary, sourceData: SourceData) {
  if (id === "gps") return loadSummary.rows.length;
  if (id === "injury") return sourceData.injuries.length;
  if (id === "bodyComp") return sourceData.bodyComp.length;
  if (id === "testing") return sourceData.fms.length + sourceData.fmsExerciseScores.length + sourceData.yBalance.length + sourceData.yBalanceMetrics.length;
  if (id === "vald") return sourceData.valdNordbordTests.length + sourceData.valdNordbordMetrics.length;
  if (id === "rehab") return sourceData.rehabServices.length;
  return sourceData.playerMaster.length;
}

function sourceDetail(id: MvpSourceCardId, language: AmsLanguage) {
  const labels: Record<AmsLanguage, Record<MvpSourceCardId, string>> = {
    en: {
      bodyComp: "body comp records",
      gps: "load records",
      injury: "injury records",
      players: "players",
      rehab: "service rows",
      testing: "testing rows",
      vald: "NordBord rows",
    },
    es: {
      bodyComp: "registros comp.",
      gps: "registros carga",
      injury: "registros lesión",
      players: "jugadores",
      rehab: "filas servicio",
      testing: "filas pruebas",
      vald: "filas NordBord",
    },
  };

  return labels[language][id];
}
