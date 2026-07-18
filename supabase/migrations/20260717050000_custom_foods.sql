-- Apex v0.17.0 — Alimentos personalizados por usuário
-- Idempotente, não destrutiva e compatível com o catálogo TACO existente.

alter table public.food_catalog
  add column if not exists user_id uuid,
  add column if not exists source_type text not null default 'reference';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'food_catalog_user_fk') then
    alter table public.food_catalog
      add constraint food_catalog_user_fk foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'food_catalog_source_type_check') then
    alter table public.food_catalog
      add constraint food_catalog_source_type_check check (source_type in ('reference', 'custom'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'food_catalog_source_owner_check') then
    alter table public.food_catalog
      add constraint food_catalog_source_owner_check check (
        (source_type = 'reference' and user_id is null)
        or (source_type = 'custom' and user_id is not null and id like 'custom-%')
      );
  end if;
end;
$$;

update public.food_catalog
set source_type = 'reference'
where user_id is null and source_type <> 'reference';

create index if not exists food_catalog_user_active_idx
  on public.food_catalog (user_id, is_active, updated_at desc)
  where user_id is not null;

create unique index if not exists food_catalog_user_active_name_uidx
  on public.food_catalog (user_id, lower(name_pt))
  where user_id is not null and is_active;

alter table public.food_catalog enable row level security;

revoke all on public.food_catalog from anon;
grant select, insert, update, delete on public.food_catalog to authenticated;

drop policy if exists "food_catalog_read_authenticated" on public.food_catalog;
create policy "food_catalog_read_authenticated"
  on public.food_catalog for select
  to authenticated
  using (
    (source_type = 'reference' and user_id is null and is_active)
    or (source_type = 'custom' and (select auth.uid()) = user_id)
  );

drop policy if exists "food_catalog_insert_own_custom" on public.food_catalog;
create policy "food_catalog_insert_own_custom"
  on public.food_catalog for insert
  to authenticated
  with check (
    source_type = 'custom'
    and (select auth.uid()) = user_id
    and id like 'custom-%'
  );

drop policy if exists "food_catalog_update_own_custom" on public.food_catalog;
create policy "food_catalog_update_own_custom"
  on public.food_catalog for update
  to authenticated
  using (source_type = 'custom' and (select auth.uid()) = user_id)
  with check (source_type = 'custom' and (select auth.uid()) = user_id and id like 'custom-%');

drop policy if exists "food_catalog_delete_own_custom" on public.food_catalog;
create policy "food_catalog_delete_own_custom"
  on public.food_catalog for delete
  to authenticated
  using (source_type = 'custom' and (select auth.uid()) = user_id);
