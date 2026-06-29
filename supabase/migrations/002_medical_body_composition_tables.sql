create table if not exists public.ams_injury_history (
  injury_id text primary key,
  ams_id text,
  player_name text,
  normalized_player_name text,
  injury_type text,
  injury text,
  body_region text,
  laterality text,
  cause text,
  biomechanical_process text,
  start_date date,
  end_date date,
  rehab_days numeric,
  excluded_days numeric,
  readaptation_days numeric,
  total_days_lost numeric,
  map_x numeric,
  map_y numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_injury_history_ams_id_idx
  on public.ams_injury_history (ams_id);

create index if not exists ams_injury_history_player_name_idx
  on public.ams_injury_history (player_name);

create index if not exists ams_injury_history_start_date_idx
  on public.ams_injury_history (start_date);

create table if not exists public.ams_body_composition (
  import_key text primary key,
  source_category text,
  player_id text,
  player_name text,
  birth_date date,
  position text,
  test_date date,
  age_years numeric,
  weight_kg numeric,
  height_cm numeric,
  seated_height_cm numeric,
  bmi numeric,
  adipose_kg numeric,
  muscle_kg numeric,
  residual_kg numeric,
  bone_kg numeric,
  skinfold_6 numeric,
  basal_kcal numeric,
  rest_kcal numeric,
  light_kcal numeric,
  moderate_kcal numeric,
  match_kcal numeric,
  waist_cm numeric,
  hip_cm numeric,
  chest_cm numeric,
  arm_cm numeric,
  thigh_cm numeric,
  calf_cm numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_body_composition_source_category_idx
  on public.ams_body_composition (source_category);

create index if not exists ams_body_composition_player_id_idx
  on public.ams_body_composition (player_id);

create index if not exists ams_body_composition_test_date_idx
  on public.ams_body_composition (test_date);

alter table public.ams_injury_history enable row level security;
alter table public.ams_body_composition enable row level security;
