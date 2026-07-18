-- APEX LAUNCH READINESS — v0.55.0–v0.60.0 — REVISAO SQL 1
-- Rate limiting transacional para rotas server-side sensiveis.

create table if not exists public.api_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action ~ '^[a-z0-9:_-]{3,80}$'),
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count between 1 and 100000),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, action, window_start)
);

create index if not exists api_rate_limits_expiry_idx
  on public.api_rate_limits (expires_at);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;

drop trigger if exists api_rate_limits_set_updated_at on public.api_rate_limits;
create trigger api_rate_limits_set_updated_at before update on public.api_rate_limits
  for each row execute function public.set_updated_at();

create or replace function public.consume_api_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz;
  allowed boolean;
begin
  if p_user_id is null then raise exception 'User is required'; end if;
  if p_action !~ '^[a-z0-9:_-]{3,80}$' then raise exception 'Invalid rate limit action'; end if;
  if p_limit < 1 or p_limit > 1000 then raise exception 'Invalid rate limit'; end if;
  if p_window_seconds < 10 or p_window_seconds > 86400 then raise exception 'Invalid rate limit window'; end if;

  current_window := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);

  insert into public.api_rate_limits (user_id, action, window_start, request_count, expires_at)
  values (p_user_id, p_action, current_window, 1, current_window + make_interval(secs => p_window_seconds))
  on conflict (user_id, action, window_start) do update
  set request_count = public.api_rate_limits.request_count + 1,
      expires_at = excluded.expires_at,
      updated_at = now()
  where public.api_rate_limits.request_count < p_limit
  returning true into allowed;

  if random() < 0.02 then
    delete from public.api_rate_limits where expires_at < now() - interval '1 day';
  end if;
  return coalesce(allowed, false);
end;
$$;

revoke all on function public.consume_api_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(uuid, text, integer, integer) to service_role;

comment on table public.api_rate_limits is 'Contadores transacionais privados para limitar APIs server-side; sem acesso do navegador.';
