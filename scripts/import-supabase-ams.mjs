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

if (shouldImportAll || requestedImports.has("fms")) {
  await importFms();
}

if (shouldImportAll || requestedImports.has("y-balance") || requestedImports.has("yBalance")) {
  await importYBalance();
}

if (shouldImportAll || requestedImports.has("rehab") || requestedImports.has("rehab-services")) {
  await importRehabServices();
}

if (
  shouldImportAll
  || requestedImports.has("player-history")
  || requestedImports.has("playerHistory")
  || requestedImports.has("history")
) {
  await importPlayerHistory();
} else {
  if (requestedImports.has("player-season-history")) {
    await importPlayerSeasonHistory();
  }

  if (requestedImports.has("player-match-history")) {
    await importPlayerMatchHistory();
  }
}

if (
  shouldImportAll
  || requestedImports.has("vald")
  || requestedImports.has("nordbord")
  || requestedImports.has("vald-nordbord")
) {
  await importValdNordbord();
}

if (
  shouldImportAll
  || requestedImports.has("vald-profile-map")
  || requestedImports.has("profile-map")
) {
  await importValdProfileMap();
}

if (shouldImportAll || requestedImports.has("sync-audit") || requestedImports.has("syncAudit")) {
  await importSyncAudit();
}

const shouldImportScreening = shouldImportAll || requestedImports.has("screening") || requestedImports.has("screens");

if (shouldImportScreening || requestedImports.has("external-tests") || requestedImports.has("externalTests")) {
  await importExternalTests();
}

if (shouldImportScreening || requestedImports.has("mobility-screen") || requestedImports.has("mobility")) {
  await importMobilityScreen();
}

if (
  shouldImportScreening
  || requestedImports.has("musculoskeletal-screen")
  || requestedImports.has("musculoskeletal")
  || requestedImports.has("msk")
) {
  await importMusculoskeletalScreen();
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

async function importFms() {
  await importFmsAssessments();
  await importFmsExerciseScores();
}

async function importFmsAssessments() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/fms_assessments_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      assessment_id: stringOrNull(row.assessmentId) || `fms-assessment-${index + 1}`,
      ams_id: stringOrNull(row.amsId),
      source_athlete_name: stringOrNull(row.sourceAthleteName),
      external_id: stringOrNull(row.externalId),
      matched_athlete_name: stringOrNull(row.matchedAthleteName),
      identity_match_confidence: numberOrNull(row.identityMatchConfidence),
      identity_match_method: stringOrNull(row.identityMatchMethod),
      review_required: booleanOrNull(row.reviewRequired),
      date_iso: dateOrNull(row.dateIso),
      test: stringOrNull(row.test),
      source_url: stringOrNull(row.sourceUrl),
      total_score: numberOrNull(row.totalScore),
      recomputed_total: numberOrNull(row.recomputedTotal),
      total_score_matches_exercises: booleanOrNull(row.totalScoreMatchesExercises),
      score_band: stringOrNull(row.scoreBand),
      risk_flag: stringOrNull(row.riskFlag),
      primary_finding_1: stringOrNull(row.primaryFinding1),
      primary_finding_2: stringOrNull(row.primaryFinding2),
      primary_finding_3: stringOrNull(row.primaryFinding3),
      source_row_number: integerOrNull(row.sourceRowNumber),
      payload: row,
    }));

  await upsertBatches("ams_fms_assessments", rows, "assessment_id");
}

async function importFmsExerciseScores() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/fms_exercise_scores_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const assessmentId = stringOrNull(row.assessmentId);
      const exerciseKey = stringOrNull(row.exerciseKey);

      return {
        import_key: [assessmentId || `assessment-${index + 1}`, exerciseKey || stringOrNull(row.exerciseName) || index + 1].join("|"),
        assessment_id: assessmentId,
        ams_id: stringOrNull(row.amsId),
        source_athlete_name: stringOrNull(row.sourceAthleteName),
        date_iso: dateOrNull(row.dateIso),
        test: stringOrNull(row.test),
        exercise_key: exerciseKey,
        exercise_name: stringOrNull(row.exerciseName),
        point_score: numberOrNull(row.pointScore),
        left_score: numberOrNull(row.leftScore),
        right_score: numberOrNull(row.rightScore),
        asymmetry_raw: stringOrNull(row.asymmetryRaw),
        hierarchy_label: stringOrNull(row.hierarchyLabel),
        hierarchy_rank: numberOrNull(row.hierarchyRank),
        exercise_tie_break_rank: numberOrNull(row.exerciseTieBreakRank),
        correction_priority_rank: numberOrNull(row.correctionPriorityRank),
        payload: row,
      };
    });

  await upsertBatches("ams_fms_exercise_scores", rows, "import_key");
}

async function importYBalance() {
  await importYBalanceAssessments();
  await importYBalanceMetrics();
}

async function importYBalanceAssessments() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/y_balance_assessments_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      assessment_id: stringOrNull(row.assessmentId) || `y-balance-assessment-${index + 1}`,
      ams_id: stringOrNull(row.amsId),
      source_athlete_name: stringOrNull(row.sourceAthleteName),
      external_id: stringOrNull(row.externalId),
      matched_athlete_name: stringOrNull(row.matchedAthleteName),
      identity_match_confidence: numberOrNull(row.identityMatchConfidence),
      identity_match_method: stringOrNull(row.identityMatchMethod),
      review_required: booleanOrNull(row.reviewRequired),
      date_iso: dateOrNull(row.dateIso),
      test: stringOrNull(row.test),
      test_type: stringOrNull(row.testType),
      source_url: stringOrNull(row.sourceUrl),
      right_composite_percent: numberOrNull(row.rightCompositePercent),
      left_composite_percent: numberOrNull(row.leftCompositePercent),
      lowest_composite_percent: numberOrNull(row.lowestCompositePercent),
      anterior_asymmetry_cm: numberOrNull(row.anteriorAsymmetryCm),
      composite_asymmetry_percent_abs: numberOrNull(row.compositeAsymmetryPercentAbs),
      asymmetry_raw: stringOrNull(row.asymmetryRaw),
      score_band: stringOrNull(row.scoreBand),
      risk_flag: stringOrNull(row.riskFlag),
      primary_finding_1: stringOrNull(row.primaryFinding1),
      primary_finding_2: stringOrNull(row.primaryFinding2),
      primary_finding_3: stringOrNull(row.primaryFinding3),
      source_row_number: integerOrNull(row.sourceRowNumber),
      payload: row,
    }));

  await upsertBatches("ams_y_balance_assessments", rows, "assessment_id");
}

async function importYBalanceMetrics() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/y_balance_metrics_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const assessmentId = stringOrNull(row.assessmentId);
      const side = stringOrNull(row.side);
      const metric = stringOrNull(row.metric);

      return {
        import_key: [assessmentId || `assessment-${index + 1}`, side || "side", metric || "metric"].join("|"),
        assessment_id: assessmentId,
        ams_id: stringOrNull(row.amsId),
        source_athlete_name: stringOrNull(row.sourceAthleteName),
        date_iso: dateOrNull(row.dateIso),
        test: stringOrNull(row.test),
        test_type: stringOrNull(row.testType),
        source_url: stringOrNull(row.sourceUrl),
        side,
        metric,
        value: numberOrNull(row.value),
        unit: stringOrNull(row.unit),
        payload: row,
      };
    });

  await upsertBatches("ams_y_balance_metrics", rows, "import_key");
}

async function importRehabServices() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/rehab_services/rehab_services_daily_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const dateIso = dateOrNull(row.dateIso);
      const serviceCode = stringOrNull(row.serviceCode);

      return {
        import_key: [
          dateIso || stringOrNull(row.dateRaw) || "date",
          serviceCode || stringOrNull(row.serviceName) || "service",
          integerOrNull(row.sourceRowNumber) ?? `row-${index + 1}`,
          integerOrNull(row.sourceColumnNumber) ?? "column",
        ].join("|"),
        source: stringOrNull(row.source),
        source_url: stringOrNull(row.sourceUrl),
        date_iso: dateIso,
        year: integerOrNull(row.year),
        month: integerOrNull(row.month),
        service_code: serviceCode,
        service_name: stringOrNull(row.serviceName),
        raw_service_name: stringOrNull(row.rawServiceName),
        service_count: numberOrNull(row.count),
        raw_value: stringOrNull(row.rawValue),
        note: stringOrNull(row.note),
        is_off_day: booleanOrNull(row.isOffDay),
        source_row_number: integerOrNull(row.sourceRowNumber),
        source_column_number: integerOrNull(row.sourceColumnNumber),
        payload: row,
      };
    });

  await upsertBatches("ams_rehab_services_daily", rows, "import_key");
}

async function importPlayerHistory() {
  await importPlayerSeasonHistory();
  await importPlayerMatchHistory();
}

async function importPlayerSeasonHistory() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/player_season_history.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const amsId = stringOrNull(row.amsId);
      const season = stringOrNull(row.season);
      const tournament = stringOrNull(row.tournament);
      const phase = stringOrNull(row.phase);
      const club = stringOrNull(row.club);

      return {
        import_key: [
          amsId || `ams-${index + 1}`,
          stringOrNull(row.source) || "source",
          season || "season",
          tournament || "tournament",
          phase || "phase",
          club || "club",
          integerOrNull(row.clubId) ?? "club-id",
        ].join("|"),
        ams_id: amsId,
        source: stringOrNull(row.source),
        season,
        tournament,
        phase,
        division: stringOrNull(row.division),
        club,
        club_id: integerOrNull(row.clubId),
        games_played: numberOrNull(row.gamesPlayed),
        minutes_played: numberOrNull(row.minutesPlayed),
        starts: numberOrNull(row.starts),
        goals: numberOrNull(row.goals),
        own_goals: numberOrNull(row.ownGoals),
        yellow_cards: numberOrNull(row.yellowCards),
        red_cards: numberOrNull(row.redCards),
        payload: row,
      };
    });

  await upsertBatches("ams_player_season_history", rows, "import_key");
}

async function importPlayerMatchHistory() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/player_match_history.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const amsId = stringOrNull(row.amsId);
      const dateIso = dateOrNull(row.dateIso);

      return {
        import_key: [
          amsId || `ams-${index + 1}`,
          stringOrNull(row.source) || "source",
          stringOrNull(row.sourcePlayerId) || "source-player",
          stringOrNull(row.season) || "season",
          stringOrNull(row.tournament) || "tournament",
          stringOrNull(row.phase) || "phase",
          stringOrNull(row.jornada) || dateIso || `match-${index + 1}`,
        ].join("|"),
        ams_id: amsId,
        source: stringOrNull(row.source),
        source_player_id: stringOrNull(row.sourcePlayerId),
        season: stringOrNull(row.season),
        tournament: stringOrNull(row.tournament),
        phase: stringOrNull(row.phase),
        jornada: stringOrNull(row.jornada),
        date_iso: dateIso,
        date_display: stringOrNull(row.dateDisplay),
        local_team: stringOrNull(row.localTeam),
        local_club_id: integerOrNull(row.localClubId),
        local_goals: numberOrNull(row.localGoals),
        visitor_team: stringOrNull(row.visitorTeam),
        visitor_club_id: integerOrNull(row.visitorClubId),
        visitor_goals: numberOrNull(row.visitorGoals),
        venue: stringOrNull(row.venue),
        status: stringOrNull(row.status),
        minutes: numberOrNull(row.minutes),
        starter: stringOrNull(row.starter),
        payload: row,
      };
    });

  await upsertBatches("ams_player_match_history", rows, "import_key");
}

async function importValdNordbord() {
  await importValdNordbordTests();
  await importValdNordbordMetrics();
}

async function importValdNordbordTests() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/vald_nordbord_tests.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const payload = normalizeValdNordbordTestRow(row);
      const testId = stringOrNull(row.testId) || `vald-nordbord-test-${index + 1}`;

      return {
        test_id: testId,
        ams_id: stringOrNull(row.amsId),
        tenant_id: stringOrNull(row.tenantId),
        vald_profile_id: stringOrNull(row.valdProfileId),
        modified_date_utc: timestampOrNull(row.modifiedDateUtc),
        test_date_utc: timestampOrNull(row.testDateUtc),
        test_type_id: stringOrNull(row.testTypeId),
        test_type_name: stringOrNull(row.testTypeName),
        notes: stringOrNull(row.notes),
        device: stringOrNull(row.device),
        left_max_force: numberOrNull(row.leftMaxForce),
        right_max_force: numberOrNull(row.rightMaxForce),
        left_avg_force: numberOrNull(row.leftAvgForce),
        right_avg_force: numberOrNull(row.rightAvgForce),
        payload: {
          ...payload,
          testId,
        },
      };
    });

  await upsertBatches("ams_vald_nordbord_tests", rows, "test_id");
}

async function importValdNordbordMetrics() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/vald_nordbord_test_metrics.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const payload = normalizeValdNordbordMetricRow(row);
      const testId = stringOrNull(row.testId) || `vald-nordbord-metric-${index + 1}`;

      return {
        test_id: testId,
        ams_id: stringOrNull(row.amsId),
        tenant_id: stringOrNull(row.tenantId),
        vald_profile_id: stringOrNull(row.valdProfileId),
        athlete_id: stringOrNull(row.athleteId),
        left_max_force_per_kg: numberOrNull(row.leftMaxForcePerKg),
        right_max_force_per_kg: numberOrNull(row.rightMaxForcePerKg),
        left_avg_force_per_kg: numberOrNull(row.leftAvgForcePerKg),
        right_avg_force_per_kg: numberOrNull(row.rightAvgForcePerKg),
        left_avg_time_to_max_force_seconds: numberOrNull(row.leftAvgTimeToMaxForceSeconds),
        right_avg_time_to_max_force_seconds: numberOrNull(row.rightAvgTimeToMaxForceSeconds),
        payload: {
          ...payload,
          testId,
        },
      };
    });

  await upsertBatches("ams_vald_nordbord_metrics", rows, "test_id");
}

async function importValdProfileMap() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/vald_profile_map.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const valdProfileId = stringOrNull(row.valdProfileId) || `vald-profile-${index + 1}`;

      return {
        vald_profile_id: valdProfileId,
        ams_id: stringOrNull(row.amsId),
        tenant_id: stringOrNull(row.tenantId),
        sync_id: stringOrNull(row.syncId),
        external_id: stringOrNull(row.externalId),
        match_method: stringOrNull(row.matchMethod),
        confidence: numberOrNull(row.confidence),
        review_required: booleanOrNull(row.reviewRequired),
        payload: {
          amsId: stringOrNull(row.amsId) ?? "",
          valdProfileId,
          tenantId: stringOrNull(row.tenantId) ?? "",
          syncId: stringOrNull(row.syncId),
          externalId: stringOrNull(row.externalId),
          matchMethod: stringOrNull(row.matchMethod),
          confidence: numberOrNull(row.confidence),
          reviewRequired: booleanOrNull(row.reviewRequired),
        },
      };
    });

  await upsertBatches("ams_vald_profile_map", rows, "vald_profile_id");
}

async function importSyncAudit() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/sync_audit.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const amsId = stringOrNull(row.amsId);
      const source = stringOrNull(row.source);
      const payload = normalizeSyncAuditRow(row);

      return {
        import_key: [amsId || `ams-${index + 1}`, source || `source-${index + 1}`].join("|"),
        ams_id: amsId,
        source,
        has_data: booleanOrNull(row.hasData),
        last_updated: timestampOrNull(row.lastUpdated),
        record_count: integerOrNull(row.recordCount),
        notes: stringOrNull(row.notes),
        payload,
      };
    });

  await upsertBatches("ams_sync_audit", rows, "import_key");
}

async function importExternalTests() {
  await importExternalTestAssessments();
  await importExternalTestMetrics();
  await importExternalTestScoringCriteria();
}

async function importExternalTestAssessments() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/external_test_assessments_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      assessment_id: stringOrNull(row.assessmentId) || `external-assessment-${index + 1}`,
      ams_id: stringOrNull(row.amsId),
      source_athlete_name: stringOrNull(row.sourceAthleteName),
      matched_athlete_name: stringOrNull(row.matchedAthleteName),
      identity_match_confidence: numberOrNull(row.identityMatchConfidence),
      identity_match_method: stringOrNull(row.identityMatchMethod),
      review_required: booleanOrNull(row.reviewRequired),
      date_iso: dateOrNull(row.dateIso),
      test: stringOrNull(row.test),
      test_type: stringOrNull(row.testType),
      source_url: stringOrNull(row.sourceUrl),
      total_score: numberOrNull(row.totalScore),
      recomputed_total: numberOrNull(row.recomputedTotal),
      score_band: stringOrNull(row.scoreBand),
      risk_flag: stringOrNull(row.riskFlag),
      flag_count: integerOrNull(row.flagCount),
      numeric_asymmetry_count: integerOrNull(row.numericAsymmetryCount),
      payload: row,
    }));

  await upsertBatches("ams_external_test_assessments", rows, "assessment_id");
}

async function importExternalTestMetrics() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/external_test_metrics_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const assessmentId = stringOrNull(row.assessmentId);
      const metricIdentity = stringOrNull(row.metricKey)
        || stringOrNull(row.metric)
        || stringOrNull(row.exerciseKey)
        || stringOrNull(row.exerciseName)
        || stringOrNull(row.metricName)
        || `metric-${index + 1}`;

      return {
        import_key: [
          assessmentId || `assessment-${index + 1}`,
          stringOrNull(row.sourceTest) || stringOrNull(row.test) || "test",
          stringOrNull(row.side) || "side",
          metricIdentity,
          index + 1,
        ].join("|"),
        assessment_id: assessmentId,
        ams_id: stringOrNull(row.amsId),
        source_athlete_name: stringOrNull(row.sourceAthleteName),
        date_iso: dateOrNull(row.dateIso),
        test: stringOrNull(row.test),
        test_type: stringOrNull(row.testType),
        side: stringOrNull(row.side),
        metric: stringOrNull(row.metric),
        value: numberOrNull(row.value),
        unit: stringOrNull(row.unit),
        source_test: stringOrNull(row.sourceTest),
        exercise_key: stringOrNull(row.exerciseKey),
        exercise_name: stringOrNull(row.exerciseName),
        point_score: numberOrNull(row.pointScore),
        metric_key: stringOrNull(row.metricKey),
        metric_name: stringOrNull(row.metricName),
        numeric_value: numberOrNull(row.numericValue),
        flag: stringOrNull(row.flag),
        payload: row,
      };
    });

  await upsertBatches("ams_external_test_metrics", rows, "import_key");
}

async function importExternalTestScoringCriteria() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/external_test_scoring_criteria.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      import_key: [
        stringOrNull(row.test) || "test",
        stringOrNull(row.type) || "type",
        stringOrNull(row.label) || `label-${index + 1}`,
        stringOrNull(row.range) || "range",
      ].join("|"),
      test: stringOrNull(row.test),
      type: stringOrNull(row.type),
      label: stringOrNull(row.label),
      range: stringOrNull(row.range),
      meaning: stringOrNull(row.meaning),
      payload: row,
    }));

  await upsertBatches("ams_external_test_scoring_criteria", rows, "import_key");
}

async function importMobilityScreen() {
  await importMobilityScreenAssessments();
  await importMobilityScreenMetrics();
}

async function importMobilityScreenAssessments() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/mobility_screen_assessments_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      assessment_id: stringOrNull(row.assessmentId) || `mobility-assessment-${index + 1}`,
      ams_id: stringOrNull(row.amsId),
      source_athlete_name: stringOrNull(row.sourceAthleteName),
      matched_athlete_name: stringOrNull(row.matchedAthleteName),
      identity_match_confidence: numberOrNull(row.identityMatchConfidence),
      identity_match_method: stringOrNull(row.identityMatchMethod),
      review_required: booleanOrNull(row.reviewRequired),
      date_iso: dateOrNull(row.dateIso),
      test: stringOrNull(row.test),
      source_url: stringOrNull(row.sourceUrl),
      flag_count: integerOrNull(row.flagCount),
      numeric_asymmetry_count: integerOrNull(row.numericAsymmetryCount),
      score_band: stringOrNull(row.scoreBand),
      risk_flag: stringOrNull(row.riskFlag),
      payload: row,
    }));

  await upsertBatches("ams_mobility_screen_assessments", rows, "assessment_id");
}

async function importMobilityScreenMetrics() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/tests/mobility_screen_metrics_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const assessmentId = stringOrNull(row.assessmentId);
      const metricKey = stringOrNull(row.metricKey);

      return {
        import_key: [
          assessmentId || `assessment-${index + 1}`,
          metricKey || stringOrNull(row.metricName) || `metric-${index + 1}`,
          stringOrNull(row.side) || "side",
          index + 1,
        ].join("|"),
        assessment_id: assessmentId,
        ams_id: stringOrNull(row.amsId),
        source_athlete_name: stringOrNull(row.sourceAthleteName),
        date_iso: dateOrNull(row.dateIso),
        test: stringOrNull(row.test),
        metric_key: metricKey,
        metric_name: stringOrNull(row.metricName),
        side: stringOrNull(row.side),
        numeric_value: numberOrNull(row.numericValue),
        unit: stringOrNull(row.unit),
        flag: stringOrNull(row.flag),
        payload: row,
      };
    });

  await upsertBatches("ams_mobility_screen_metrics", rows, "import_key");
}

async function importMusculoskeletalScreen() {
  await importMusculoskeletalScreenAssessments();
  await importMusculoskeletalScreenMetrics();
  await importMusculoskeletalScreenScoringCriteria();
}

async function importMusculoskeletalScreenAssessments() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/musculoskeletal_screen/musculoskeletal_screen_assessments_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      assessment_id: stringOrNull(row.assessmentId) || `musculoskeletal-assessment-${index + 1}`,
      ams_id: stringOrNull(row.amsId),
      source_athlete_name: stringOrNull(row.sourceAthleteName),
      matched_athlete_name: stringOrNull(row.matchedAthleteName),
      identity_match_confidence: numberOrNull(row.identityMatchConfidence),
      identity_match_method: stringOrNull(row.identityMatchMethod),
      review_required: booleanOrNull(row.reviewRequired),
      date_iso: dateOrNull(row.dateIso),
      test: stringOrNull(row.test),
      source_url: stringOrNull(row.sourceUrl),
      populated_metric_count: integerOrNull(row.populatedMetricCount),
      flag_count: integerOrNull(row.flagCount),
      asymmetry_count: integerOrNull(row.asymmetryCount),
      score_band: stringOrNull(row.scoreBand),
      risk_flag: stringOrNull(row.riskFlag),
      payload: row,
    }));

  await upsertBatches("ams_musculoskeletal_screen_assessments", rows, "assessment_id");
}

async function importMusculoskeletalScreenMetrics() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/musculoskeletal_screen/musculoskeletal_screen_metrics_clean.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => {
      const assessmentId = stringOrNull(row.assessmentId);
      const metricKey = stringOrNull(row.metricKey);

      return {
        import_key: [
          assessmentId || `assessment-${index + 1}`,
          stringOrNull(row.domain) || "domain",
          metricKey || stringOrNull(row.metricName) || `metric-${index + 1}`,
          stringOrNull(row.side) || "side",
          integerOrNull(row.sourceRowNumber) ?? "row",
          integerOrNull(row.sourceColumnNumber) ?? "column",
        ].join("|"),
        assessment_id: assessmentId,
        ams_id: stringOrNull(row.amsId),
        source_athlete_name: stringOrNull(row.sourceAthleteName),
        matched_athlete_name: stringOrNull(row.matchedAthleteName),
        date_iso: dateOrNull(row.dateIso),
        test: stringOrNull(row.test),
        domain: stringOrNull(row.domain),
        metric_key: metricKey,
        metric_name: stringOrNull(row.metricName),
        side: stringOrNull(row.side),
        numeric_value: numberOrNull(row.numericValue),
        unit: stringOrNull(row.unit),
        ideal_rule: stringOrNull(row.idealRule),
        is_ideal: booleanOrNull(row.isIdeal),
        flag: stringOrNull(row.flag),
        source_row_number: integerOrNull(row.sourceRowNumber),
        source_column_number: integerOrNull(row.sourceColumnNumber),
        payload: row,
      };
    });

  await upsertBatches("ams_musculoskeletal_screen_metrics", rows, "import_key");
}

async function importMusculoskeletalScreenScoringCriteria() {
  const csvPath = path.join(ROOT, "public/ams/data/clean/musculoskeletal_screen/musculoskeletal_screen_scoring_criteria.csv");
  const rows = readCsv(csvPath)
    .map((row, index) => ({
      import_key: [
        stringOrNull(row.test) || "test",
        stringOrNull(row.domain) || "domain",
        stringOrNull(row.metricKey) || `metric-${index + 1}`,
        stringOrNull(row.side) || "side",
      ].join("|"),
      test: stringOrNull(row.test),
      domain: stringOrNull(row.domain),
      metric_key: stringOrNull(row.metricKey),
      metric_name: stringOrNull(row.metricName),
      side: stringOrNull(row.side),
      ideal_rule: stringOrNull(row.idealRule),
      unit: stringOrNull(row.unit),
      payload: row,
    }));

  await upsertBatches("ams_musculoskeletal_screen_scoring_criteria", rows, "import_key");
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

function timestampOrNull(value) {
  const text = stringOrNull(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeValdNordbordTestRow(row) {
  const numericFields = [
    "leftAvgForce",
    "leftImpulse",
    "leftMaxForce",
    "leftTorque",
    "leftCalibration",
    "leftRepetitions",
    "rightAvgForce",
    "rightImpulse",
    "rightMaxForce",
    "rightTorque",
    "rightCalibration",
    "rightRepetitions",
  ];

  return normalizeRow(row, numericFields, {
    nullableStringFields: [],
  });
}

function normalizeValdNordbordMetricRow(row) {
  const textFields = new Set(["amsId", "tenantId", "valdProfileId", "testId", "athleteId"]);
  const numericFields = Object.keys(row).filter((field) => !textFields.has(field));
  return normalizeRow(row, numericFields, {
    nullEmptyNumbers: true,
  });
}

function normalizeSyncAuditRow(row) {
  return {
    amsId: stringOrNull(row.amsId) ?? "",
    source: stringOrNull(row.source) ?? "",
    hasData: booleanOrNull(row.hasData) ?? false,
    lastUpdated: timestampOrNull(row.lastUpdated),
    recordCount: integerOrNull(row.recordCount) ?? 0,
    notes: stringOrNull(row.notes),
  };
}

function normalizeRow(row, numericFields, options = {}) {
  const numericFieldSet = new Set(numericFields);

  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (numericFieldSet.has(key)) {
        const parsed = numberOrNull(value);
        return [key, options.nullEmptyNumbers ? parsed : parsed ?? 0];
      }

      return [key, stringOrNull(value) ?? ""];
    }),
  );
}
