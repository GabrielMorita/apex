-- Apex v0.14.0 — Consumo alimentar e progresso diário
-- Idempotente e não destrutiva. A existência do registro indica refeição consumida.

create table if not exists public.diet_consumption_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_week_start date not null,
  consumed_date date not null,
  meal_order smallint not null,
  meal_name text not null,
  items_snapshot jsonb not null,
  calories numeric(7,1) not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  consumed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diet_consumption_week_start_check check (extract(isodow from plan_week_start) = 1),
  constraint diet_consumption_date_check check (consumed_date between plan_week_start and plan_week_start + 6),
  constraint diet_consumption_meal_order_check check (meal_order between 0 and 5),
  constraint diet_consumption_items_check check (case when jsonb_typeof(items_snapshot) = 'array' then jsonb_array_length(items_snapshot) > 0 else false end),
  constraint diet_consumption_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0),
  unique (user_id, consumed_date, meal_order)
);

create index if not exists diet_consumption_user_week_idx on public.diet_consumption_entries (user_id, plan_week_start, consumed_date, meal_order);
create index if not exists diet_consumption_user_consumed_at_idx on public.diet_consumption_entries (user_id, consumed_at desc);

alter table public.diet_consumption_entries enable row level security;

revoke all on public.diet_consumption_entries from anon;
grant select, insert, update, delete on public.diet_consumption_entries to authenticated;

drop policy if exists "diet_consumption_own" on public.diet_consumption_entries;
create policy "diet_consumption_own" on public.diet_consumption_entries
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists diet_consumption_set_updated_at on public.diet_consumption_entries;
create trigger diet_consumption_set_updated_at
before update on public.diet_consumption_entries
for each row execute function public.set_updated_at();

create or replace function public.set_diet_meal_consumption(
  p_plan_week_start date,
  p_consumed_date date,
  p_meal_order smallint,
  p_meal_name text,
  p_items_snapshot jsonb,
  p_calories numeric,
  p_protein_g numeric,
  p_carbs_g numeric,
  p_fat_g numeric,
  p_consumed boolean
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
  if extract(isodow from p_plan_week_start) <> 1 then raise exception 'plan_week_start must be a Monday'; end if;
  if p_consumed_date not between p_plan_week_start and p_plan_week_start + 6 then raise exception 'consumed_date is outside the plan week'; end if;
  if p_meal_order not between 0 and 5 then raise exception 'Invalid meal order'; end if;

  if p_consumed is not true then
    delete from public.diet_consumption_entries
    where user_id = current_user_id and consumed_date = p_consumed_date and meal_order = p_meal_order;
    return;
  end if;

  if coalesce(jsonb_typeof(p_items_snapshot), 'null') <> 'array' then
    raise exception 'Consumed meal items must be a JSON array';
  end if;
  if jsonb_array_length(p_items_snapshot) < 1 then
    raise exception 'A consumed meal must contain at least one item';
  end if;
  if p_calories < 0 or p_protein_g < 0 or p_carbs_g < 0 or p_fat_g < 0 then
    raise exception 'Nutrients cannot be negative';
  end if;

  insert into public.diet_consumption_entries (
    user_id, plan_week_start, consumed_date, meal_order, meal_name, items_snapshot,
    calories, protein_g, carbs_g, fat_g, consumed_at
  ) values (
    current_user_id, p_plan_week_start, p_consumed_date, p_meal_order, p_meal_name,
    p_items_snapshot, p_calories, p_protein_g, p_carbs_g, p_fat_g, now()
  )
  on conflict (user_id, consumed_date, meal_order) do update set
    plan_week_start = excluded.plan_week_start,
    meal_name = excluded.meal_name,
    items_snapshot = excluded.items_snapshot,
    calories = excluded.calories,
    protein_g = excluded.protein_g,
    carbs_g = excluded.carbs_g,
    fat_g = excluded.fat_g,
    consumed_at = excluded.consumed_at;
end;
$$;

revoke all on function public.set_diet_meal_consumption(date, date, smallint, text, jsonb, numeric, numeric, numeric, numeric, boolean) from public, anon;
grant execute on function public.set_diet_meal_consumption(date, date, smallint, text, jsonb, numeric, numeric, numeric, numeric, boolean) to authenticated;
