import type { AmsLanguage } from "@/components/ams/ui/AmsUi";
import { compactNumber, numberValue } from "@/lib/ams/data";
import type { Player } from "@/lib/ams/content";
import type { ForceFrameHipAdAbReference } from "@/lib/ams/valdReferences";
import type { ValdForceFrameTestRow } from "@/lib/ams/types";
import {
  average,
  changeTone,
  formatAxisDate,
  formatDisplayDate,
  formatShortDate,
  signedAsymmetry,
  unique,
} from "@/components/ams/panels/testing/vald/nordbord/nordbordUtils";
import type { ForceFrameDirection, ForceFrameSeriesPoint } from "@/components/ams/panels/testing/vald/forceframe/forceframeTypes";

const pullLeftKeys = ["outerLeftMaxForce", "outerLeftMaxForceN", "leftOuterMaxForce", "leftMaxForceOuter", "leftMaxForce"];
const pullRightKeys = ["outerRightMaxForce", "outerRightMaxForceN", "rightOuterMaxForce", "rightMaxForceOuter", "rightMaxForce"];
const squeezeLeftKeys = ["innerLeftMaxForce", "innerLeftMaxForceN", "leftInnerMaxForce", "leftMaxForceInner", "leftMaxForce"];
const squeezeRightKeys = ["innerRightMaxForce", "innerRightMaxForceN", "rightInnerMaxForce", "rightMaxForceInner", "rightMaxForce"];

export { average, changeTone, formatDisplayDate, formatShortDate, unique };

export function sortForceFrameRows(rows: ValdForceFrameTestRow[]) {
  return [...rows].sort((a, b) => String(a.testDateUtc).localeCompare(String(b.testDateUtc)));
}

export function forceFrameTestKey(row: ValdForceFrameTestRow) {
  return row.testId ?? `${row.amsId}-${row.testDateUtc}-${row.testTypeName}-${row.testPositionName}`;
}

export function forceFrameDateInput(value: string | undefined) {
  return formatShortDate(value);
}

export function forceFramePoint(row: ValdForceFrameTestRow, direction: ForceFrameDirection): ForceFrameSeriesPoint {
  const left = forceFrameForce(row, direction, "left");
  const right = forceFrameForce(row, direction, "right");

  return {
    asymmetry: signedAsymmetry(left, right),
    date: forceFrameDateInput(row.testDateUtc),
    direction,
    displayDate: formatAxisDate(row.testDateUtc),
    left,
    position: row.testPositionName ?? "ForceFrame",
    right,
    testId: forceFrameTestKey(row),
    type: row.testTypeName ?? "ForceFrame",
  };
}

export function forceFrameForce(row: ValdForceFrameTestRow, direction: ForceFrameDirection, side: "left" | "right") {
  const keys = direction === "pull"
    ? side === "left" ? pullLeftKeys : pullRightKeys
    : side === "left" ? squeezeLeftKeys : squeezeRightKeys;

  for (const key of keys) {
    const value = numberValue(row[key]);
    if (value) return value;
  }

  return 0;
}

export function maxValue(values: unknown[]) {
  return Math.max(0, ...values.map(numberValue));
}

export function median(values: number[]) {
  const numericValues = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!numericValues.length) return 0;
  const middle = Math.floor(numericValues.length / 2);
  return numericValues.length % 2 ? numericValues[middle] : (numericValues[middle - 1] + numericValues[middle]) / 2;
}

export function percentChange(value: number, reference: number) {
  if (!reference) return 0;
  return ((value - reference) / reference) * 100;
}

export function forceLabel(value: number) {
  return value ? compactNumber(value, 2) : "-";
}

export function percentLabel(value: number) {
  if (!Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${compactNumber(value, 2)}`;
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

export function forceFrameReferenceDisplayLabel(reference: ForceFrameHipAdAbReference, language: AmsLanguage, aggregateSuffix: string) {
  const label = language === "es" ? reference.esLabel : reference.enLabel;
  return reference.isAggregate ? `${label} ${aggregateSuffix}` : label;
}

export function isForceFrameHipAdAbTestType(type: string | undefined) {
  const normalizedType = String(type ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return Boolean(
    normalizedType.includes("hip")
      || normalizedType.includes("ad/ab")
      || normalizedType.includes("ab/ad")
      || normalizedType.includes("adduction")
      || normalizedType.includes("abduction"),
  );
}

export function fallbackPlayer(amsId: string, unknownPlayer: string): Player {
  return {
    age: "-",
    amsId,
    foot: "-",
    height: "-",
    id: amsId || "unknown-forceframe-player",
    name: amsId || unknownPlayer,
    nationality: "-",
    number: "-",
    photo: "",
    position: "Unassigned",
    status: "pending",
    weight: "-",
  };
}
