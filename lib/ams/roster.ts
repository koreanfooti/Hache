import { players as fallbackPlayers, type Player } from "@/lib/ams/content";
import { numberValue } from "@/lib/ams/data";
import { fallbackSeasonStatsForPlayer } from "@/lib/ams/player-fallbacks";
import type {
  PlayerMasterRow,
  PlayerMatchHistoryRow,
  PlayerSeasonHistoryRow,
} from "@/lib/ams/types";

export type PlayerSeasonStats = {
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  rating: string;
  seasonLabel: string;
  source: "clean-source" | "fallback";
};

export function buildRosterPlayers(playerMaster: PlayerMasterRow[], fallbackRoster: Player[] = fallbackPlayers) {
  if (!playerMaster.length) return fallbackRoster;

  const fallbackByAmsId = new Map(fallbackRoster.map((player) => [player.amsId, player]));
  const fallbackById = new Map(fallbackRoster.map((player) => [player.id, player]));

  return playerMaster
    .filter((row) => String(row.activeStatus ?? "active").toLowerCase() !== "inactive")
    .map((row) => {
      const id = row.slug || slugify(row.displayName || row.fullName || row.amsId || "player");
      const fallback = fallbackByAmsId.get(String(row.amsId ?? "")) ?? fallbackById.get(id);
      const birthDate = row.birthDate || undefined;

      return {
        id,
        amsId: row.amsId || fallback?.amsId || "",
        name: row.displayName || row.fullName || fallback?.name || "Unknown player",
        number: row.shirtNumber ?? fallback?.number ?? "-",
        position: row.position || fallback?.position || "Unassigned",
        nationality: row.nationality || fallback?.nationality || "Pending",
        age: ageLabelFromBirthDate(birthDate) || fallback?.age || "Pending",
        height: row.height || fallback?.height || "Pending",
        weight: row.weight || fallback?.weight || "Pending",
        foot: row.preferredFoot || fallback?.foot || "Pending API",
        photo: fallback?.photo ?? "/ams/assets/players/cutouts/example_-removebg-preview.png",
        status: playerStatusFromMaster(row, fallback),
      } satisfies Player;
    });
}

export function playerMasterFor(player: Player, playerMaster: PlayerMasterRow[]) {
  return playerMaster.find((row) => row.amsId === player.amsId || row.slug === player.id);
}

export function playerBirthDate(player: Player, playerMaster: PlayerMasterRow[]) {
  return playerMasterFor(player, playerMaster)?.birthDate || "";
}

export function previousClubForPlayer(player: Player, seasonHistory: PlayerSeasonHistoryRow[]) {
  const previousClub = seasonHistory
    .filter((row) => row.amsId === player.amsId && row.club && row.club !== "Atlas")
    .sort((a, b) => String(b.season).localeCompare(String(a.season)))[0]?.club;

  return previousClub ?? "";
}

export function seasonStatsForPlayer(
  player: Player,
  seasonHistory: PlayerSeasonHistoryRow[],
): PlayerSeasonStats {
  const rows = seasonHistory.filter((row) => row.amsId === player.amsId);
  const latestSeason = rows.map((row) => row.season).filter(Boolean).sort().at(-1);
  const seasonRows = latestSeason ? rows.filter((row) => row.season === latestSeason) : [];

  if (seasonRows.length) {
    return {
      appearances: sum(seasonRows, "gamesPlayed"),
      starts: sum(seasonRows, "starts"),
      minutes: sum(seasonRows, "minutesPlayed"),
      goals: sum(seasonRows, "goals"),
      assists: 0,
      rating: "Pending",
      seasonLabel: latestSeason ?? "Latest season",
      source: "clean-source",
    };
  }

  return { ...fallbackSeasonStatsForPlayer(player), source: "fallback" };
}

export function recentMatchesForPlayer(
  player: Player,
  matchHistory: PlayerMatchHistoryRow[],
  limit = 8,
) {
  return matchHistory
    .filter((row) => row.amsId === player.amsId)
    .sort((a, b) => String(b.dateIso).localeCompare(String(a.dateIso)))
    .slice(0, limit);
}

function playerStatusFromMaster(row: PlayerMasterRow, fallback: Player | undefined): Player["status"] {
  if (row.sofascoreId || row.ligaMxId || row.ligaMxNui || row.gpsProviderId) return "synced";
  return fallback?.status ?? "pending";
}

function ageLabelFromBirthDate(value: string | undefined) {
  const birthDate = parseBirthDate(value);
  if (!birthDate) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed = today.getMonth() > birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayPassed) age -= 1;
  return `${age} years`;
}

function parseBirthDate(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);

  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sum(rows: PlayerSeasonHistoryRow[], key: keyof PlayerSeasonHistoryRow) {
  return rows.reduce((total, row) => total + numberValue(row[key]), 0);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
