import { players } from "@/lib/ams/content";
import { numberValue, parseCsv } from "@/lib/ams/data";

export const injuryGoogleSheetHtmlUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZpdGluHuKk_qklWfGwuHggEt1s3mVP94oBflIqBa5UfTGgXE-uQhYR8VBs2ffDg/pubhtml";

export const injuryGoogleSheetCsvUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQZpdGluHuKk_qklWfGwuHggEt1s3mVP94oBflIqBa5UfTGgXE-uQhYR8VBs2ffDg/pub?output=csv";

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
    ["rodilla", "Knee"],
    ["ligamento colateral medial rodilla", "Knee"],
    ["aductor", "Groin / Adductor"],
    ["recto femoral", "Thigh"],
    ["lumbar", "Lumbar"],
    ["astrágalo", "Ankle"],
    ["astragalo", "Ankle"],
    ["peroneo", "Ankle"],
    ["codo", "Elbow"],
    ["isqu", "Hamstring"],
    ["tobillo", "Ankle"],
    ["hombro", "Shoulder"],
    ["cuadriceps", "Thigh"],
    ["cuádriceps", "Thigh"],
    ["gemelo", "Calf"],
    ["soleo", "Calf"],
    ["sóleo", "Calf"],
    ["pie", "Foot"],
  ];

  return regions.find(([needle]) => normalized.includes(normalizeName(needle)))?.[1] ?? "Unclassified";
}
