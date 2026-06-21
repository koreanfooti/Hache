import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { Player } from "@/lib/ams/content";
import type { ValdNordbordTestRow } from "@/lib/ams/types";
import type { NordbordIsopronoReference } from "@/lib/ams/valdReferences";
import type { ForceSeriesPoint } from "@/components/ams/panels/testing/vald/nordbord/nordbordTypes";

export function sortNordbordRows(rows: ValdNordbordTestRow[]) {
  return [...rows].sort((a, b) => String(a.testDateUtc).localeCompare(String(b.testDateUtc)));
}

export function rowToSeriesPoint(row: ValdNordbordTestRow): ForceSeriesPoint {
  const left = numberValue(row.leftMaxForce);
  const right = numberValue(row.rightMaxForce);

  return {
    asymmetry: signedAsymmetry(left, right),
    date: dateInputValue(row.testDateUtc),
    displayDate: formatAxisDate(row.testDateUtc),
    left,
    right,
    testId: row.testId ?? `${row.amsId}-${row.testDateUtc}`,
    type: row.testTypeName ?? "NordBord",
  };
}

export function signedAsymmetry(left: number, right: number) {
  const peak = Math.max(left, right);
  return peak ? ((left - right) / peak) * 100 : 0;
}

export function changeFromMax(value: number, maxReference: number) {
  if (!maxReference) return 0;
  return ((value - maxReference) / maxReference) * 100;
}

export function changeTone(value: number) {
  if (value >= 0) return "positive";
  if (value <= -15) return "red";
  if (value <= -10) return "orange";
  if (value <= -5) return "gold";
  return "neutral";
}

export function maxValue(values: unknown[]) {
  return Math.max(0, ...values.map(numberValue));
}

export function average(values: unknown[]) {
  const numericValues = values.map(numberValue).filter((value) => Number.isFinite(value));
  if (!numericValues.length) return 0;
  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
}

export function forceLabel(value: number) {
  return value ? compactNumber(value, 2) : "-";
}

export function percentLabel(value: number) {
  if (!Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${compactNumber(value, 2)}`;
}

export function forcePerKgLabel(value: unknown) {
  const numericValue = numberValue(value);
  return numericValue ? `${compactNumber(numericValue, 2)} N/kg` : "-";
}

export function secondsLabel(value: unknown) {
  const numericValue = numberValue(value);
  return numericValue ? `${compactNumber(numericValue, 2)} s` : "-";
}

export function dateInputValue(value: string | undefined) {
  return formatShortDate(value);
}

export function nordbordTestKey(row: ValdNordbordTestRow) {
  return row.testId ?? `${row.amsId}-${row.testDateUtc}-${row.testTypeName}`;
}

export function formatShortDate(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string | undefined) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return value?.slice(0, 10) || "-";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatAxisDate(value: string | undefined) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return value?.slice(0, 10) || "-";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(date);
}

export function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

export function fallbackPlayer(amsId: string, unknownPlayer: string): Player {
  return {
    age: "-",
    amsId,
    foot: "-",
    height: "-",
    id: amsId || "unknown-player",
    name: amsId || unknownPlayer,
    nationality: "-",
    number: "-",
    photo: "",
    position: "Unassigned",
    status: "pending",
    weight: "-",
  };
}

export function positionLabel(position: string | undefined, language: AmsLanguage) {
  const labels: Record<string, string> = language === "es"
    ? {
      Defender: "Defensa",
      Forward: "Delantero",
      Goalkeeper: "Portero",
      Midfielder: "Mediocampista",
      Unassigned: "Sin asignar",
    }
    : {};

  return labels[position ?? ""] ?? position ?? "-";
}

export function referenceDisplayLabel(reference: NordbordIsopronoReference, language: AmsLanguage) {
  const label = language === "es" ? reference.esLabel : reference.enLabel;
  if (!reference.isAggregate) return label;
  return language === "es" ? `${label} prom.` : `${label} avg.`;
}
