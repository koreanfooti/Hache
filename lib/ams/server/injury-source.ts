import { players } from "@/lib/ams/content";
import { numberValue, parseCsv } from "@/lib/ams/data";
import { injuryGoogleSheetCsvUrl, injuryGoogleSheetHtmlUrl } from "@/lib/ams/sources/injury-config";

export type InjurySourceRow = {
  injuryId: string;
  amsId?: string;
  playerName: string;
  sourcePlayerName: string;
  injuryType: string;
  injury: string;
  bodyRegion: string;
  laterality: string;
  cause: string;
  biomechanicalProcess: string;
  startDate: string;
  endDate: string;
  rehabDays: number;
  excludedDays: number;
  observationDays: number;
  totalDaysLost: number;
  mapX: number;
  mapY: number;
  source: "google-sheets";
  sourceUrl: string;
};

export type InjurySourcePayload = {
  rows: InjurySourceRow[];
  meta: {
    source: "google-sheets";
    sourceLabel: string;
    sourceUrl: string;
    csvUrl: string;
    sheetName: string;
    rowCount: number;
    lastSynced: string;
    cacheSeconds: number;
  };
};

type RawSheetRow = Record<string, string>;

const cacheSeconds = 60;
const rosterByName = new Map(players.map((player) => [normalizeName(player.name), player]));

export async function getInjuryHistoryFromGoogleSheet(): Promise<InjurySourcePayload> {
  const response = await fetch(injuryGoogleSheetCsvUrl, {
    next: { revalidate: cacheSeconds },
  });

  if (!response.ok) {
    throw new Error(`Google Sheet returned ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv).map((row, index) => normalizeInjuryRow(row as RawSheetRow, index));

  return {
    rows,
    meta: {
      source: "google-sheets",
      sourceLabel: "Published Google Sheet",
      sourceUrl: injuryGoogleSheetHtmlUrl,
      csvUrl: injuryGoogleSheetCsvUrl,
      sheetName: "SAP_S1_medical_V2",
      rowCount: rows.length,
      lastSynced: new Date().toISOString(),
      cacheSeconds,
    },
  };
}

function normalizeInjuryRow(row: RawSheetRow, index: number): InjurySourceRow {
  const sourcePlayerName = cleanText(row.Jugador);
  const matchedPlayer = rosterByName.get(normalizeName(sourcePlayerName));
  const injury = cleanText(row["Lesión"]);
  const bodyRegion = inferBodyRegion(injury);
  const coordinates = injuryMapCoordinates(bodyRegion, row.Lateralidad);
  const startDate = normalizeDate(row["Fecha Inicio"]);
  const endDate = normalizeDate(row["Fecha Fin"]);

  return {
    injuryId: `gs-injury-${index + 1}`,
    amsId: matchedPlayer?.amsId,
    playerName: matchedPlayer?.name ?? sourcePlayerName,
    sourcePlayerName,
    injuryType: cleanText(row["Tipo de Lesión"]),
    injury,
    bodyRegion,
    laterality: cleanText(row.Lateralidad),
    cause: cleanText(row.Causa),
    biomechanicalProcess: cleanText(row["Proceso Biomecánico"]),
    startDate,
    endDate,
    rehabDays: numberValue(row["En Rehabilitación"]),
    excludedDays: numberValue(row["Excluído"]),
    observationDays: numberValue(row["En observación/Readaptación"]),
    totalDaysLost: numberValue(row["Días de Baja Totales"]),
    mapX: coordinates.mapX,
    mapY: coordinates.mapY,
    source: "google-sheets",
    sourceUrl: injuryGoogleSheetHtmlUrl,
  };
}

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeName(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeDate(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return "";

  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthMatch = /^([A-Za-záéíóúñ.]+)\s+(\d{1,2}),\s*(\d{4})$/i.exec(raw);
  if (monthMatch) {
    const [, monthName, day, year] = monthMatch;
    const month = monthNumber(monthName);
    if (month) return `${year}-${month}-${day.padStart(2, "0")}`;
  }

  return raw;
}

function monthNumber(value: string) {
  const key = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f.]/g, "")
    .toLowerCase()
    .slice(0, 4);
  const months: Record<string, string> = {
    ene: "01",
    jan: "01",
    feb: "02",
    mar: "03",
    abr: "04",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    ago: "08",
    aug: "08",
    sep: "09",
    sept: "09",
    oct: "10",
    nov: "11",
    dic: "12",
    dec: "12",
  };

  return months[key] ?? months[key.slice(0, 3)] ?? "";
}

function inferBodyRegion(injury: string) {
  const normalized = normalizeName(injury);
  const regions: Array<[string, string]> = [
    ["nariz", "head"],
    ["conmocion", "head"],
    ["conmoción", "head"],
    ["cabeza", "head"],
    ["cuello", "neck"],
    ["hombro", "shoulder"],
    ["brazo", "upper_arm"],
    ["codo", "elbow"],
    ["muneca", "wrist_hand"],
    ["muñeca", "wrist_hand"],
    ["mano", "wrist_hand"],
    ["pecho", "chest"],
    ["abdomen", "abdomen"],
    ["lumbar", "lumbar"],
    ["espalda", "back"],
    ["gluteo", "glute"],
    ["glúteo", "glute"],
    ["aductor", "hip_groin"],
    ["ingle", "hip_groin"],
    ["recto femoral", "quad_thigh"],
    ["cuadriceps", "quad_thigh"],
    ["cuádriceps", "quad_thigh"],
    ["muslo", "quad_thigh"],
    ["isqu", "hamstring"],
    ["biceps femoral", "hamstring"],
    ["bíceps femoral", "hamstring"],
    ["semimembranoso", "hamstring"],
    ["semitendinoso", "hamstring"],
    ["rodilla", "knee"],
    ["ligamento colateral medial rodilla", "knee"],
    ["gemelo", "calf"],
    ["soleo", "calf"],
    ["sóleo", "calf"],
    ["pantorrilla", "calf"],
    ["astrágalo", "ankle"],
    ["astragalo", "ankle"],
    ["peroneo", "ankle"],
    ["tobillo", "ankle"],
    ["pie", "foot"],
  ];

  return regions.find(([needle]) => normalized.includes(normalizeName(needle)))?.[1] ?? "other";
}

function injuryMapCoordinates(bodyRegion: string, laterality: unknown) {
  const normalizedSide = normalizeName(cleanText(laterality));
  const isLeft = normalizedSide.includes("izquierda");
  const isRight = normalizedSide.includes("derecha");
  const coordinates: Record<string, { center: [number, number]; left?: [number, number]; right?: [number, number] }> = {
    abdomen: { center: [20, 41] },
    ankle: { center: [19, 92], left: [23, 92], right: [15, 92] },
    back: { center: [72, 38] },
    calf: { center: [69, 84], left: [73, 84], right: [65, 84] },
    chest: { center: [20, 30] },
    elbow: { center: [13, 43], left: [15, 43], right: [11, 43] },
    foot: { center: [19, 97], left: [24, 97], right: [14, 97] },
    glute: { center: [76, 54], left: [76, 54], right: [68, 54] },
    hamstring: { center: [72, 65], left: [68, 65], right: [76, 65] },
    head: { center: [25, 10], left: [24, 10], right: [26, 10] },
    hip_groin: { center: [24, 51], left: [28, 51], right: [20, 51] },
    knee: { center: [19, 79], left: [23, 79], right: [15, 79] },
    lumbar: { center: [72, 44] },
    neck: { center: [25, 18] },
    other: { center: [50, 50] },
    quad_thigh: { center: [20, 66], left: [24, 66], right: [16, 66] },
    shoulder: { center: [15, 22], left: [17, 22], right: [13, 22] },
    upper_arm: { center: [12, 33], left: [16, 33], right: [10, 33] },
    wrist_hand: { center: [8, 52], left: [12, 52], right: [6, 52] },
  };
  const regionCoordinates = coordinates[bodyRegion] ?? coordinates.other;
  const [mapX, mapY] = isLeft && regionCoordinates.left
    ? regionCoordinates.left
    : isRight && regionCoordinates.right
      ? regionCoordinates.right
      : regionCoordinates.center;

  return { mapX, mapY };
}
