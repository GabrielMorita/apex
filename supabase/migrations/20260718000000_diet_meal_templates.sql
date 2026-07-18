-- Apex v0.23.0 — Modelos de refeições reutilizáveis
-- Modelos privados, calculados no servidor e reaplicáveis entre semanas.

create table if not exists public.diet_meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name_pt text not null,
  item_count smallint not null,
  calories numeric(7,1) not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diet_meal_templates_owner_uid unique (id, user_id),
  constraint diet_meal_templates_name_check check (char_length(btrim(name_pt)) between 2 and 80),
  constraint diet_meal_templates_item_count_check check (item_count between 1 and 13),
  constraint diet_meal_templates_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0)
);

create unique index if not exists diet_meal_templates_user_active_name_uidx
  on public.diet_meal_templates (user_id, lower(name_pt))
  where is_active;

create index if not exists diet_meal_templates_user_updated_idx
  on public.diet_meal_templates (user_id, updated_at desc);

create table if not exists public.diet_meal_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null references public.food_catalog(id),
  food_name_snapshot text not null,
  serving_label_snapshot text not null,
  grams numeric(7,1) not null,
  calories numeric(7,1) not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  item_order smallint not null,
  created_at timestamptz not null default now(),
  constraint diet_meal_template_items_template_owner_fk foreign key (template_id, user_id) references public.diet_meal_templates(id, user_id) on delete cascade,
  constraint diet_meal_template_items_template_food_uid unique (template_id, food_id),
  constraint diet_meal_template_items_template_order_uid unique (template_id, item_order),
  constraint diet_meal_template_items_grams_check check (grams > 0 and grams <= 1000),
  constraint diet_meal_template_items_order_check check (item_order between 0 and 12),
  constraint diet_meal_template_items_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0)
);

create index if not exists diet_meal_template_items_user_template_idx
  on public.diet_meal_template_items (user_id, template_id, item_order);

alter table public.diet_meal_templates enable row level security;
alter table public.diet_meal_template_items enable row level security;

revoke all on public.diet_meal_templates from anon, authenticated;
revoke all on public.diet_meal_template_items from anon, authenticated;
grant select on public.diet_meal_templates to authenticated;
grant select on public.diet_meal_template_items to authenticated;

drop policy if exists "diet_meal_templates_select_own" on public.diet_meal_templates;
create policy "diet_meal_templates_select_own"
  on public.diet_meal_templates for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_templates_insert_own" on public.diet_meal_templates;
create policy "diet_meal_templates_insert_own"
  on public.diet_meal_templates for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_templates_update_own" on public.diet_meal_templates;
create policy "diet_meal_templates_update_own"
  on public.diet_meal_templates for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_templates_delete_own" on public.diet_meal_templates;
create policy "diet_meal_templates_delete_own"
  on public.diet_meal_templates for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_template_items_select_own" on public.diet_meal_template_items;
create policy "diet_meal_template_items_select_own"
  on public.diet_meal_template_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_template_items_insert_own" on public.diet_meal_template_items;
create policy "diet_meal_template_items_insert_own"
  on public.diet_meal_template_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_template_items_update_own" on public.diet_meal_template_items;
create policy "diet_meal_template_items_update_own"
  on public.diet_meal_template_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_template_items_delete_own" on public.diet_meal_template_items;
create policy "diet_meal_template_items_delete_own"
  on public.diet_meal_template_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop trigger if exists diet_meal_templates_set_updated_at on public.diet_meal_templates;
create trigger diet_meal_templates_set_updated_at
before update on public.diet_meal_templates
for each row execute function public.set_updated_at();

create or replace function public.save_diet_meal_template(p_name_pt text, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_template_id uuid := gen_random_uuid();
  v_item jsonb;
  v_item_order bigint;
  v_food_id text;
  v_grams numeric;
  v_food public.food_catalog%rowtype;
  v_seen_food_ids text[] := '{}'::text[];
  v_calories numeric := 0;
  v_protein numeric := 0;
  v_carbs numeric := 0;
  v_fat numeric := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sessão inválida.';
  end if;
  if char_length(btrim(coalesce(p_name_pt, ''))) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'Nome do modelo inválido.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'Itens do modelo inválidos.';
  end if;
  if jsonb_array_length(p_items) not between 1 and 13 then
    raise exception using errcode = '22023', message = 'Use entre 1 e 13 itens.';
  end if;

  for v_item, v_item_order in
    select value, ordinality - 1 from jsonb_array_elements(p_items) with ordinality
  loop
    v_food_id := v_item ->> 'food_id';
    v_grams := (v_item ->> 'grams')::numeric;
    if v_food_id is null or v_grams is null or v_grams <= 0 or v_grams > 1000 then
      raise exception using errcode = '22023', message = 'Item do modelo inválido.';
    end if;
    if v_food_id = any(v_seen_food_ids) then
      raise exception using errcode = '22023', message = 'Um alimento foi incluído mais de uma vez.';
    end if;
    select * into v_food
    from public.food_catalog food
    where food.id = v_food_id
      and food.is_active
      and (
        (food.source_type = 'reference' and food.user_id is null)
        or (food.source_type = 'custom' and food.user_id = v_user_id)
      );
    if not found then
      raise exception using errcode = '42501', message = 'Um alimento do modelo está indisponível para esta conta.';
    end if;
    v_seen_food_ids := array_append(v_seen_food_ids, v_food_id);
    v_calories := v_calories + v_food.calories * v_grams / 100;
    v_protein := v_protein + v_food.protein_g * v_grams / 100;
    v_carbs := v_carbs + v_food.carbs_g * v_grams / 100;
    v_fat := v_fat + v_food.fat_g * v_grams / 100;
  end loop;

  insert into public.diet_meal_templates (
    id, user_id, name_pt, item_count, calories, protein_g, carbs_g, fat_g
  ) values (
    v_template_id, v_user_id, btrim(p_name_pt), jsonb_array_length(p_items),
    round(v_calories, 1), round(v_protein, 1), round(v_carbs, 1), round(v_fat, 1)
  );

  for v_item, v_item_order in
    select value, ordinality - 1 from jsonb_array_elements(p_items) with ordinality
  loop
    v_food_id := v_item ->> 'food_id';
    v_grams := (v_item ->> 'grams')::numeric;
    select * into v_food from public.food_catalog where id = v_food_id;
    insert into public.diet_meal_template_items (
      template_id, user_id, food_id, food_name_snapshot, serving_label_snapshot,
      grams, calories, protein_g, carbs_g, fat_g, item_order
    ) values (
      v_template_id, v_user_id, v_food.id, v_food.name_pt, v_food.serving_label,
      v_grams, round(v_food.calories * v_grams / 100, 1),
      round(v_food.protein_g * v_grams / 100, 1), round(v_food.carbs_g * v_grams / 100, 1),
      round(v_food.fat_g * v_grams / 100, 1), v_item_order
    );
  end loop;

  return v_template_id;
end;
$$;

create or replace function public.archive_diet_meal_template(p_template_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sessão inválida.';
  end if;
  update public.diet_meal_templates
    set is_active = false
    where id = p_template_id and user_id = v_user_id and is_active;
  if not found then
    raise exception using errcode = '42501', message = 'Modelo não encontrado para esta conta.';
  end if;
end;
$$;

revoke all on function public.save_diet_meal_template(text, jsonb) from public;
revoke all on function public.archive_diet_meal_template(uuid) from public;
grant execute on function public.save_diet_meal_template(text, jsonb) to authenticated;
grant execute on function public.archive_diet_meal_template(uuid) to authenticated;

