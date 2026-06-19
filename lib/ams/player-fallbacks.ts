import type { Player } from "@/lib/ams/content";

export type PlayerSeasonStatsSeed = {
  appearances: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  rating: string;
  seasonLabel: string;
};

export type PlayerProfileFallback = {
  birthDate: string;
  birthPlace: string;
  previousClub: string;
  joined: string;
  contractExpires: string;
  marketValue: string;
  contractProgress: number;
};

export const playerSeasonStatFallbacks: Record<string, PlayerSeasonStatsSeed> = {
  "camilo-vargas": { appearances: 18, starts: 18, minutes: 1620, goals: 0, assists: 0, rating: "6.6", seasonLabel: "Fallback" },
  "gustavo-ferrareis": { appearances: 16, starts: 15, minutes: 1303, goals: 0, assists: 0, rating: "Pending", seasonLabel: "Fallback" },
  "aldo-rocha": { appearances: 17, starts: 17, minutes: 1488, goals: 1, assists: 2, rating: "6.9", seasonLabel: "Fallback" },
  "mateo-garcia": { appearances: 15, starts: 12, minutes: 1034, goals: 2, assists: 3, rating: "6.8", seasonLabel: "Fallback" },
  "manuel-capasso": { appearances: 14, starts: 13, minutes: 1160, goals: 1, assists: 0, rating: "6.7", seasonLabel: "Fallback" },
};

export const playerProfileFallbacks: Record<string, PlayerProfileFallback> = {
  "gustavo-ferrareis": {
    birthDate: "02 Jan 1996",
    birthPlace: "Lençóis Paulista, Brazil",
    previousClub: "Puebla F.C.",
    joined: "2025",
    contractExpires: "Pending API",
    marketValue: "Pending API",
    contractProgress: 18,
  },
  "camilo-vargas": {
    birthDate: "09 Mar 1989",
    birthPlace: "Bogotá, Colombia",
    previousClub: "Deportivo Cali",
    joined: "2019",
    contractExpires: "Pending API",
    marketValue: "Pending API",
    contractProgress: 72,
  },
  "aldo-rocha": {
    birthDate: "06 Nov 1992",
    birthPlace: "León, Mexico",
    previousClub: "Mazatlan F.C.",
    joined: "2021",
    contractExpires: "Pending API",
    marketValue: "Pending API",
    contractProgress: 64,
  },
  "manuel-capasso": {
    birthDate: "19 Apr 1996",
    birthPlace: "Rosario, Argentina",
    previousClub: "Vasco da Gama",
    joined: "2024",
    contractExpires: "Pending API",
    marketValue: "Pending API",
    contractProgress: 35,
  },
  "mateo-garcia": {
    birthDate: "10 Sep 1996",
    birthPlace: "Córdoba, Argentina",
    previousClub: "Aris Thessaloniki",
    joined: "2024",
    contractExpires: "Pending API",
    marketValue: "Pending API",
    contractProgress: 42,
  },
};

export function fallbackSeasonStatsForPlayer(player: Player): PlayerSeasonStatsSeed {
  return playerSeasonStatFallbacks[player.id] ?? fallbackSeasonStatsByStatus(player.status);
}

function fallbackSeasonStatsByStatus(status: Player["status"]): PlayerSeasonStatsSeed {
  if (status === "synced") {
    return { appearances: 12, starts: 9, minutes: 824, goals: 0, assists: 1, rating: "Pending", seasonLabel: "Fallback" };
  }

  if (status === "review") {
    return { appearances: 8, starts: 6, minutes: 540, goals: 0, assists: 0, rating: "Review", seasonLabel: "Fallback" };
  }

  return { appearances: 0, starts: 0, minutes: 0, goals: 0, assists: 0, rating: "Pending API", seasonLabel: "Fallback" };
}
