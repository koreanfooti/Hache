export type GpsDailyRow = {
  date?: string;
  athlete?: string;
  name?: string;
  playerName?: string;
  team?: string;
  session_type?: string;
  sessionName?: string;
  total_distance_m?: string;
  totalDistance?: string;
  high_intensity_m?: string;
  highIntensityDistance?: string;
  max_speed_kmh?: string;
  maxSpeed?: string;
  minutes?: string;
  playerLoad?: string;
};

export function numberValue(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function compactNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines.shift() ?? "");

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = splitCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

export async function loadCsv<T>(path: string): Promise<T[]> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return parseCsv(await response.text()) as T[];
}

export async function loadJson<T>(path: string): Promise<T[]> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}
