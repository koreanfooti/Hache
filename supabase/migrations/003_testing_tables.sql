create table if not exists public.ams_fms_assessments (
  assessment_id text primary key,
  ams_id text,
  source_athlete_name text,
  external_id text,
  matched_athlete_name text,
  identity_match_confidence numeric,
  identity_match_method text,
  review_required boolean,
  date_iso date,
  test text,
  source_url text,
  total_score numeric,
  recomputed_total numeric,
  total_score_matches_exercises boolean,
  score_band text,
  risk_flag text,
  primary_finding_1 text,
  primary_finding_2 text,
  primary_finding_3 text,
  source_row_number integer,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_fms_assessments_ams_id_idx
  on public.ams_fms_assessments (ams_id);

create index if not exists ams_fms_assessments_date_iso_idx
  on public.ams_fms_assessments (date_iso);

create table if not exists public.ams_fms_exercise_scores (
  import_key text primary key,
  assessment_id text,
  ams_id text,
  source_athlete_name text,
  date_iso date,
  test text,
  exercise_key text,
  exercise_name text,
  point_score numeric,
  left_score numeric,
  right_score numeric,
  asymmetry_raw text,
  hierarchy_label text,
  hierarchy_rank numeric,
  exercise_tie_break_rank numeric,
  correction_priority_rank numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_fms_exercise_scores_assessment_id_idx
  on public.ams_fms_exercise_scores (assessment_id);

create index if not exists ams_fms_exercise_scores_ams_id_idx
  on public.ams_fms_exercise_scores (ams_id);

create table if not exists public.ams_y_balance_assessments (
  assessment_id text primary key,
  ams_id text,
  source_athlete_name text,
  external_id text,
  matched_athlete_name text,
  identity_match_confidence numeric,
  identity_match_method text,
  review_required boolean,
  date_iso date,
  test text,
  test_type text,
  source_url text,
  right_composite_percent numeric,
  left_composite_percent numeric,
  lowest_composite_percent numeric,
  anterior_asymmetry_cm numeric,
  composite_asymmetry_percent_abs numeric,
  asymmetry_raw text,
  score_band text,
  risk_flag text,
  primary_finding_1 text,
  primary_finding_2 text,
  primary_finding_3 text,
  source_row_number integer,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_y_balance_assessments_ams_id_idx
  on public.ams_y_balance_assessments (ams_id);

create index if not exists ams_y_balance_assessments_date_iso_idx
  on public.ams_y_balance_assessments (date_iso);

create table if not exists public.ams_y_balance_metrics (
  import_key text primary key,
  assessment_id text,
  ams_id text,
  source_athlete_name text,
  date_iso date,
  test text,
  test_type text,
  source_url text,
  side text,
  metric text,
  value numeric,
  unit text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_y_balance_metrics_assessment_id_idx
  on public.ams_y_balance_metrics (assessment_id);

create index if not exists ams_y_balance_metrics_ams_id_idx
  on public.ams_y_balance_metrics (ams_id);

alter table public.ams_fms_assessments enable row level security;
alter table public.ams_fms_exercise_scores enable row level security;
alter table public.ams_y_balance_assessments enable row level security;
alter table public.ams_y_balance_metrics enable row level security;
