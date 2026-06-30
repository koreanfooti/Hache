create table if not exists public.ams_vald_nordbord_tests (
  test_id text primary key,
  ams_id text,
  tenant_id text,
  vald_profile_id text,
  modified_date_utc timestamptz,
  test_date_utc timestamptz,
  test_type_id text,
  test_type_name text,
  notes text,
  device text,
  left_max_force numeric,
  right_max_force numeric,
  left_avg_force numeric,
  right_avg_force numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_vald_nordbord_tests_ams_id_idx
  on public.ams_vald_nordbord_tests (ams_id);

create index if not exists ams_vald_nordbord_tests_test_date_utc_idx
  on public.ams_vald_nordbord_tests (test_date_utc);

create table if not exists public.ams_vald_nordbord_metrics (
  test_id text primary key,
  ams_id text,
  tenant_id text,
  vald_profile_id text,
  athlete_id text,
  left_max_force_per_kg numeric,
  right_max_force_per_kg numeric,
  left_avg_force_per_kg numeric,
  right_avg_force_per_kg numeric,
  left_avg_time_to_max_force_seconds numeric,
  right_avg_time_to_max_force_seconds numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_vald_nordbord_metrics_ams_id_idx
  on public.ams_vald_nordbord_metrics (ams_id);

create table if not exists public.ams_sync_audit (
  import_key text primary key,
  ams_id text,
  source text,
  has_data boolean,
  last_updated timestamptz,
  record_count integer,
  notes text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_sync_audit_ams_id_idx
  on public.ams_sync_audit (ams_id);

create index if not exists ams_sync_audit_source_idx
  on public.ams_sync_audit (source);

alter table public.ams_vald_nordbord_tests enable row level security;
alter table public.ams_vald_nordbord_metrics enable row level security;
alter table public.ams_sync_audit enable row level security;
