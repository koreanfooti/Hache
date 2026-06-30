create table if not exists public.ams_external_test_assessments (
  assessment_id text primary key,
  ams_id text,
  source_athlete_name text,
  matched_athlete_name text,
  identity_match_confidence numeric,
  identity_match_method text,
  review_required boolean,
  date_iso date,
  test text,
  test_type text,
  source_url text,
  total_score numeric,
  recomputed_total numeric,
  score_band text,
  risk_flag text,
  flag_count integer,
  numeric_asymmetry_count integer,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_external_test_assessments_ams_id_idx
  on public.ams_external_test_assessments (ams_id);

create index if not exists ams_external_test_assessments_date_iso_idx
  on public.ams_external_test_assessments (date_iso);

create table if not exists public.ams_external_test_metrics (
  import_key text primary key,
  assessment_id text,
  ams_id text,
  source_athlete_name text,
  date_iso date,
  test text,
  test_type text,
  side text,
  metric text,
  value numeric,
  unit text,
  source_test text,
  exercise_key text,
  exercise_name text,
  point_score numeric,
  metric_key text,
  metric_name text,
  numeric_value numeric,
  flag text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_external_test_metrics_assessment_id_idx
  on public.ams_external_test_metrics (assessment_id);

create index if not exists ams_external_test_metrics_ams_id_idx
  on public.ams_external_test_metrics (ams_id);

create index if not exists ams_external_test_metrics_date_iso_idx
  on public.ams_external_test_metrics (date_iso);

create table if not exists public.ams_external_test_scoring_criteria (
  import_key text primary key,
  test text,
  type text,
  label text,
  range text,
  meaning text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create table if not exists public.ams_mobility_screen_assessments (
  assessment_id text primary key,
  ams_id text,
  source_athlete_name text,
  matched_athlete_name text,
  identity_match_confidence numeric,
  identity_match_method text,
  review_required boolean,
  date_iso date,
  test text,
  source_url text,
  flag_count integer,
  numeric_asymmetry_count integer,
  score_band text,
  risk_flag text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_mobility_screen_assessments_ams_id_idx
  on public.ams_mobility_screen_assessments (ams_id);

create index if not exists ams_mobility_screen_assessments_date_iso_idx
  on public.ams_mobility_screen_assessments (date_iso);

create table if not exists public.ams_mobility_screen_metrics (
  import_key text primary key,
  assessment_id text,
  ams_id text,
  source_athlete_name text,
  date_iso date,
  test text,
  metric_key text,
  metric_name text,
  side text,
  numeric_value numeric,
  unit text,
  flag text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_mobility_screen_metrics_assessment_id_idx
  on public.ams_mobility_screen_metrics (assessment_id);

create index if not exists ams_mobility_screen_metrics_ams_id_idx
  on public.ams_mobility_screen_metrics (ams_id);

create table if not exists public.ams_musculoskeletal_screen_assessments (
  assessment_id text primary key,
  ams_id text,
  source_athlete_name text,
  matched_athlete_name text,
  identity_match_confidence numeric,
  identity_match_method text,
  review_required boolean,
  date_iso date,
  test text,
  source_url text,
  populated_metric_count integer,
  flag_count integer,
  asymmetry_count integer,
  score_band text,
  risk_flag text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_musculoskeletal_screen_assessments_ams_id_idx
  on public.ams_musculoskeletal_screen_assessments (ams_id);

create table if not exists public.ams_musculoskeletal_screen_metrics (
  import_key text primary key,
  assessment_id text,
  ams_id text,
  source_athlete_name text,
  matched_athlete_name text,
  date_iso date,
  test text,
  domain text,
  metric_key text,
  metric_name text,
  side text,
  numeric_value numeric,
  unit text,
  ideal_rule text,
  is_ideal boolean,
  flag text,
  source_row_number integer,
  source_column_number integer,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_musculoskeletal_screen_metrics_assessment_id_idx
  on public.ams_musculoskeletal_screen_metrics (assessment_id);

create index if not exists ams_musculoskeletal_screen_metrics_ams_id_idx
  on public.ams_musculoskeletal_screen_metrics (ams_id);

create table if not exists public.ams_musculoskeletal_screen_scoring_criteria (
  import_key text primary key,
  test text,
  domain text,
  metric_key text,
  metric_name text,
  side text,
  ideal_rule text,
  unit text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

alter table public.ams_external_test_assessments enable row level security;
alter table public.ams_external_test_metrics enable row level security;
alter table public.ams_external_test_scoring_criteria enable row level security;
alter table public.ams_mobility_screen_assessments enable row level security;
alter table public.ams_mobility_screen_metrics enable row level security;
alter table public.ams_musculoskeletal_screen_assessments enable row level security;
alter table public.ams_musculoskeletal_screen_metrics enable row level security;
alter table public.ams_musculoskeletal_screen_scoring_criteria enable row level security;
