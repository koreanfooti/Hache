import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BodyCompApiPayload,
  BodyCompRow,
  ExternalTestAssessmentRow,
  ExternalTestMetricRow,
  ExternalTestScoringCriterionRow,
  FmsAssessmentRow,
  FmsExerciseScoreRow,
  InjuryApiPayload,
  InjuryRow,
  PlayerHistoryApiPayload,
  MobilityScreenAssessmentRow,
  MobilityScreenMetricRow,
  MusculoskeletalScreenAssessmentRow,
  MusculoskeletalScreenMetricRow,
  MusculoskeletalScreenScoringCriterionRow,
  PlayerMasterApiPayload,
  PlayerMasterRow,
  PlayerMatchHistoryRow,
  PlayerSeasonHistoryRow,
  RehabServicesApiPayload,
  RehabServiceRow,
  SyncAuditApiPayload,
  SyncAuditRow,
  TestingApiPayload,
  ValdNordbordApiPayload,
  ValdNordbordMetricRow,
  ValdNordbordTestRow,
  YBalanceAssessmentRow,
  YBalanceMetricRow,
} from "@/lib/ams/types";
import { createAmsSupabaseServerClient } from "./supabase";

const cacheSeconds = 60;
const pageSize = 1000;

export async function loadInjuryHistoryFromSupabase(): Promise<InjuryApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const result = await loadPayloadRows<InjuryRow>(supabase, "ams_injury_history", "start_date");
    if (!result.rows.length) return null;

    return {
      rows: result.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount: result.count,
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase injury source unavailable.", error);
    return null;
  }
}

export async function loadBodyCompositionFromSupabase(): Promise<BodyCompApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const result = await loadPayloadRows<BodyCompRow>(supabase, "ams_body_composition", "test_date");
    if (!result.rows.length) return null;

    return {
      rows: result.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount: result.count,
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase body composition source unavailable.", error);
    return null;
  }
}

export async function loadPlayerMasterFromSupabase(): Promise<PlayerMasterApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const result = await loadPayloadRows<PlayerMasterRow>(supabase, "ams_players_master", "display_name", true);
    if (!result.rows.length) return null;

    return {
      rows: result.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount: result.count,
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase player master source unavailable.", error);
    return null;
  }
}

export async function loadTestingFromSupabase(): Promise<TestingApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const [
      fms,
      fmsExerciseScores,
      yBalance,
      yBalanceMetrics,
      externalTestAssessments,
      externalTestMetrics,
      externalTestScoringCriteria,
      mobilityScreenAssessments,
      mobilityScreenMetrics,
      musculoskeletalScreenAssessments,
      musculoskeletalScreenMetrics,
      musculoskeletalScreenScoringCriteria,
    ] = await Promise.all([
      loadPayloadRows<FmsAssessmentRow>(supabase, "ams_fms_assessments", "date_iso"),
      loadPayloadRows<FmsExerciseScoreRow>(supabase, "ams_fms_exercise_scores", "date_iso"),
      loadPayloadRows<YBalanceAssessmentRow>(supabase, "ams_y_balance_assessments", "date_iso"),
      loadPayloadRows<YBalanceMetricRow>(supabase, "ams_y_balance_metrics", "date_iso"),
      loadPayloadRows<ExternalTestAssessmentRow>(supabase, "ams_external_test_assessments", "date_iso"),
      loadPayloadRows<ExternalTestMetricRow>(supabase, "ams_external_test_metrics", "date_iso"),
      loadPayloadRows<ExternalTestScoringCriterionRow>(supabase, "ams_external_test_scoring_criteria", "test", true),
      loadPayloadRows<MobilityScreenAssessmentRow>(supabase, "ams_mobility_screen_assessments", "date_iso"),
      loadPayloadRows<MobilityScreenMetricRow>(supabase, "ams_mobility_screen_metrics", "date_iso"),
      loadPayloadRows<MusculoskeletalScreenAssessmentRow>(supabase, "ams_musculoskeletal_screen_assessments", "date_iso"),
      loadPayloadRows<MusculoskeletalScreenMetricRow>(supabase, "ams_musculoskeletal_screen_metrics", "date_iso"),
      loadPayloadRows<MusculoskeletalScreenScoringCriterionRow>(supabase, "ams_musculoskeletal_screen_scoring_criteria", "metric_key", true),
    ]);
    const rowCount =
      fms.count
      + fmsExerciseScores.count
      + yBalance.count
      + yBalanceMetrics.count
      + externalTestAssessments.count
      + externalTestMetrics.count
      + externalTestScoringCriteria.count
      + mobilityScreenAssessments.count
      + mobilityScreenMetrics.count
      + musculoskeletalScreenAssessments.count
      + musculoskeletalScreenMetrics.count
      + musculoskeletalScreenScoringCriteria.count;
    if (!rowCount) return null;

    return {
      fms: fms.rows,
      fmsExerciseScores: fmsExerciseScores.rows,
      yBalance: yBalance.rows,
      yBalanceMetrics: yBalanceMetrics.rows,
      externalTestAssessments: externalTestAssessments.rows,
      externalTestMetrics: externalTestMetrics.rows,
      externalTestScoringCriteria: externalTestScoringCriteria.rows,
      mobilityScreenAssessments: mobilityScreenAssessments.rows,
      mobilityScreenMetrics: mobilityScreenMetrics.rows,
      musculoskeletalScreenAssessments: musculoskeletalScreenAssessments.rows,
      musculoskeletalScreenMetrics: musculoskeletalScreenMetrics.rows,
      musculoskeletalScreenScoringCriteria: musculoskeletalScreenScoringCriteria.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount,
        rowCounts: {
          fms: fms.count,
          fmsExerciseScores: fmsExerciseScores.count,
          yBalance: yBalance.count,
          yBalanceMetrics: yBalanceMetrics.count,
          externalTestAssessments: externalTestAssessments.count,
          externalTestMetrics: externalTestMetrics.count,
          externalTestScoringCriteria: externalTestScoringCriteria.count,
          mobilityScreenAssessments: mobilityScreenAssessments.count,
          mobilityScreenMetrics: mobilityScreenMetrics.count,
          musculoskeletalScreenAssessments: musculoskeletalScreenAssessments.count,
          musculoskeletalScreenMetrics: musculoskeletalScreenMetrics.count,
          musculoskeletalScreenScoringCriteria: musculoskeletalScreenScoringCriteria.count,
        },
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase testing source unavailable.", error);
    return null;
  }
}

export async function loadRehabServicesFromSupabase(): Promise<RehabServicesApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const result = await loadPayloadRows<RehabServiceRow>(supabase, "ams_rehab_services_daily", "date_iso", true);
    if (!result.rows.length) return null;

    return {
      rows: result.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount: result.count,
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase rehab services source unavailable.", error);
    return null;
  }
}

export async function loadPlayerHistoryFromSupabase(): Promise<PlayerHistoryApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const [seasonHistory, matchHistory] = await Promise.all([
      loadPayloadRows<PlayerSeasonHistoryRow>(supabase, "ams_player_season_history", "season"),
      loadPayloadRows<PlayerMatchHistoryRow>(supabase, "ams_player_match_history", "date_iso"),
    ]);
    const rowCount = seasonHistory.count + matchHistory.count;
    if (!rowCount) return null;

    return {
      seasonHistory: seasonHistory.rows,
      matchHistory: matchHistory.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount,
        rowCounts: {
          seasonHistory: seasonHistory.count,
          matchHistory: matchHistory.count,
        },
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase player history source unavailable.", error);
    return null;
  }
}

export async function loadValdNordbordFromSupabase(): Promise<ValdNordbordApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const [tests, metrics] = await Promise.all([
      loadPayloadRows<ValdNordbordTestRow>(supabase, "ams_vald_nordbord_tests", "test_date_utc", true),
      loadPayloadRows<ValdNordbordMetricRow>(supabase, "ams_vald_nordbord_metrics", "test_id", true),
    ]);
    const rowCount = tests.count + metrics.count;
    if (!rowCount) return null;

    return {
      tests: tests.rows,
      metrics: metrics.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount,
        rowCounts: {
          tests: tests.count,
          metrics: metrics.count,
        },
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase VALD NordBord source unavailable.", error);
    return null;
  }
}

export async function loadSyncAuditFromSupabase(): Promise<SyncAuditApiPayload | null> {
  const supabase = createAmsSupabaseServerClient();
  if (!supabase) return null;

  try {
    const result = await loadPayloadRows<SyncAuditRow>(supabase, "ams_sync_audit", "ams_id", true);
    if (!result.rows.length) return null;

    return {
      rows: result.rows,
      meta: {
        sourceLabel: "Supabase",
        lastSynced: new Date().toISOString(),
        rowCount: result.count,
        cacheSeconds,
      },
    };
  } catch (error) {
    console.warn("Supabase sync audit source unavailable.", error);
    return null;
  }
}

async function loadPayloadRows<T>(
  supabase: SupabaseClient,
  table: string,
  orderColumn: string,
  ascending = false,
) {
  const rows: T[] = [];
  let totalCount = 0;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error, count } = await supabase
      .from(table)
      .select("payload", { count: "exact" })
      .order(orderColumn, { ascending })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const page = (data ?? []).map((row) => row.payload as T);
    rows.push(...page);
    totalCount = count ?? rows.length;
    if (page.length < pageSize) break;
  }

  return {
    count: totalCount,
    rows,
  };
}
