"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Player } from "@/lib/ams/content";
import { compactNumber } from "@/lib/ams/data";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import { biographyExtraForPlayer } from "@/lib/ams/player-profile";
import {
  recentMatchesForPlayer,
  seasonStatsForPlayer,
} from "@/lib/ams/roster";
import type { SourceData } from "@/lib/ams/source-types";
import { localizedValue, type AmsLanguage } from "@/components/ams/ui/AmsUi";

export function BiographyPanel({
  language,
  selectedPlayer,
  sourceData,
  visiblePlayers,
  onSelectPlayer,
}: {
  language: AmsLanguage;
  selectedPlayer: Player;
  sourceData: SourceData;
  visiblePlayers: Player[];
  onSelectPlayer: (playerId: string) => void;
}) {
  const [positionFilter, setPositionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const positionOptions = useMemo(
    () => Array.from(new Set(visiblePlayers.map((player) => player.position))).sort((a, b) => a.localeCompare(b)),
    [visiblePlayers],
  );
  const filteredPlayers = visiblePlayers.filter((player) => {
    const matchesPosition = positionFilter === "all" || player.position === positionFilter;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query
      || player.name.toLowerCase().includes(query)
      || String(player.number).toLowerCase().includes(query)
      || player.amsId.toLowerCase().includes(query);
    return matchesPosition && matchesSearch;
  });
  const selectedExtra = biographyExtraForPlayer(selectedPlayer, sourceData);
  const selectedStats = seasonStatsForPlayer(selectedPlayer, sourceData.playerSeasonHistory);
  const recentMatches = recentMatchesForPlayer(selectedPlayer, sourceData.playerMatchHistory);
  const statusLabel = language === "es"
    ? selectedPlayer.status === "synced" ? "Conectado" : selectedPlayer.status === "review" ? "Revisar" : "Pendiente"
    : selectedPlayer.status === "synced" ? "Connected" : selectedPlayer.status === "review" ? "Review" : "Pending";

  return (
    <div className="biography-panel">
      <section className="biography-hero">
        <div>
          <span className="section-kicker">
            {language === "es" ? "Perfil del jugador" : "Player Biography"}
          </span>
          <h2>{language === "es" ? "Biografía del Jugador" : "Player Biography"}</h2>
          <p>
            {language === "es"
              ? "Perfiles detallados, carrera, contrato, rendimiento y estado de fuentes."
              : "Detailed player profiles, career context, contract notes, performance, and source status."}
          </p>
        </div>
        <button className="source-open-button" type="button">
          {language === "es" ? "Exportar perfil" : "Export profile"}
        </button>
      </section>

      <section className="biography-layout">
        <aside className="biography-player-list">
          <div className="panel-heading">
            <div>
              <span>{language === "es" ? "Plantilla visible" : "Visible squad"}</span>
              <h3>{language === "es" ? "Lista de jugadores" : "Player list"}</h3>
            </div>
            <small>{filteredPlayers.length} / {visiblePlayers.length}</small>
          </div>

          <div className="biography-list-controls">
            <select
              aria-label={language === "es" ? "Filtrar por posición" : "Filter by position"}
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
            >
              <option value="all">{language === "es" ? "Todas las posiciones" : "All positions"}</option>
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {localizedValue(position, language)}
                </option>
              ))}
            </select>
            <input
              aria-label={language === "es" ? "Buscar jugador" : "Search player"}
              placeholder={language === "es" ? "Buscar nombre, número o AMS..." : "Search name, number, or AMS..."}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="biography-player-list-scroll">
            {filteredPlayers.map((player) => (
              <button
                className={`biography-player-row ${player.id === selectedPlayer.id ? "is-active" : ""}`}
                key={player.id}
                type="button"
                onClick={() => onSelectPlayer(player.id)}
              >
                <span className="biography-player-thumb">
                  {hasPlayerPhoto(player) ? (
                    <Image src={player.photo} alt="" width={54} height={54} />
                  ) : (
                    <b>{player.number || ""}</b>
                  )}
                </span>
                <span>
                  <strong>{player.name}</strong>
                  <small>
                    #{player.number || "-"} · {localizedValue(player.position, language)}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <article className="biography-profile">
          <section className="biography-profile-card">
            <span className="biography-nationality-pill">
              {nationalityFlag(selectedPlayer.nationality)} {localizedValue(selectedPlayer.nationality, language)}
            </span>
            <h3>{selectedPlayer.name}</h3>
            <div className="biography-photo-stage">
              {hasPlayerPhoto(selectedPlayer) ? (
                <Image src={selectedPlayer.photo} alt="" width={320} height={320} />
              ) : (
                <strong>{selectedPlayer.number || "-"}</strong>
              )}
            </div>
            <p className="biography-profile-role">
              #{selectedPlayer.number || "-"} · {localizedValue(selectedPlayer.position, language)} · {selectedPlayer.amsId}
            </p>
          </section>

          <section className="biography-detail-grid">
            <BiographyDetail label={language === "es" ? "Fecha de nacimiento" : "Birth Date"} value={selectedExtra.birthDate} />
            <BiographyDetail label={language === "es" ? "Nacionalidad" : "Nationality"} value={localizedValue(selectedPlayer.nationality, language)} />
            <BiographyDetail label={language === "es" ? "Altura" : "Height"} value={localizedValue(selectedPlayer.height, language)} />
            <BiographyDetail label={language === "es" ? "Peso" : "Weight"} value={localizedValue(selectedPlayer.weight, language)} />
            <BiographyDetail label={language === "es" ? "Pie preferido" : "Preferred Foot"} value={localizedValue(selectedPlayer.foot, language)} />
            <BiographyDetail label={language === "es" ? "Lugar de nacimiento" : "Birth Place"} value={selectedExtra.birthPlace} />
            <BiographyDetail label={language === "es" ? "Registrado como" : "Registered As"} value={selectedPlayer.amsId} />
            <BiographyDetail label={language === "es" ? "Fuente Liga MX" : "Liga MX Source"} value={statusLabel} />
          </section>
        </article>
      </section>

      <section className="biography-deep-grid">
        <article className="biography-deep-panel">
          <div className="biography-deep-heading">
            <span>{language === "es" ? "Carrera" : "Career"}</span>
            <strong>
              {selectedStats.source === "clean-source"
                ? selectedStats.seasonLabel
                : language === "es" ? "Resumen de jugador" : "Player summary"}
            </strong>
          </div>
          <div className="biography-kpi-grid">
            <BiographyKpi label={language === "es" ? "Apariciones" : "Appearances"} value={String(selectedStats.appearances)} />
            <BiographyKpi label={language === "es" ? "Titularidades" : "Starts"} value={String(selectedStats.starts)} />
            <BiographyKpi label={language === "es" ? "Minutos" : "Minutes"} value={compactNumber(selectedStats.minutes)} />
          </div>
          <ProgressMetric label={language === "es" ? "Conexión de perfil" : "Profile connection"} value={selectedPlayer.status === "synced" ? 82 : selectedPlayer.status === "review" ? 64 : 38} />
          <ProgressMetric label={language === "es" ? "Datos de carrera" : "Career data"} value={selectedStats.appearances > 0 ? 58 : 18} />
          <p>
            {language === "es"
              ? selectedStats.source === "clean-source"
                ? "Estos números vienen del historial limpio de temporada."
                : "La API pública de Liga MX no está conectada todavía; esta vista deja el espacio listo para fusionar datos oficiales cuando estén disponibles."
              : selectedStats.source === "clean-source"
                ? "These numbers come from the cleaned season-history source."
                : "A public Liga MX API is not connected yet; this view is ready to merge official data once it is available."}
          </p>
        </article>

        <article className="biography-deep-panel">
          <div className="biography-deep-heading">
            <span>{language === "es" ? "Contrato" : "Contract"}</span>
            <strong>{language === "es" ? "Contexto deportivo" : "Sporting context"}</strong>
          </div>
          <BiographyContractRow label={language === "es" ? "Club anterior" : "Previous Club"} value={selectedExtra.previousClub} />
          <BiographyContractRow label={language === "es" ? "Llegada" : "Joined"} value={selectedExtra.joined} />
          <BiographyContractRow label={language === "es" ? "Fin de contrato" : "Contract End"} value={selectedExtra.contractExpires} />
          <BiographyContractRow label={language === "es" ? "Valor mercado" : "Market Value"} value={selectedExtra.marketValue} />
          <ProgressMetric label={language === "es" ? "Contrato completado" : "Contract elapsed"} value={selectedExtra.contractProgress} />
        </article>
      </section>

      <section className="biography-stats-panel">
        <div className="biography-deep-heading">
          <span>{language === "es" ? "Temporada" : "Season"}</span>
          <strong>{language === "es" ? "Rendimiento en contexto" : "Performance in context"}</strong>
        </div>
        <div className="biography-stat-grid">
          <BiographyStat label={language === "es" ? "Goles" : "Goals"} value={String(selectedStats.goals)} />
          <BiographyStat label={language === "es" ? "Asistencias" : "Assists"} value={String(selectedStats.assists)} />
          <BiographyStat label={language === "es" ? "Calificación" : "Rating"} value={selectedStats.rating} />
          <BiographyStat label={language === "es" ? "Estado" : "Status"} value={statusLabel} />
        </div>
      </section>

      <section className="biography-table-panel">
        <div className="biography-deep-heading">
          <span>{language === "es" ? "Comparación" : "Comparison"}</span>
          <strong>{language === "es" ? "Plantilla visible" : "Visible squad"}</strong>
        </div>
        <div className="biography-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{language === "es" ? "Jugador" : "Player"}</th>
                <th>{language === "es" ? "Posicion" : "Position"}</th>
                <th>{language === "es" ? "Edad" : "Age"}</th>
                <th>{language === "es" ? "Altura" : "Height"}</th>
                <th>{language === "es" ? "Fuente" : "Source"}</th>
              </tr>
            </thead>
            <tbody>
              {visiblePlayers.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{localizedValue(player.position, language)}</td>
                  <td>{localizedValue(player.age, language)}</td>
                  <td>{localizedValue(player.height, language)}</td>
                  <td>{player.status === "synced" ? (language === "es" ? "Conectado" : "Connected") : (language === "es" ? "Pendiente" : "Pending")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="biography-table-panel">
        <div className="biography-deep-heading">
          <span>{language === "es" ? "Historial de partidos" : "Match History"}</span>
          <strong>
            {recentMatches.length
              ? language === "es" ? "Últimos partidos limpios" : "Latest clean matches"
              : language === "es" ? "Pendiente de API oficial" : "Official API pending"}
          </strong>
        </div>
        {recentMatches.length ? (
          <div className="biography-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{language === "es" ? "Fecha" : "Date"}</th>
                  <th>{language === "es" ? "Partido" : "Match"}</th>
                  <th>{language === "es" ? "Torneo" : "Tournament"}</th>
                  <th>{language === "es" ? "Min" : "Min"}</th>
                  <th>{language === "es" ? "Titular" : "Start"}</th>
                </tr>
              </thead>
              <tbody>
                {recentMatches.map((match) => (
                  <tr key={`${match.amsId}-${match.dateIso}-${match.jornada}`}>
                    <td>{match.dateIso || match.dateDisplay || "-"}</td>
                    <td>{match.localTeam} {match.localGoals ?? "-"} - {match.visitorGoals ?? "-"} {match.visitorTeam}</td>
                    <td>{match.tournament || match.phase || "-"}</td>
                    <td>{match.minutes ?? "-"}</td>
                    <td>{match.starter || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            {language === "es"
              ? "Aquí conectaremos minutos, alineaciones, goles, tarjetas y sustituciones cuando tengamos una fuente Liga MX confiable."
              : "This panel will connect minutes, lineups, goals, cards, and substitutions once a reliable Liga MX source is available."}
          </p>
        )}
      </section>
    </div>
  );
}

function BiographyDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="biography-detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BiographyKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="biography-kpi">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ProgressMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="biography-progress-row">
      <span>{label}</span>
      <b>{value}%</b>
      <div className="biography-progress-track">
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function BiographyContractRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="biography-contract-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BiographyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="biography-stat-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function nationalityFlag(nationality: string) {
  const normalized = nationality.toLowerCase();
  if (normalized.includes("mexico")) return "MX";
  if (normalized.includes("colombia")) return "CO";
  if (normalized.includes("argentin")) return "AR";
  if (normalized.includes("brazil")) return "BR";
  if (normalized.includes("spain")) return "ES";
  if (normalized.includes("uruguay")) return "UY";
  return "INT";
}
