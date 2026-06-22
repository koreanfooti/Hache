"use client";

import { useMemo, useState } from "react";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import { compactNumber, numberValue } from "@/lib/ams/data";
import { atlasFirstTeamFixtures } from "@/lib/ams/atlasFixtures";
import type { CleanGpsRow, LoadSummary, PlayerMatchHistoryRow, SourceData } from "@/lib/ams/types";

type MatchSummary = {
  aggregate?: string;
  id: string;
  date: string;
  detailLine?: string;
  displayDate: string;
  competition: string;
  phase: string;
  round: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals?: number;
  awayGoals?: number;
  venue: string;
  status: string;
  source: string;
  scorers?: string[];
  playerRows: PlayerMatchHistoryRow[];
  gpsRows: CleanGpsRow[];
};

type MatchPlayer = {
  id: string;
  name: string;
  number: string;
  position: string;
  minutes: number;
  totalDistanceKm: number;
  hsrMeters: number;
  sprintMeters: number;
  maxSpeed: number;
  x: number;
  y: number;
};

const DEFAULT_MATCH_DATE = "2026-05-09";

export function MatchHistoryPanel({
  language,
  loadSummary,
  sourceData,
}: {
  language: AmsLanguage;
  loadSummary: LoadSummary;
  sourceData: SourceData;
}) {
  const copy = matchCopy(language);
  const matches = useMemo(
    () => buildMatchSummaries(sourceData.playerMatchHistory, loadSummary.rows),
    [sourceData.playerMatchHistory, loadSummary.rows],
  );
  const [dateFilter, setDateFilter] = useState(DEFAULT_MATCH_DATE);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const visibleMatches = dateFilter ? matches.filter((match) => match.date === dateFilter) : matches;
  const selectedMatch = visibleMatches.find((match) => match.id === selectedMatchId)
    ?? visibleMatches[0]
    ?? matches.find(isDefaultReferenceMatch)
    ?? matches[0];
  const matchPlayers = useMemo(
    () => selectedMatch ? buildMatchPlayers(selectedMatch) : [],
    [selectedMatch],
  );
  const pitchPlayers = matchPlayers.slice(0, 11);
  const reservePlayers = matchPlayers.slice(11);
  const totals = summarizeMatchPlayers(matchPlayers);

  function updateDateFilter(value: string) {
    setDateFilter(value);
    const nextMatch = value ? matches.find((match) => match.date === value) : matches.find(isDefaultReferenceMatch) ?? matches[0];
    setSelectedMatchId(nextMatch?.id ?? null);
  }

  if (!selectedMatch) {
    return (
      <section className="match-history-panel">
        <div className="match-history-empty">
          <span className="section-kicker">{copy.kicker}</span>
          <h2>{copy.title}</h2>
          <p>{copy.empty}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="match-history-panel">
      <section className="match-history-hero">
        <div>
          <span className="section-kicker">{copy.kicker}</span>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <aside>
          <span>{copy.source}</span>
          <strong>{copy.sourceStatus}</strong>
          <small>{copy.sourceNote}</small>
        </aside>
      </section>

      <section className="match-history-layout">
        <aside className="match-history-list" aria-label={copy.matchList}>
          <div className="panel-heading">
            <div className="match-list-title">
              <span>{copy.matchList}</span>
              <strong>{visibleMatches.length} / {matches.length} {copy.matches}</strong>
            </div>
            <div className="match-list-controls">
              <label>
                <span>{copy.dateFilter}</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => updateDateFilter(event.target.value)}
                />
              </label>
              <button type="button" onClick={() => updateDateFilter("")}>
                {copy.allDates}
              </button>
            </div>
          </div>
          <div className="match-history-scroll">
            {visibleMatches.length ? visibleMatches.map((match) => (
              <button
                className={match.id === selectedMatch.id ? "is-active" : ""}
                key={match.id}
                type="button"
                onClick={() => setSelectedMatchId(match.id)}
              >
                <span>{formatMatchDate(match.date, match.displayDate, language)}</span>
                <strong>{match.homeTeam} {scoreValue(match.homeGoals)} - {scoreValue(match.awayGoals)} {match.awayTeam}</strong>
                <small>{match.competition} · {match.round}</small>
              </button>
            )) : (
              <p className="match-history-no-results">{copy.noDateMatches}</p>
            )}
          </div>
        </aside>

        <main className="match-history-main">
          <section className="match-score-card">
            <div className="match-score-meta">
              <span>{selectedMatch.competition} · {formatMatchDate(selectedMatch.date, selectedMatch.displayDate, language)}</span>
              <strong>{selectedMatch.status}</strong>
            </div>
            <div className="match-score-line">
              <TeamScore team={selectedMatch.homeTeam} goals={selectedMatch.homeGoals} />
              <span className="match-score-dash">-</span>
              <TeamScore team={selectedMatch.awayTeam} goals={selectedMatch.awayGoals} />
            </div>
            {selectedMatch.scorers?.length ? (
              <div className="match-score-events">
                {selectedMatch.scorers.map((scorer) => <span key={scorer}>{scorer}</span>)}
              </div>
            ) : null}
            <p>{[
              selectedMatch.detailLine || selectedMatch.phase || selectedMatch.round,
              selectedMatch.aggregate,
              selectedMatch.venue || copy.venuePending,
            ].filter(Boolean).join(" · ")}</p>
          </section>

          <section className="match-kpi-grid">
            <MetricCard label={copy.totalDistance} value={compactNumber(totals.totalDistanceKm, 1)} unit="km" />
            <MetricCard label={copy.hsr} value={compactNumber(totals.hsrMeters)} unit="m" />
            <MetricCard label={copy.sprint} value={compactNumber(totals.sprintMeters)} unit="m" />
            <MetricCard label={copy.maxSpeed} value={compactNumber(totals.maxSpeed, 1)} unit="km/h" />
          </section>

          <section className="match-field-card">
            <div className="match-field-heading">
              <div>
                <span>{copy.fieldView}</span>
                <strong>Atlas</strong>
              </div>
              <small>{copy.photoNote}</small>
            </div>
            <div className="match-field-layout">
              <div className="match-pitch" aria-label={copy.fieldView}>
                <div className="match-pitch-line half" />
                <div className="match-pitch-box top" />
                <div className="match-pitch-box bottom" />
                <div className="match-pitch-circle" />
                {pitchPlayers.map((player) => (
                  <article
                    className="match-player-marker"
                    key={player.id}
                    style={{ "--x": `${player.x}%`, "--y": `${player.y}%` } as React.CSSProperties}
                    title={`${player.name} · ${compactNumber(player.totalDistanceKm, 1)} km`}
                  >
                    <span>{player.number || initials(player.name)}</span>
                    <strong>{shortName(player.name)}</strong>
                  </article>
                ))}
              </div>

              <aside className="match-player-panel">
                <div>
                  <span>{copy.onField}</span>
                  {pitchPlayers.slice(0, 6).map((player) => (
                    <PlayerLoadRow key={player.id} player={player} />
                  ))}
                </div>
                <div>
                  <span>{copy.substitutes}</span>
                  {(reservePlayers.length ? reservePlayers : pitchPlayers.slice(6)).slice(0, 7).map((player) => (
                    <PlayerLoadRow key={`${player.id}-reserve`} player={player} compact />
                  ))}
                </div>
              </aside>
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}

function TeamScore({ team, goals }: { team: string; goals?: number }) {
  return (
    <div className="match-team-score">
      <span>{clubInitials(team)}</span>
      <strong>{scoreValue(goals)}</strong>
      <small>{team}</small>
    </div>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{unit}</small>
    </article>
  );
}

function PlayerLoadRow({ player, compact = false }: { player: MatchPlayer; compact?: boolean }) {
  return (
    <article className="match-player-load-row">
      <b>{player.number || initials(player.name)}</b>
      <div>
        <strong>{player.name}</strong>
        <small>{player.position || "-"}{compact ? "" : ` · ${compactNumber(player.minutes, 0)} min`}</small>
      </div>
      <span>{compactNumber(player.totalDistanceKm, 1)} km</span>
    </article>
  );
}

function buildMatchSummaries(matchRows: PlayerMatchHistoryRow[], gpsRows: CleanGpsRow[]) {
  const matchMap = new Map<string, MatchSummary>();

  for (const row of matchRows) {
    const date = row.dateIso || row.dateDisplay || row.dateRaw || "no-date";
    const id = `${date}-${normalizeText(row.localTeam || "home")}-${normalizeText(row.visitorTeam || "away")}`;
    const existing = matchMap.get(id);
    const summary: MatchSummary = existing ?? {
      id,
      date: row.dateIso || "",
      displayDate: row.dateDisplay || row.dateIso || row.dateRaw || "-",
      competition: row.tournament || row.source || "Liga MX",
      phase: row.phase || "",
      round: row.jornada || "",
      homeTeam: row.localTeam || "Home",
      awayTeam: row.visitorTeam || "Away",
      homeGoals: row.localGoals,
      awayGoals: row.visitorGoals,
      venue: row.venue || "",
      status: row.status || "Finalizado",
      source: row.source || "LigaMX",
      playerRows: [],
      gpsRows: [],
    };
    summary.playerRows.push(row);
    matchMap.set(id, summary);
  }

  for (const fixture of atlasFirstTeamFixtures) {
    const id = `${fixture.date}-${normalizeText(fixture.homeTeam)}-${normalizeText(fixture.awayTeam)}`;
    if (!matchMap.has(id)) {
      const [homeGoals, awayGoals] = parseFixtureScore(fixture.score, fixture.homeTeam, fixture.awayTeam);
      matchMap.set(id, {
        id,
        date: fixture.date,
        displayDate: fixture.date,
        competition: fixture.competition,
        phase: fixture.round,
        round: fixture.round,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeGoals,
        awayGoals,
        venue: "",
        status: fixture.status === "finished" ? "Finalizado" : "Scheduled",
        source: "Atlas fixture cache",
        playerRows: [],
        gpsRows: [],
      });
    }
  }

  const matches = Array.from(matchMap.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  for (const match of matches) {
    applyReferenceMatchDetails(match);
    match.gpsRows = gpsRows.filter((row) => rowBelongsToMatch(row, match));
  }

  return matches;
}

function buildMatchPlayers(match: MatchSummary) {
  const byPlayer = new Map<string, MatchPlayer>();
  const relevantRows = match.gpsRows.length ? match.gpsRows : match.playerRows.map(matchHistoryToGpsLike);

  for (const row of relevantRows) {
    const name = String(row.cleanPlayerName ?? row.sourcePlayerName ?? row.playerName ?? row.name ?? row.athlete ?? "Unknown player").trim();
    const id = String(row.amsId || normalizeText(name));
    const current = byPlayer.get(id);
    const minutes = numberValue(row.minutes);
    const player: MatchPlayer = current ?? {
      id,
      name,
      number: String(row.wimuShirtNumber ?? row.shirtNumber ?? "").trim(),
      position: positionLabel(row),
      minutes: 0,
      totalDistanceKm: 0,
      hsrMeters: 0,
      sprintMeters: 0,
      maxSpeed: 0,
      x: 50,
      y: 50,
    };

    player.minutes = Math.max(player.minutes, minutes);
    player.totalDistanceKm += numberValue(row.totalDistance ?? row.total_distance_m) / 1000;
    player.hsrMeters += numberValue(row.hsrAbsDistance ?? row.high_intensity_m ?? row.highIntensityDistance);
    player.sprintMeters += numberValue(row.sprintDistance);
    player.maxSpeed = Math.max(player.maxSpeed, numberValue(row.maxSpeedKmh ?? row.max_speed_kmh ?? row.maxSpeed));
    if (!player.number) player.number = String(row.wimuShirtNumber ?? row.shirtNumber ?? "").trim();
    if (!player.position || player.position === "-") player.position = positionLabel(row);
    byPlayer.set(id, player);
  }

  const players = Array.from(byPlayer.values()).sort((a, b) => b.minutes - a.minutes || b.totalDistanceKm - a.totalDistanceKm);
  return assignPitchPositions(players);
}

function matchHistoryToGpsLike(row: PlayerMatchHistoryRow): CleanGpsRow {
  return {
    amsId: row.amsId,
    cleanPlayerName: row.amsId || "Atlas player",
    date: row.dateIso,
    minutes: String(row.minutes ?? 0),
    sessionName: `${row.localTeam ?? ""} VS ${row.visitorTeam ?? ""}`,
    sourcePlayerName: row.amsId,
  } as CleanGpsRow;
}

function assignPitchPositions(players: MatchPlayer[]) {
  const groups = {
    gk: players.filter((player) => positionBucket(player.position) === "gk"),
    def: players.filter((player) => positionBucket(player.position) === "def"),
    mid: players.filter((player) => positionBucket(player.position) === "mid"),
    fwd: players.filter((player) => positionBucket(player.position) === "fwd"),
    other: players.filter((player) => positionBucket(player.position) === "other"),
  };
  const ordered = [
    ...groups.gk,
    ...groups.def,
    ...groups.mid,
    ...groups.fwd,
    ...groups.other,
  ];
  const rows = [
    { players: groups.gk, y: 87 },
    { players: groups.def, y: 68 },
    { players: groups.mid, y: 47 },
    { players: groups.fwd, y: 25 },
    { players: groups.other, y: 12 },
  ];

  for (const row of rows) {
    row.players.forEach((player, index) => {
      player.x = spreadX(row.players.length, index);
      player.y = row.y;
    });
  }

  return ordered;
}

function spreadX(total: number, index: number) {
  if (total <= 1) return 50;
  const padding = total >= 5 ? 12 : 20;
  return padding + ((100 - padding * 2) / (total - 1)) * index;
}

function summarizeMatchPlayers(players: MatchPlayer[]) {
  return players.reduce(
    (summary, player) => ({
      totalDistanceKm: summary.totalDistanceKm + player.totalDistanceKm,
      hsrMeters: summary.hsrMeters + player.hsrMeters,
      sprintMeters: summary.sprintMeters + player.sprintMeters,
      maxSpeed: Math.max(summary.maxSpeed, player.maxSpeed),
    }),
    { totalDistanceKm: 0, hsrMeters: 0, sprintMeters: 0, maxSpeed: 0 },
  );
}

function rowBelongsToMatch(row: CleanGpsRow, match: MatchSummary) {
  const sessionName = normalizeText(String(row.sessionName ?? row.session_name ?? ""));
  const home = normalizeText(match.homeTeam);
  const away = normalizeText(match.awayTeam).replace(/ fc$/, "");
  const dateDistance = Math.abs(dateNumber(row.date) - dateNumber(match.date));
  const sessionHasTeams = sessionName.includes(home) && sessionName.includes(away === "atlas" ? "atlas" : away);
  return dateDistance <= 1 && sessionHasTeams;
}

function parseFixtureScore(score: string | undefined, homeTeam: string, awayTeam: string): [number | undefined, number | undefined] {
  if (!score) return [undefined, undefined];
  const pattern = new RegExp(`${escapeRegExp(homeTeam)}\\s+(\\d+)\\s*-\\s*(\\d+)\\s+${escapeRegExp(awayTeam)}`, "i");
  const match = score.match(pattern) ?? score.match(/(\d+)\s*-\s*(\d+)/);
  return match ? [Number(match[1]), Number(match[2])] : [undefined, undefined];
}

function applyReferenceMatchDetails(match: MatchSummary) {
  if (!isDefaultReferenceMatch(match)) return;
  match.detailLine = "Quarter-final · Leg 2 of 2";
  match.aggregate = "Aggregate: 4 - 2";
  match.scorers = ["José Paradela 32'"];
  match.source = "Google example + LigaMX cache";
}

function isDefaultReferenceMatch(match: MatchSummary) {
  return match.date === DEFAULT_MATCH_DATE
    && normalizeText(match.homeTeam).includes("cruz azul")
    && normalizeText(match.awayTeam).includes("atlas");
}

function positionLabel(row: CleanGpsRow) {
  return String(row.wimuPosition ?? row.position ?? row.playerPosition ?? "-").trim();
}

function positionBucket(position: string) {
  const value = normalizeText(position);
  if (value.includes("portero") || value.includes("goal")) return "gk";
  if (value.includes("defensa") || value.includes("defender") || value.includes("lateral") || value.includes("central")) return "def";
  if (value.includes("medio") || value.includes("mid")) return "mid";
  if (value.includes("delantero") || value.includes("forward") || value.includes("wing") || value.includes("atac")) return "fwd";
  return "other";
}

function dateNumber(value: string | undefined) {
  const parsed = value ? new Date(`${value}T12:00:00Z`) : new Date(0);
  return Number.isNaN(parsed.getTime()) ? 0 : Math.floor(parsed.getTime() / 86400000);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function shortName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AT";
}

function clubInitials(value: string) {
  if (normalizeText(value) === "atlas") return "A";
  return initials(value);
}

function scoreValue(value: number | undefined) {
  return typeof value === "number" ? value : "-";
}

function formatMatchDate(value: string, fallback: string, language: AmsLanguage) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat(language === "es" ? "es-MX" : "en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(parsed);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchCopy(language: AmsLanguage) {
  if (language === "es") {
    return {
      description: "Historial de partidos estilo Google con marcador, lista de partidos y vista de cancha conectada a fuentes limpias del AMS.",
      allDates: "Todas",
      dateFilter: "Fecha",
      empty: "No hay historial de partidos cargado todavía.",
      fieldView: "Vista de cancha",
      hsr: "HSR",
      kicker: "Primer equipo",
      matchList: "Partidos",
      matches: "partidos",
      maxSpeed: "Velocidad máx.",
      noDateMatches: "No hay partidos en esta fecha.",
      onField: "En cancha",
      photoNote: "Fotos omitidas por ahora; usando números e iniciales.",
      source: "Fuente",
      sourceNote: "El scraping directo de la interfaz de Google queda como adaptador futuro; esta vista usa caché local LigaMX/AMS.",
      sourceStatus: "Google-style cache",
      sprint: "Sprint",
      substitutes: "Banca / menor carga",
      title: "Historial de partidos",
      totalDistance: "Distancia total",
      venuePending: "Sede pendiente",
    };
  }

  return {
    description: "Google-style match history with scoreline, match list, and pitch view connected to clean AMS sources.",
    allDates: "All",
    dateFilter: "Date",
    empty: "No match history is loaded yet.",
    fieldView: "Field view",
    hsr: "HSR",
    kicker: "First team",
    matchList: "Matches",
    matches: "matches",
    maxSpeed: "Max speed",
    noDateMatches: "No matches on this date.",
    onField: "On field",
    photoNote: "Photos ignored for now; using numbers and initials.",
    source: "Source",
    sourceNote: "Direct scraping of Google's rendered UI is kept as a future adapter; this view uses the local LigaMX/AMS cache.",
    sourceStatus: "Google-style cache",
    sprint: "Sprint",
    substitutes: "Bench / lower load",
    title: "Match History",
    totalDistance: "Total distance",
    venuePending: "Venue pending",
  };
}
