create table if not exists public.ams_rehab_services_daily (
  import_key text primary key,
  source text,
  source_url text,
  date_iso date,
  year integer,
  month integer,
  service_code text,
  service_name text,
  raw_service_name text,
  service_count numeric,
  raw_value text,
  note text,
  is_off_day boolean,
  source_row_number integer,
  source_column_number integer,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_rehab_services_daily_date_iso_idx
  on public.ams_rehab_services_daily (date_iso);

create index if not exists ams_rehab_services_daily_service_code_idx
  on public.ams_rehab_services_daily (service_code);

create table if not exists public.ams_player_season_history (
  import_key text primary key,
  ams_id text,
  source text,
  season text,
  tournament text,
  phase text,
  division text,
  club text,
  club_id integer,
  games_played numeric,
  minutes_played numeric,
  starts numeric,
  goals numeric,
  own_goals numeric,
  yellow_cards numeric,
  red_cards numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_player_season_history_ams_id_idx
  on public.ams_player_season_history (ams_id);

create index if not exists ams_player_season_history_season_idx
  on public.ams_player_season_history (season);

create table if not exists public.ams_player_match_history (
  import_key text primary key,
  ams_id text,
  source text,
  source_player_id text,
  season text,
  tournament text,
  phase text,
  jornada text,
  date_iso date,
  date_display text,
  local_team text,
  local_club_id integer,
  local_goals numeric,
  visitor_team text,
  visitor_club_id integer,
  visitor_goals numeric,
  venue text,
  status text,
  minutes numeric,
  starter text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_player_match_history_ams_id_idx
  on public.ams_player_match_history (ams_id);

create index if not exists ams_player_match_history_date_iso_idx
  on public.ams_player_match_history (date_iso);

alter table public.ams_rehab_services_daily enable row level security;
alter table public.ams_player_season_history enable row level security;
alter table public.ams_player_match_history enable row level security;
