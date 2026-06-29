import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BATCH_SIZE = 500;

loadEnvFile(".env.local");
loadEnvFile(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecret) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in the environment.");
}

const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: {
    persistSession: false,
  },
});

const requestedImports = new Set(
  process.argv.slice(2).flatMap((arg) => arg.split(",")).filter(Boolean),
);
const shouldImportAll = requestedImports.size === 0 || requestedImports.has("all");

if (shouldImportAll || requestedImports.has("players")) {
  await importPlayersMaster();
}

if (shouldImportAll || requestedImports.has("gps")) {
  await importGpsPlayerDaily();
}

if (shouldImportAll || requestedImports.has("injuries")) {
  await importInjuryHistory();
}

if (shouldImportAll || requestedImports.has("body-comp") || requestedImports.has("bodyComp")) {
  await importBodyComposition();
}

async function importPlayersMaster() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/players_master.csv");
  const rows = readCsv(csvPath)
    .map((row) => ({
      ams_id: stringOrNull(row.amsId),
      slug: stringOrNull(row.slug),
      full_name: stringOrNull(row.fullName),
      display_name: stringOrNull(row.displayName),
      shirt_number: integerOrNull(row.shirtNumber),
      position: stringOrNull(row.position),
      nationality: stringOrNull(row.nationality),
      birth_date: dateOrNull(row.birthDate),
      active_status: stringOrNull(row.activeStatus),
      payload: row,
    }))
    .filter((row) => row.ams_id);

  await upsertBatches("ams_players_master", rows, "ams_id");
}

async function importGpsPlayerDaily() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/gps/gps_player_daily.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const sourceSessionId = stringOrNull(row.sourceSessionId);
      const amsId = stringOrNull(row.amsId);
      const date = dateOrNull(row.date);
      const task = stringOrNull(row.rollupSourceTask);

      return {
        import_key: [
          stringOrNull(row.team) || "team",
          amsId || "ams",
          sourceSessionId || `row-${index + 1}`,
          date || "date",
          task || "task",
        ].join("|"),
        team: stringOrNull(row.team),
        ams_id: amsId,
        wimu_player_id: stringOrNull(row.wimuPlayerId),
        wimu_team_id: stringOrNull(row.wimuTeamId),
        source_session_id: sourceSessionId,
        session_date: date,
        rollup_source_task: task,
        clean_player_name: stringOrNull(row.cleanPlayerName),
        source_player_name: stringOrNull(row.sourcePlayerName),
        is_match: booleanOrNull(row.isMatch),
        minutes: numberOrNull(row.minutes),
        total_distance: numberOrNull(row.totalDistance),
        hsr_abs_distance: numberOrNull(row.hsrAbsDistance),
        sprint_distance: numberOrNull(row.sprintDistance),
        max_speed_kmh: numberOrNull(row.maxSpeedKmh),
        player_load: numberOrNull(row.playerLoad),
        payload: row,
      };
    });

  await upsertBatches("ams_gps_player_daily", rows, "import_key");
}

async function importInjuryHistory() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/injuries/injury_history_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      injury_id: stringOrNull(row.injuryId) || `injury-${index + 1}`,
      ams_id: stringOrNull(row.amsId),
      player_name: stringOrNull(row.playerName),
      normalized_player_name: stringOrNull(row.normalizedPlayerName),
      injury_type: stringOrNull(row.injuryType),
      injury: stringOrNull(row.injury),
      body_region: stringOrNull(row.bodyRegion),
      laterality: stringOrNull(row.laterality),
      cause: stringOrNull(row.cause),
      biomechanical_process: stringOrNull(row.biomechanicalProcess),
      start_date: dateOrNull(row.startDate),
      end_date: dateOrNull(row.endDate),
      rehab_days: numberOrNull(row.rehabDays),
      excluded_days: numberOrNull(row.excludedDays),
      readaptation_days: numberOrNull(row.readaptationDays),
      total_days_lost: numberOrNull(row.totalDaysLost),
      map_x: numberOrNull(row.mapX),
      map_y: numberOrNull(row.mapY),
      payload: row,
    }));

  await upsertBatches("ams_injury_history", rows, "injury_id");
}

async function importBodyComposition() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/body_comp/body_comp_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const sourceCategory = stringOrNull(row.sourceCategory);
      const playerId = stringOrNull(row.playerId);
      const playerName = stringOrNull(row.playerName);
      const testDate = dateOrNull(row.testDate);

      return {
        import_key: [
          sourceCategory || "category",
          playerId || playerName || `row-${index + 1}`,
          testDate || "date",
        ].join("|"),
        source_category: sourceCategory,
        player_id: playerId,
        player_name: playerName,
        birth_date: dateOrNull(row.birthDate),
        position: stringOrNull(row.position),
        test_date: testDate,
        age_years: numberOrNull(row.ageYears),
        weight_kg: numberOrNull(row.weightKg),
        height_cm: numberOrNull(row.heightCm),
        seated_height_cm: numberOrNull(row.seatedHeightCm),
        bmi: numberOrNull(row.bmi),
        adipose_kg: numberOrNull(row.adiposeKg),
        muscle_kg: numberOrNull(row.muscleKg),
        residual_kg: numberOrNull(row.residualKg),
        bone_kg: numberOrNull(row.boneKg),
        skinfold_6: numberOrNull(row.skinfold6),
        basal_kcal: numberOrNull(row.basalKcal),
        rest_kcal: numberOrNull(row.restKcal),
        light_kcal: numberOrNull(row.lightKcal),
        moderate_kcal: numberOrNull(row.moderateKcal),
        match_kcal: numberOrNull(row.matchKcal),
        waist_cm: numberOrNull(row.waistCm),
        hip_cm: numberOrNull(row.hipCm),
        chest_cm: numberOrNull(row.chestCm),
        arm_cm: numberOrNull(row.armCm),
        thigh_cm: numberOrNull(row.thighCm),
        calf_cm: numberOrNull(row.calfCm),
        payload: row,
      };
    });

  await upsertBatches("ams_body_composition", rows, "import_key");
}

async function upsertBatches(table, rows, onConflict) {
  console.log(`Importing ${rows.length.toLocaleString()} rows into ${table}...`);

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict });

    if (error) {
      throw new Error(`${table} import failed at row ${index + 1}: ${error.message}`);
    }

    console.log(`${table}: ${Math.min(index + batch.length, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}`);
  }
}

function loadEnvFile(filename) {
  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) continue;
    process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
  }
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines.shift() || "");

  return lines
    .filter(Boolean)
    .map((line) => {
      const values = splitCsvLine(line);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    });
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
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

function stringOrNull(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function numberOrNull(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function integerOrNull(value) {
  const parsed = numberOrNull(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function dateOrNull(value) {
  const text = stringOrNull(value);
  if (!text) return null;
  const date = new Date(`${text.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function booleanOrNull(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;
  if (["true", "1", "yes", "y"].includes(text)) return true;
  if (["false", "0", "no", "n"].includes(text)) return false;
  return null;
}
