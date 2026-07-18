-- Apex v0.19.0 — Marcações da lista de compras semanal
-- A lista é derivada do plano; somente o estado comprado é persistido.

create table if not exists public.diet_shopping_checks (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  food_id text not null references public.food_catalog(id) on delete cascade,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, week_start, food_id),
  constraint diet_shopping_checks_week_start_check check (extract(isodow from week_start) = 1)
);

create index if not exists diet_shopping_checks_user_week_idx
  on public.diet_shopping_checks (user_id, week_start, checked_at desc);

alter table public.diet_shopping_checks enable row level security;

revoke all on public.diet_shopping_checks from anon;
grant select, insert, delete on public.diet_shopping_checks to authenticated;

drop policy if exists "diet_shopping_checks_select_own" on public.diet_shopping_checks;
create policy "diet_shopping_checks_select_own"
  on public.diet_shopping_checks for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_shopping_checks_insert_own" on public.diet_shopping_checks;
create policy "diet_shopping_checks_insert_own"
  on public.diet_shopping_checks for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.food_catalog food
      where food.id = food_id
        and (
          (food.source_type = 'reference' and food.user_id is null and food.is_active)
          or (food.source_type = 'custom' and food.user_id = (select auth.uid()))
        )
    )
  );

drop policy if exists "diet_shopping_checks_delete_own" on public.diet_shopping_checks;
create policy "diet_shopping_checks_delete_own"
  on public.diet_shopping_checks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

