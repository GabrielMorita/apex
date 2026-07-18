-- Apex v0.24.1 — sincronização atômica entre plano e consumo
-- Idempotente e não destrutiva. Atualiza o retrato consumido apenas quando ele já existe.

create or replace function public.save_weekly_diet_plan_and_sync_consumption(
  p_week_start date,
  p_generation_version text,
  p_targets_snapshot jsonb,
  p_preferences_snapshot jsonb,
  p_days jsonb,
  p_consumed_date date,
  p_meal_order smallint,
  p_meal_name text,
  p_items_snapshot jsonb,
  p_calories numeric,
  p_protein_g numeric,
  p_carbs_g numeric,
  p_fat_g numeric
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_plan_id uuid;
  should_sync_consumption boolean := false;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  perform 1
  from public.diet_consumption_entries
  where user_id = current_user_id
    and consumed_date = p_consumed_date
    and meal_order = p_meal_order
  for update;
  should_sync_consumption := found;

  select public.save_weekly_diet_plan(
    p_week_start,
    p_generation_version,
    p_targets_snapshot,
    p_preferences_snapshot,
    p_days
  ) into current_plan_id;

  if should_sync_consumption then
    perform public.set_diet_meal_consumption(
      p_week_start,
      p_consumed_date,
      p_meal_order,
      p_meal_name,
      p_items_snapshot,
      p_calories,
      p_protein_g,
      p_carbs_g,
      p_fat_g,
      true
    );
  end if;

  return current_plan_id;
end;
$$;

revoke all on function public.save_weekly_diet_plan_and_sync_consumption(date, text, jsonb, jsonb, jsonb, date, smallint, text, jsonb, numeric, numeric, numeric, numeric) from public, anon;
grant execute on function public.save_weekly_diet_plan_and_sync_consumption(date, text, jsonb, jsonb, jsonb, date, smallint, text, jsonb, numeric, numeric, numeric, numeric) to authenticated;
