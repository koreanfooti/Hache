create table if not exists public.ams_players_master (
  ams_id text primary key,
  slug text,
  full_name text,
  display_name text,
  shirt_number integer,
  position text,
  nationality text,
  birth_date date,
  active_status text,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create table if not exists public.ams_gps_player_daily (
  import_key text primary key,
  team text,
  ams_id text,
  wimu_player_id text,
  wimu_team_id text,
  source_session_id text,
  session_date date,
  rollup_source_task text,
  clean_player_name text,
  source_player_name text,
  is_match boolean,
  minutes numeric,
  total_distance numeric,
  hsr_abs_distance numeric,
  sprint_distance numeric,
  max_speed_kmh numeric,
  player_load numeric,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_gps_player_daily_team_idx
  on public.ams_gps_player_daily (team);

create index if not exists ams_gps_player_daily_ams_id_idx
  on public.ams_gps_player_daily (ams_id);

create index if not exists ams_gps_player_daily_session_date_idx
  on public.ams_gps_player_daily (session_date);

create index if not exists ams_gps_player_daily_team_date_idx
  on public.ams_gps_player_daily (team, session_date);

create or replace view public.ams_gps_teams as
select distinct team
from public.ams_gps_player_daily
where team is not null and team <> ''
order by team;

alter table public.ams_players_master enable row level security;
alter table public.ams_gps_player_daily enable row level security;

