"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Player } from "@/lib/ams/content";
import { hasPlayerPhoto } from "@/lib/ams/player-media";
import { localizedValue, type AmsLanguage } from "@/components/ams/ui/AmsUi";

export function PlayerRosterList({
  className = "biography-player-list",
  language,
  players,
  selectedPlayerId,
  title,
  kicker,
  onSelectPlayer,
}: {
  className?: string;
  language: AmsLanguage;
  players: Player[];
  selectedPlayerId: string;
  title?: string;
  kicker?: string;
  onSelectPlayer: (playerId: string) => void;
}) {
  const [positionFilter, setPositionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const positionOptions = useMemo(
    () => Array.from(new Set(players.map((player) => player.position))).sort((a, b) => a.localeCompare(b)),
    [players],
  );
  const filteredPlayers = useMemo(() => {
    const query = normalizeRosterSearch(searchTerm);

    return players.filter((player) => {
      const matchesPosition = positionFilter === "all" || player.position === positionFilter;
      const matchesSearch = !query || normalizeRosterSearch([
        player.name,
        String(player.number),
        player.amsId,
      ].join(" ")).includes(query);
      return matchesPosition && matchesSearch;
    });
  }, [players, positionFilter, searchTerm]);
  const labels = language === "es"
    ? {
      allPositions: "Todas las posiciones",
      empty: "No hay jugadores con ese filtro.",
      filterPosition: "Filtrar por posición",
      kicker: kicker ?? "Plantilla visible",
      search: "Buscar jugador",
      searchPlaceholder: "Buscar nombre, número o AMS...",
      title: title ?? "Lista de jugadores",
    }
    : {
      allPositions: "All positions",
      empty: "No players match that filter.",
      filterPosition: "Filter by position",
      kicker: kicker ?? "Visible squad",
      search: "Search player",
      searchPlaceholder: "Search name, number, or AMS...",
      title: title ?? "Player list",
    };

  return (
    <aside className={className}>
      <div className="panel-heading">
        <div>
          <span>{labels.kicker}</span>
          <h3>{labels.title}</h3>
        </div>
        <small>{filteredPlayers.length} / {players.length}</small>
      </div>

      <div className="biography-list-controls">
        <select
          aria-label={labels.filterPosition}
          value={positionFilter}
          onChange={(event) => setPositionFilter(event.target.value)}
        >
          <option value="all">{labels.allPositions}</option>
          {positionOptions.map((position) => (
            <option key={position} value={position}>
              {localizedValue(position, language)}
            </option>
          ))}
        </select>
        <input
          aria-label={labels.search}
          placeholder={labels.searchPlaceholder}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="biography-player-list-scroll">
        {filteredPlayers.map((player) => (
          <button
            className={`biography-player-row ${player.id === selectedPlayerId ? "is-active" : ""}`}
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
        {!filteredPlayers.length ? <p className="biography-player-empty">{labels.empty}</p> : null}
      </div>
    </aside>
  );
}

function normalizeRosterSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
