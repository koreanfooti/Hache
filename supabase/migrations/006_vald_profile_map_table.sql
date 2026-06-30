create table if not exists public.ams_vald_profile_map (
  vald_profile_id text primary key,
  ams_id text,
  tenant_id text,
  sync_id text,
  external_id text,
  match_method text,
  confidence numeric,
  review_required boolean,
  payload jsonb not null,
  imported_at timestamptz not null default now()
);

create index if not exists ams_vald_profile_map_ams_id_idx
  on public.ams_vald_profile_map (ams_id);

create index if not exists ams_vald_profile_map_tenant_id_idx
  on public.ams_vald_profile_map (tenant_id);

alter table public.ams_vald_profile_map enable row level security;
