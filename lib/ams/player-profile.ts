import type { Player } from "@/lib/ams/content";
import { playerProfileFallbacks } from "@/lib/ams/player-fallbacks";
import { playerBirthDate, previousClubForPlayer } from "@/lib/ams/roster";
import type { SourceData } from "@/lib/ams/source-types";

export type PlayerBiographyExtra = {
  birthDate: string;
  birthPlace: string;
  previousClub: string;
  joined: string;
  contractExpires: string;
  marketValue: string;
  contractProgress: number;
};

export function biographyExtraForPlayer(player: Player, sourceData: SourceData): PlayerBiographyExtra {
  const cleanBirthDate = playerBirthDate(player, sourceData.playerMaster);
  const fallback = playerProfileFallbacks[player.id];

  return {
    birthDate: cleanBirthDate || fallback?.birthDate || (player.age === "Pending" ? "Pending API" : "Pending source merge"),
    birthPlace: fallback?.birthPlace || "Pending API",
    previousClub: previousClubForPlayer(player, sourceData.playerSeasonHistory) || fallback?.previousClub || "Pending API",
    joined: fallback?.joined || "Pending API",
    contractExpires: fallback?.contractExpires || "Pending API",
    marketValue: fallback?.marketValue || "Pending API",
    contractProgress: fallback?.contractProgress ?? contractProgressByStatus(player.status),
  };
}

function contractProgressByStatus(status: Player["status"]) {
  if (status === "synced") return 46;
  if (status === "review") return 30;
  return 14;
}
