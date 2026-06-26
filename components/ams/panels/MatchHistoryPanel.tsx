"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import { players as atlasRoster } from "@/lib/ams/content";
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
  card?: "yellow";
  id: string;
  name: string;
  number: string;
  photo?: string;
  position: string;
  minutes: number;
  totalDistanceKm: number;
  hsrMeters: number;
  sprintMeters: number;
  maxSpeed: number;
  subEvent?: "in" | "out";
  subMinute?: number;
  x: number;
  y: number;
};

const DEFAULT_MATCH_DATE = "2026-05-09";
type TeamView = "atlas" | "opponent";

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
  const [selectedTeamView, setSelectedTeamView] = useState<TeamView>("atlas");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const visibleMatches = matches;
  const selectedMatch = visibleMatches.find((match) => match.id === selectedMatchId)
    ?? matches.find(isDefaultReferenceMatch)
    ?? matches[0];
  const atlasMatchPlayers = useMemo(
    () => selectedMatch ? buildMatchPlayers(selectedMatch) : [],
    [selectedMatch],
  );
  const opponentMatchPlayers = useMemo(
    () => selectedMatch ? buildOpponentPlayers(selectedMatch) : [],
    [selectedMatch],
  );
  const visibleTeamPlayers = selectedTeamView === "opponent" ? opponentMatchPlayers : atlasMatchPlayers;
  const pitchPlayers = visibleTeamPlayers.slice(0, 11);
  const reservePlayers = visibleTeamPlayers.slice(11);
  const totals = summarizeMatchPlayers(atlasMatchPlayers);
  const hasFieldPlayers = pitchPlayers.length > 0;
  const activeTeamName = selectedMatch
    ? selectedTeamView === "opponent" ? opponentTeamForMatch(selectedMatch) : "Atlas"
    : "Atlas";
  const activeFormation = formationForPlayers(pitchPlayers, referenceFormation(selectedMatch, selectedTeamView));

  function updateSelectedMatch(matchId: string) {
    const nextMatch = matches.find((match) => match.id === matchId) ?? matches.find(isDefaultReferenceMatch) ?? matches[0];
    setSelectedMatchId(nextMatch?.id ?? null);
    setSelectedTeamView("atlas");
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
              <label className="ams-date-slicer-field match-date-slicer-field">
                <span>{copy.dateFilter}</span>
                <select
                  value={selectedMatch?.id ?? ""}
                  onChange={(event) => updateSelectedMatch(event.target.value)}
                >
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {matchDropdownLabel(match, language)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="match-history-scroll">
            {visibleMatches.length ? visibleMatches.map((match) => (
              <button
                className={match.id === selectedMatch.id ? "is-active" : ""}
                key={match.id}
                type="button"
                onClick={() => updateSelectedMatch(match.id)}
              >
                <span>{formatMatchDate(match.date, match.displayDate, language)}</span>
                <strong>{matchListTitle(match)}</strong>
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
                <strong>{activeTeamName}</strong>
              </div>
              <div className="match-field-actions">
                <div className="match-team-toggle" aria-label={copy.teamToggle}>
                  <button
                    className={selectedTeamView === "atlas" ? "is-active" : ""}
                    type="button"
                    onClick={() => setSelectedTeamView("atlas")}
                  >
                    Atlas
                  </button>
                  <button
                    className={selectedTeamView === "opponent" ? "is-active" : ""}
                    type="button"
                    onClick={() => setSelectedTeamView("opponent")}
                  >
                    {opponentTeamForMatch(selectedMatch)}
                  </button>
                </div>
                <span className="match-formation-badge">{copy.formation} {activeFormation}</span>
              </div>
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
                    {player.subEvent ? <i className={`match-sub-badge is-${player.subEvent}`}>{player.subEvent === "in" ? "↑" : "↓"}</i> : null}
                    {player.card ? <i className={`match-card-badge is-${player.card}`} aria-label={`${player.card} card`} /> : null}
                    <span className={player.photo ? "has-photo" : ""}>
                      {player.photo ? <Image alt="" src={player.photo} width={42} height={42} /> : <b>{player.number || initials(player.name)}</b>}
                    </span>
                    <strong>{playerLabel(player)}</strong>
                  </article>
                ))}
                {!hasFieldPlayers ? (
                  <div className="match-pitch-empty">
                    <strong>{copy.lineupPending}</strong>
                    <span>{copy.lineupPendingNote}</span>
                  </div>
                ) : null}
              </div>

              <aside className="match-player-panel">
                <div>
                  <span>{copy.onField}</span>
                  {pitchPlayers.length ? pitchPlayers.slice(0, 6).map((player) => (
                    <PlayerLoadRow key={player.id} player={player} />
                  )) : <p>{copy.lineupPendingShort}</p>}
                </div>
                <div>
                  <span>{copy.substitutes}</span>
                  {pitchPlayers.length ? (reservePlayers.length ? reservePlayers : pitchPlayers.slice(6)).slice(0, 7).map((player) => (
                    <PlayerLoadRow key={`${player.id}-reserve`} player={player} compact />
                  )) : <p>{copy.lineupPendingShort}</p>}
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
        <strong>{playerNameWithNumber(player)}</strong>
        <small>{player.position || "-"}{compact ? "" : ` · ${compactNumber(player.minutes, 0)} min`}</small>
      </div>
      {player.subEvent && player.subMinute ? (
        <em className={`match-sub-chip is-${player.subEvent}`}>
          {player.subEvent === "in" ? "↑" : "↓"} {player.subMinute}&prime;
        </em>
      ) : null}
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
  if (!match.gpsRows.length && !isDefaultReferenceMatch(match)) return [];
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
      photo: atlasPhotoFor(name, id),
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
  if (isDefaultReferenceMatch(match)) {
    return buildAtlasReferencePlayers(players);
  }
  return buildGpsLineupPlayers(players);
}

function buildGpsLineupPlayers(players: MatchPlayer[]) {
  if (!players.length) return [];
  const withGoalkeeper = ensureAtlasGoalkeeper(players);
  const byLoad = [...withGoalkeeper].sort((a, b) => b.minutes - a.minutes || b.totalDistanceKm - a.totalDistanceKm);
  const starterIds = new Set(byLoad.slice(0, 11).map((player) => player.id));
  const starters = byLoad.filter((player) => starterIds.has(player.id));
  const reserves = byLoad.filter((player) => !starterIds.has(player.id));
  return [...assignPitchPositions(starters), ...reserves];
}

function buildAtlasReferencePlayers(gpsPlayers: MatchPlayer[]) {
  const playerMap = new Map<string, MatchPlayer>();
  for (const player of gpsPlayers) {
    playerMap.set(player.id, player);
    playerMap.set(normalizeText(player.name), player);
  }

  return [
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0001",
      name: "Camilo Vargas",
      number: "12",
      position: "Goalkeeper",
      x: 50,
      y: 87,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0026",
      name: "Jorge Rodríguez",
      number: "25",
      position: "Left back",
      card: "yellow",
      x: 13,
      y: 74,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0005",
      name: "Rodrigo Schlegel",
      number: "21",
      position: "Centre back",
      x: 37,
      y: 74,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0004",
      name: "Manuel Capasso",
      number: "28",
      position: "Centre back",
      x: 63,
      y: 74,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0006",
      name: "Gustavo Ferrareis",
      number: "3",
      position: "Right back",
      subEvent: "out",
      subMinute: 78,
      x: 87,
      y: 74,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0012",
      name: "Aldo Rocha",
      number: "26",
      position: "Defensive midfield",
      subEvent: "out",
      subMinute: 58,
      x: 50,
      y: 58,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0014",
      name: "Sergio I. Hernández Flores",
      number: "199",
      position: "Wide midfield",
      subEvent: "out",
      subMinute: 75,
      x: 13,
      y: 42,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0016",
      name: "Paulo Ramírez",
      number: "15",
      position: "Central midfield",
      subEvent: "out",
      subMinute: 70,
      x: 37,
      y: 42,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0020",
      name: "Arturo González",
      number: "58",
      position: "Central midfield",
      x: 63,
      y: 42,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0013",
      name: "Victor Rios",
      number: "27",
      position: "Wide midfield",
      card: "yellow",
      x: 87,
      y: 42,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0021",
      name: "Eduardo Aguirre",
      number: "19",
      position: "Forward",
      subEvent: "out",
      subMinute: 75,
      x: 50,
      y: 28,
    }),
    atlasReferencePlayer(playerMap, {
      name: "Andrés Montaño",
      number: "",
      position: "Substitute",
      subEvent: "in",
      subMinute: 75,
      x: 50,
      y: 50,
    }),
    atlasReferencePlayer(playerMap, {
      name: "Jeremy Márquez",
      number: "",
      position: "Substitute",
      subEvent: "in",
      subMinute: 70,
      x: 50,
      y: 50,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0015",
      name: "Édgar Zaldívar",
      number: "6",
      position: "Substitute",
      subEvent: "in",
      subMinute: 78,
      x: 50,
      y: 50,
    }),
    atlasReferencePlayer(playerMap, {
      amsId: "AMS-ATLAS-0010",
      name: "Mateo García",
      number: "8",
      position: "Substitute",
      subEvent: "in",
      subMinute: 58,
      x: 50,
      y: 50,
    }),
  ];
}

function atlasReferencePlayer(
  playerMap: Map<string, MatchPlayer>,
  reference: Pick<MatchPlayer, "name" | "number" | "position" | "x" | "y"> & Partial<Pick<MatchPlayer, "card" | "id" | "subEvent" | "subMinute">> & { amsId?: string },
): MatchPlayer {
  const gpsPlayer = (reference.amsId ? playerMap.get(reference.amsId) : undefined) ?? playerMap.get(normalizeText(reference.name));
  const rosterPlayer = atlasRoster.find((player) => player.amsId === reference.amsId || normalizeText(player.name) === normalizeText(reference.name));

  return {
    id: reference.amsId ?? reference.id ?? normalizeText(reference.name),
    name: reference.name,
    number: reference.number || String(rosterPlayer?.number ?? gpsPlayer?.number ?? ""),
    photo: rosterPlayer?.photo ?? gpsPlayer?.photo,
    position: reference.position,
    minutes: gpsPlayer?.minutes ?? (reference.subEvent === "in" ? 90 - (reference.subMinute ?? 90) : 90),
    totalDistanceKm: gpsPlayer?.totalDistanceKm ?? 0,
    hsrMeters: gpsPlayer?.hsrMeters ?? 0,
    sprintMeters: gpsPlayer?.sprintMeters ?? 0,
    maxSpeed: gpsPlayer?.maxSpeed ?? 0,
    card: reference.card,
    subEvent: reference.subEvent,
    subMinute: reference.subMinute,
    x: reference.x,
    y: reference.y,
  };
}

function buildOpponentPlayers(match: MatchSummary) {
  if (isDefaultReferenceMatch(match)) {
    return assignPitchPositions(referenceCruzAzulPlayers());
  }

  return assignPitchPositions([
    {
      id: `${match.id}-opponent-placeholder`,
      name: opponentTeamForMatch(match),
      number: "",
      position: "Opponent",
      minutes: 90,
      totalDistanceKm: 0,
      hsrMeters: 0,
      sprintMeters: 0,
      maxSpeed: 0,
      x: 50,
      y: 50,
    },
  ]);
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

function ensureAtlasGoalkeeper(players: MatchPlayer[]) {
  if (players.some((player) => positionBucket(player.position) === "gk")) return players;
  const goalkeeper = atlasRoster.find((player) => player.id === "camilo-vargas");
  if (!goalkeeper) return players;

  return [
    {
      id: goalkeeper.amsId,
      name: goalkeeper.name,
      number: String(goalkeeper.number || "12"),
      photo: goalkeeper.photo,
      position: "Goalkeeper",
      minutes: 90,
      totalDistanceKm: 0,
      hsrMeters: 0,
      sprintMeters: 0,
      maxSpeed: 0,
      x: 50,
      y: 87,
    },
    ...players,
  ];
}

function referenceCruzAzulPlayers(): MatchPlayer[] {
  return [
    opponentPlayer("23", "Kevin Mier", "Goalkeeper"),
    opponentPlayer("22", "Jorge Rodarte", "Defender"),
    opponentPlayer("4", "Willer Ditta", "Defender"),
    opponentPlayer("17", "Andrés García", "Defender"),
    opponentPlayer("33", "Gonzalo Piovi", "Defender"),
    opponentPlayer("3", "Omar Campos", "Defender"),
    opponentPlayer("20", "José Paradela", "Midfielder"),
    opponentPlayer("8", "Agustín Palavecino", "Midfielder"),
    opponentPlayer("19", "Carlos Rodríguez", "Midfielder"),
    opponentPlayer("29", "Carlos Rotondi", "Midfielder"),
    opponentPlayer("11", "Christian Ebere", "Forward"),
    opponentPlayer("", "Felix Meyer", "Substitute"),
    opponentPlayer("", "Hugo Dubois", "Substitute"),
    opponentPlayer("", "Elias Nilsen", "Substitute"),
    opponentPlayer("", "Mateo García", "Substitute"),
  ];
}

function opponentPlayer(number: string, name: string, position: string): MatchPlayer {
  return {
    id: `cruz-azul-${normalizeText(number || name)}`,
    name,
    number,
    position,
    minutes: position === "Substitute" ? 0 : 90,
    totalDistanceKm: 0,
    hsrMeters: 0,
    sprintMeters: 0,
    maxSpeed: 0,
    x: 50,
    y: 50,
  };
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

function formationForPlayers(players: MatchPlayer[], fallback?: string) {
  if (fallback) return fallback;
  const active = players.slice(0, 11);
  const defenders = active.filter((player) => positionBucket(player.position) === "def").length;
  const midfielders = active.filter((player) => positionBucket(player.position) === "mid").length;
  const forwards = active.filter((player) => positionBucket(player.position) === "fwd").length;
  if (!defenders && !midfielders && !forwards) return "-";
  return [defenders, midfielders, forwards].filter((count) => count > 0).join("-");
}

function referenceFormation(match: MatchSummary | undefined, teamView: TeamView) {
  if (!match || !isDefaultReferenceMatch(match)) return undefined;
  return teamView === "atlas" ? "4-1-4-1" : "5-4-1";
}

function opponentTeamForMatch(match: MatchSummary) {
  return normalizeText(match.homeTeam) === "atlas" ? match.awayTeam : match.homeTeam;
}

function atlasPhotoFor(playerName: string, amsId: string) {
  const normalizedName = normalizeText(playerName);
  const rosterPlayer = atlasRoster.find((player) => {
    if (player.amsId === amsId) return true;
    const rosterName = normalizeText(player.name);
    return normalizedName === rosterName
      || normalizedName.includes(rosterName)
      || rosterName.split(" ").every((part) => normalizedName.includes(part));
  });
  return rosterPlayer?.photo;
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

function playerLabel(player: MatchPlayer) {
  return `${lastName(player.name)}${player.number ? ` #${player.number}` : ""}`;
}

function playerNameWithNumber(player: MatchPlayer) {
  return `${player.name}${player.number ? ` #${player.number}` : ""}`;
}

function lastName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.at(-1) ?? name;
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

function matchListTitle(match: MatchSummary) {
  if (typeof match.homeGoals === "number" && typeof match.awayGoals === "number") {
    return `${match.homeTeam} ${match.homeGoals} - ${match.awayGoals} ${match.awayTeam}`;
  }
  return `${match.homeTeam} vs ${match.awayTeam}`;
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

function matchDropdownLabel(match: MatchSummary, language: AmsLanguage) {
  const opponent = opponentTeamForMatch(match);
  return `${formatMatchDate(match.date, match.displayDate, language)} — ${opponent}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchCopy(language: AmsLanguage) {
  if (language === "es") {
    return {
      description: "Historial de partidos estilo Google con marcador, lista de partidos y vista de cancha conectada a fuentes limpias del AMS.",
      dateFilter: "Partido",
      empty: "No hay historial de partidos cargado todavía.",
      fieldView: "Vista de cancha",
      hsr: "HSR",
      kicker: "Primer equipo",
      lineupPending: "Alineación pendiente",
      lineupPendingNote: "No hay suficientes filas GPS o alineación scrapeada para construir la vista de cancha de este partido.",
      lineupPendingShort: "Fuente pendiente",
      matchList: "Partidos",
      matches: "partidos",
      maxSpeed: "Velocidad máx.",
      noDateMatches: "No hay partidos en esta fecha.",
      formation: "Formación",
      onField: "En cancha",
      photoNote: "Fotos omitidas por ahora; usando números e iniciales.",
      source: "Fuente",
      sourceNote: "El scraping directo de la interfaz de Google queda como adaptador futuro; esta vista usa caché local LigaMX/AMS.",
      sourceStatus: "Google-style cache",
      sprint: "Sprint",
      substitutes: "Banca / menor carga",
      teamToggle: "Cambiar equipo en cancha",
      title: "Historial de partidos",
      totalDistance: "Distancia total",
      venuePending: "Sede pendiente",
    };
  }

  return {
    description: "Google-style match history with scoreline, match list, and pitch view connected to clean AMS sources.",
    dateFilter: "Match date",
    empty: "No match history is loaded yet.",
    fieldView: "Field view",
    hsr: "HSR",
    kicker: "First team",
    lineupPending: "Lineup pending",
    lineupPendingNote: "There are not enough GPS rows or scraped lineup records to build this match field view yet.",
    lineupPendingShort: "Source pending",
    matchList: "Matches",
    matches: "matches",
    maxSpeed: "Max speed",
    noDateMatches: "No matches on this date.",
    formation: "Formation",
    onField: "On field",
    photoNote: "Photos ignored for now; using numbers and initials.",
    source: "Source",
    sourceNote: "Direct scraping of Google's rendered UI is kept as a future adapter; this view uses the local LigaMX/AMS cache.",
    sourceStatus: "Google-style cache",
    sprint: "Sprint",
    substitutes: "Bench / lower load",
    teamToggle: "Switch field team",
    title: "Match History",
    totalDistance: "Total distance",
    venuePending: "Venue pending",
  };
}
