-- Apex v0.10.0 — Perfil completo, histórico de peso e avatar privado
-- Idempotente e não destrutiva: preserva tabelas e dados existentes.

alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists biological_sex text;
alter table public.profiles add column if not exists height_cm numeric(5,2);
alter table public.profiles add column if not exists weight_kg numeric(6,2);
alter table public.profiles add column if not exists body_fat_percentage numeric(4,1);
alter table public.profiles add column if not exists goal text;
alter table public.profiles add column if not exists target_weight_kg numeric(6,2);
alter table public.profiles add column if not exists activity_level_suggested text;
alter table public.profiles add column if not exists activity_level_selected text;
alter table public.profiles add column if not exists activity_assessment jsonb;
alter table public.profiles add column if not exists training_frequency smallint;
alter table public.profiles add column if not exists goal_pace text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_biological_sex_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_biological_sex_check check (biological_sex is null or biological_sex in ('male', 'female'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_height_cm_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_height_cm_check check (height_cm is null or height_cm between 100 and 250);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_weight_kg_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_weight_kg_check check (weight_kg is null or weight_kg between 30 and 350);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_body_fat_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_body_fat_check check (body_fat_percentage is null or body_fat_percentage between 2 and 75);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_goal_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_goal_check check (goal is null or goal in ('lose_weight', 'maintain_weight', 'gain_muscle'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_target_weight_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_target_weight_check check (target_weight_kg is null or target_weight_kg between 30 and 350);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_activity_suggested_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_activity_suggested_check check (activity_level_suggested is null or activity_level_suggested in ('sedentary', 'light', 'moderate', 'high'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_activity_selected_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_activity_selected_check check (activity_level_selected is null or activity_level_selected in ('sedentary', 'light', 'moderate', 'high'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_training_frequency_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_training_frequency_check check (training_frequency is null or training_frequency between 0 and 14);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_goal_pace_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_goal_pace_check check (goal_pace is null or goal_pace in ('conservative', 'moderate', 'accelerated'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_avatar_path_check' and conrelid = 'public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_avatar_path_check check (avatar_path is null or avatar_path like id::text || '/%');
  end if;
end
$$;

create index if not exists profiles_updated_at_idx on public.profiles (updated_at desc);

create table if not exists public.weight_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_kg numeric(6,2) not null check (weight_kg between 30 and 350),
  recorded_at date not null default current_date,
  source text not null default 'profile' check (source in ('profile', 'dashboard', 'progress', 'integration')),
  operation_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, operation_id)
);

create index if not exists weight_history_user_recorded_idx on public.weight_history (user_id, recorded_at desc, created_at desc);

alter table public.profiles enable row level security;
alter table public.weight_history enable row level security;

revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;
revoke all on public.weight_history from anon;
grant select, insert, update, delete on public.weight_history to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists "weight_history_select_own" on public.weight_history;
create policy "weight_history_select_own" on public.weight_history for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "weight_history_insert_own" on public.weight_history;
create policy "weight_history_insert_own" on public.weight_history for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "weight_history_update_own" on public.weight_history;
create policy "weight_history_update_own" on public.weight_history for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "weight_history_delete_own" on public.weight_history;
create policy "weight_history_delete_own" on public.weight_history for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.record_weight(
  p_weight_kg numeric,
  p_source text default 'profile',
  p_recorded_at date default current_date,
  p_operation_id uuid default gen_random_uuid()
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if p_weight_kg < 30 or p_weight_kg > 350 then raise exception 'Weight outside accepted range'; end if;
  if p_source not in ('profile', 'dashboard', 'progress', 'integration') then raise exception 'Invalid weight source'; end if;

  insert into public.weight_history (user_id, weight_kg, recorded_at, source, operation_id)
  values ((select auth.uid()), p_weight_kg, p_recorded_at, p_source, p_operation_id)
  on conflict (user_id, operation_id) do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 0 then return; end if;

  update public.profiles set weight_kg = p_weight_kg where id = (select auth.uid());
end;
$$;

revoke all on function public.record_weight(numeric, text, date, uuid) from public, anon;
grant execute on function public.record_weight(numeric, text, date, uuid) to authenticated;

create or replace function public.save_physical_data(
  p_biological_sex text,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_body_fat_percentage numeric default null,
  p_source text default 'profile',
  p_recorded_at date default current_date,
  p_operation_id uuid default gen_random_uuid()
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_weight numeric;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if p_biological_sex not in ('male', 'female') then raise exception 'Invalid biological sex'; end if;
  if p_height_cm < 100 or p_height_cm > 250 then raise exception 'Height outside accepted range'; end if;
  if p_body_fat_percentage is not null and (p_body_fat_percentage < 2 or p_body_fat_percentage > 75) then raise exception 'Body fat outside accepted range'; end if;

  select weight_kg into previous_weight from public.profiles where id = (select auth.uid()) for update;
  if previous_weight is distinct from p_weight_kg then
    perform public.record_weight(p_weight_kg, p_source, p_recorded_at, p_operation_id);
  end if;

  update public.profiles
  set biological_sex = p_biological_sex,
      height_cm = p_height_cm,
      weight_kg = p_weight_kg,
      body_fat_percentage = p_body_fat_percentage
  where id = (select auth.uid());
end;
$$;

revoke all on function public.save_physical_data(text, numeric, numeric, numeric, text, date, uuid) from public, anon;
grant execute on function public.save_physical_data(text, numeric, numeric, numeric, text, date, uuid) to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_select_own" on storage.objects;
create policy "avatars_select_own" on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
