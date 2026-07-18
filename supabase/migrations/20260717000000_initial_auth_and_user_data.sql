-- Apex v0.9.0 — autenticação, perfis e sincronização por usuário

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_module_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_key text not null check (storage_key like 'apex-%'),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, storage_key)
);

create index if not exists user_module_state_user_updated_idx
  on public.user_module_state (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.user_module_state enable row level security;

revoke all on public.profiles from anon;
revoke all on public.user_module_state from anon;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_module_state to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

create policy "module_state_select_own"
  on public.user_module_state for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "module_state_insert_own"
  on public.user_module_state for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "module_state_update_own"
  on public.user_module_state for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "module_state_delete_own"
  on public.user_module_state for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_module_state_set_updated_at on public.user_module_state;
create trigger user_module_state_set_updated_at
before update on public.user_module_state
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
