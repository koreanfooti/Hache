import { players } from "@/lib/ams/content";
import { numberValue } from "@/lib/ams/data";

export function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value) && value > 0);
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

export function playerNameForAmsId(amsId: string | undefined) {
  return players.find((player) => player.amsId === amsId)?.name ?? amsId ?? "Unknown player";
}

export function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}
