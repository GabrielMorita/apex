-- Apex v0.12.0 — Fundação da Dieta
-- Idempotente e não destrutiva: cria preferências e metas nutricionais por usuário.

create table if not exists public.diet_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  health_eligibility_confirmed boolean not null default false,
  meal_count smallint not null,
  meal_times time[] not null,
  training_time text not null,
  dietary_pattern text not null,
  allergies text[] not null default '{}',
  restrictions text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  favorite_foods text[] not null default '{}',
  cooking_time_minutes smallint not null,
  budget_level text not null,
  variety_level text not null,
  meal_style text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diet_preferences_meal_count_check check (meal_count between 2 and 6),
  constraint diet_preferences_meal_times_check check (cardinality(meal_times) = meal_count),
  constraint diet_preferences_training_time_check check (training_time in ('morning', 'afternoon', 'evening', 'varies', 'none')),
  constraint diet_preferences_pattern_check check (dietary_pattern in ('omnivore', 'vegetarian', 'vegan', 'pescatarian')),
  constraint diet_preferences_allergies_check check (cardinality(allergies) <= 30),
  constraint diet_preferences_restrictions_check check (cardinality(restrictions) <= 30),
  constraint diet_preferences_disliked_check check (cardinality(disliked_foods) <= 30),
  constraint diet_preferences_favorite_check check (cardinality(favorite_foods) <= 30),
  constraint diet_preferences_cooking_time_check check (cooking_time_minutes between 0 and 240),
  constraint diet_preferences_budget_check check (budget_level in ('economical', 'moderate', 'flexible')),
  constraint diet_preferences_variety_check check (variety_level in ('varied', 'balanced', 'practical')),
  constraint diet_preferences_meal_style_check check (meal_style in ('simple', 'mixed', 'recipes'))
);

alter table public.diet_preferences add column if not exists health_eligibility_confirmed boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'diet_preferences_eligibility_check' and conrelid = 'public.diet_preferences'::regclass) then
    alter table public.diet_preferences add constraint diet_preferences_eligibility_check check (not onboarding_completed or health_eligibility_confirmed);
  end if;
end
$$;

create table if not exists public.nutrition_targets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  calories integer not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  source text not null default 'calculated',
  calculation_version text not null,
  calculation_inputs jsonb not null default '{}'::jsonb,
  is_provisional boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_targets_calories_check check (calories between 800 and 6000),
  constraint nutrition_targets_protein_check check (protein_g between 0 and 500),
  constraint nutrition_targets_carbs_check check (carbs_g between 0 and 1000),
  constraint nutrition_targets_fat_check check (fat_g between 0 and 500),
  constraint nutrition_targets_source_check check (source in ('calculated', 'manual'))
);

create index if not exists diet_preferences_updated_at_idx on public.diet_preferences (updated_at desc);
create index if not exists nutrition_targets_updated_at_idx on public.nutrition_targets (updated_at desc);

alter table public.diet_preferences enable row level security;
alter table public.nutrition_targets enable row level security;

revoke all on public.diet_preferences from anon;
grant select, insert, update, delete on public.diet_preferences to authenticated;
revoke all on public.nutrition_targets from anon;
grant select, insert, update, delete on public.nutrition_targets to authenticated;

drop policy if exists "diet_preferences_select_own" on public.diet_preferences;
create policy "diet_preferences_select_own" on public.diet_preferences for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "diet_preferences_insert_own" on public.diet_preferences;
create policy "diet_preferences_insert_own" on public.diet_preferences for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "diet_preferences_update_own" on public.diet_preferences;
create policy "diet_preferences_update_own" on public.diet_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "diet_preferences_delete_own" on public.diet_preferences;
create policy "diet_preferences_delete_own" on public.diet_preferences for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "nutrition_targets_select_own" on public.nutrition_targets;
create policy "nutrition_targets_select_own" on public.nutrition_targets for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "nutrition_targets_insert_own" on public.nutrition_targets;
create policy "nutrition_targets_insert_own" on public.nutrition_targets for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "nutrition_targets_update_own" on public.nutrition_targets;
create policy "nutrition_targets_update_own" on public.nutrition_targets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "nutrition_targets_delete_own" on public.nutrition_targets;
create policy "nutrition_targets_delete_own" on public.nutrition_targets for delete to authenticated using ((select auth.uid()) = user_id);

drop trigger if exists diet_preferences_set_updated_at on public.diet_preferences;
create trigger diet_preferences_set_updated_at before update on public.diet_preferences for each row execute function public.set_updated_at();

drop trigger if exists nutrition_targets_set_updated_at on public.nutrition_targets;
create trigger nutrition_targets_set_updated_at before update on public.nutrition_targets for each row execute function public.set_updated_at();

create or replace function public.save_diet_foundation(
  p_health_eligibility_confirmed boolean,
  p_meal_count smallint,
  p_meal_times time[],
  p_training_time text,
  p_dietary_pattern text,
  p_allergies text[],
  p_restrictions text[],
  p_disliked_foods text[],
  p_favorite_foods text[],
  p_cooking_time_minutes smallint,
  p_budget_level text,
  p_variety_level text,
  p_meal_style text,
  p_calories integer,
  p_protein_g numeric,
  p_carbs_g numeric,
  p_fat_g numeric,
  p_source text,
  p_calculation_version text,
  p_calculation_inputs jsonb,
  p_is_provisional boolean default true
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_health_eligibility_confirmed is not true then raise exception 'Health eligibility confirmation required'; end if;

  insert into public.diet_preferences (
    user_id, onboarding_completed, health_eligibility_confirmed, meal_count, meal_times, training_time,
    dietary_pattern, allergies, restrictions, disliked_foods, favorite_foods,
    cooking_time_minutes, budget_level, variety_level, meal_style
  ) values (
    current_user_id, true, p_health_eligibility_confirmed, p_meal_count, p_meal_times, p_training_time,
    p_dietary_pattern, coalesce(p_allergies, '{}'), coalesce(p_restrictions, '{}'),
    coalesce(p_disliked_foods, '{}'), coalesce(p_favorite_foods, '{}'),
    p_cooking_time_minutes, p_budget_level, p_variety_level, p_meal_style
  )
  on conflict (user_id) do update set
    onboarding_completed = excluded.onboarding_completed,
    health_eligibility_confirmed = excluded.health_eligibility_confirmed,
    meal_count = excluded.meal_count,
    meal_times = excluded.meal_times,
    training_time = excluded.training_time,
    dietary_pattern = excluded.dietary_pattern,
    allergies = excluded.allergies,
    restrictions = excluded.restrictions,
    disliked_foods = excluded.disliked_foods,
    favorite_foods = excluded.favorite_foods,
    cooking_time_minutes = excluded.cooking_time_minutes,
    budget_level = excluded.budget_level,
    variety_level = excluded.variety_level,
    meal_style = excluded.meal_style;

  insert into public.nutrition_targets (
    user_id, calories, protein_g, carbs_g, fat_g, source,
    calculation_version, calculation_inputs, is_provisional
  ) values (
    current_user_id, p_calories, p_protein_g, p_carbs_g, p_fat_g, p_source,
    p_calculation_version, coalesce(p_calculation_inputs, '{}'::jsonb), p_is_provisional
  )
  on conflict (user_id) do update set
    calories = excluded.calories,
    protein_g = excluded.protein_g,
    carbs_g = excluded.carbs_g,
    fat_g = excluded.fat_g,
    source = excluded.source,
    calculation_version = excluded.calculation_version,
    calculation_inputs = excluded.calculation_inputs,
    is_provisional = excluded.is_provisional;
end;
$$;

revoke all on function public.save_diet_foundation(boolean, smallint, time[], text, text, text[], text[], text[], text[], smallint, text, text, text, integer, numeric, numeric, numeric, text, text, jsonb, boolean) from public, anon;
grant execute on function public.save_diet_foundation(boolean, smallint, time[], text, text, text[], text[], text[], text[], smallint, text, text, text, integer, numeric, numeric, numeric, text, text, jsonb, boolean) to authenticated;
