-- Apex v0.18.0 — Alimentos favoritos por usuário
-- Idempotente e não destrutiva. Alimentos recentes continuam derivados do consumo real.

create table if not exists public.diet_food_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null references public.food_catalog(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

create index if not exists diet_food_favorites_user_created_idx
  on public.diet_food_favorites (user_id, created_at desc);

alter table public.diet_food_favorites enable row level security;

revoke all on public.diet_food_favorites from anon;
grant select, insert, delete on public.diet_food_favorites to authenticated;

drop policy if exists "diet_food_favorites_select_own" on public.diet_food_favorites;
create policy "diet_food_favorites_select_own"
  on public.diet_food_favorites for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_food_favorites_insert_own" on public.diet_food_favorites;
create policy "diet_food_favorites_insert_own"
  on public.diet_food_favorites for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.food_catalog food
      where food.id = food_id
        and food.is_active
        and (
          (food.source_type = 'reference' and food.user_id is null)
          or (food.source_type = 'custom' and food.user_id = (select auth.uid()))
        )
    )
  );

drop policy if exists "diet_food_favorites_delete_own" on public.diet_food_favorites;
create policy "diet_food_favorites_delete_own"
  on public.diet_food_favorites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

