-- Apex v0.20.0 — Receitas e preparações pessoais
-- Cadastro privado, composição por ingredientes e publicação segura no catálogo pessoal.

create table if not exists public.diet_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name_pt text not null,
  category text not null,
  servings integer not null,
  yield_grams numeric(9,1) not null,
  preparation_minutes integer not null default 0,
  instructions text not null default '',
  dietary_patterns text[] not null default '{}'::text[],
  allergen_tags text[] not null default '{}'::text[],
  total_calories numeric(10,2) not null default 0,
  total_protein_g numeric(10,2) not null default 0,
  total_carbs_g numeric(10,2) not null default 0,
  total_fat_g numeric(10,2) not null default 0,
  total_fiber_g numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diet_recipes_owner_uid unique (id, user_id),
  constraint diet_recipes_name_check check (char_length(btrim(name_pt)) between 2 and 80),
  constraint diet_recipes_category_check check (category in ('grain', 'vegetable', 'fruit', 'fat', 'fish', 'meat', 'dairy', 'egg', 'legume')),
  constraint diet_recipes_servings_check check (servings between 1 and 100),
  constraint diet_recipes_yield_check check (yield_grams between 1 and 10000),
  constraint diet_recipes_preparation_check check (preparation_minutes between 0 and 1440),
  constraint diet_recipes_instructions_check check (char_length(instructions) <= 5000),
  constraint diet_recipes_patterns_check check (dietary_patterns <@ array['omnivore', 'vegetarian', 'vegan', 'pescatarian']::text[] and cardinality(dietary_patterns) > 0),
  constraint diet_recipes_nutrients_check check (total_calories >= 0 and total_protein_g >= 0 and total_carbs_g >= 0 and total_fat_g >= 0 and total_fiber_g >= 0)
);

create unique index if not exists diet_recipes_user_active_name_uidx
  on public.diet_recipes (user_id, lower(name_pt))
  where is_active;

create index if not exists diet_recipes_user_updated_idx
  on public.diet_recipes (user_id, updated_at desc);

create table if not exists public.diet_recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null references public.food_catalog(id),
  food_name_snapshot text not null,
  grams numeric(9,1) not null,
  calories numeric(10,2) not null,
  protein_g numeric(10,2) not null,
  carbs_g numeric(10,2) not null,
  fat_g numeric(10,2) not null,
  fiber_g numeric(10,2) not null default 0,
  item_order integer not null,
  created_at timestamptz not null default now(),
  constraint diet_recipe_items_recipe_owner_fk foreign key (recipe_id, user_id) references public.diet_recipes(id, user_id) on delete cascade,
  constraint diet_recipe_items_recipe_food_uid unique (recipe_id, food_id),
  constraint diet_recipe_items_recipe_order_uid unique (recipe_id, item_order),
  constraint diet_recipe_items_grams_check check (grams between 0.1 and 10000),
  constraint diet_recipe_items_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0 and fiber_g >= 0)
);

create index if not exists diet_recipe_items_user_recipe_idx
  on public.diet_recipe_items (user_id, recipe_id, item_order);

alter table public.food_catalog
  add column if not exists recipe_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'food_catalog_recipe_owner_fk') then
    alter table public.food_catalog
      add constraint food_catalog_recipe_owner_fk
      foreign key (recipe_id, user_id) references public.diet_recipes(id, user_id) on delete cascade;
  end if;
end;
$$;

create unique index if not exists food_catalog_recipe_uidx
  on public.food_catalog (recipe_id)
  where recipe_id is not null;

alter table public.diet_recipes enable row level security;
alter table public.diet_recipe_items enable row level security;

revoke all on public.diet_recipes from anon, authenticated;
revoke all on public.diet_recipe_items from anon, authenticated;
grant select on public.diet_recipes to authenticated;
grant select on public.diet_recipe_items to authenticated;

drop policy if exists "diet_recipes_select_own" on public.diet_recipes;
create policy "diet_recipes_select_own"
  on public.diet_recipes for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_recipes_insert_own" on public.diet_recipes;
create policy "diet_recipes_insert_own"
  on public.diet_recipes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_recipes_update_own" on public.diet_recipes;
create policy "diet_recipes_update_own"
  on public.diet_recipes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_recipes_delete_own" on public.diet_recipes;
create policy "diet_recipes_delete_own"
  on public.diet_recipes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_recipe_items_select_own" on public.diet_recipe_items;
create policy "diet_recipe_items_select_own"
  on public.diet_recipe_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diet_recipe_items_insert_own" on public.diet_recipe_items;
create policy "diet_recipe_items_insert_own"
  on public.diet_recipe_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_recipe_items_update_own" on public.diet_recipe_items;
create policy "diet_recipe_items_update_own"
  on public.diet_recipe_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "diet_recipe_items_delete_own" on public.diet_recipe_items;
create policy "diet_recipe_items_delete_own"
  on public.diet_recipe_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Alimentos comuns continuam editáveis pelo usuário. Linhas geradas por receitas
-- só podem ser modificadas pelas funções atômicas abaixo.
drop policy if exists "food_catalog_insert_own_custom" on public.food_catalog;
create policy "food_catalog_insert_own_custom"
  on public.food_catalog for insert
  to authenticated
  with check (
    source_type = 'custom'
    and (select auth.uid()) = user_id
    and id like 'custom-%'
    and recipe_id is null
  );

drop policy if exists "food_catalog_update_own_custom" on public.food_catalog;
create policy "food_catalog_update_own_custom"
  on public.food_catalog for update
  to authenticated
  using (source_type = 'custom' and (select auth.uid()) = user_id and recipe_id is null)
  with check (source_type = 'custom' and (select auth.uid()) = user_id and id like 'custom-%' and recipe_id is null);

drop policy if exists "food_catalog_delete_own_custom" on public.food_catalog;
create policy "food_catalog_delete_own_custom"
  on public.food_catalog for delete
  to authenticated
  using (source_type = 'custom' and (select auth.uid()) = user_id and recipe_id is null);

drop trigger if exists diet_recipes_set_updated_at on public.diet_recipes;
create trigger diet_recipes_set_updated_at
before update on public.diet_recipes
for each row execute function public.set_updated_at();

create or replace function public.save_diet_recipe(
  p_recipe_id uuid,
  p_name_pt text,
  p_category text,
  p_servings integer,
  p_yield_grams numeric,
  p_preparation_minutes integer,
  p_instructions text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_recipe_id uuid := coalesce(p_recipe_id, gen_random_uuid());
  v_catalog_id text;
  v_item jsonb;
  v_item_order bigint;
  v_food_id text;
  v_grams numeric;
  v_food public.food_catalog%rowtype;
  v_seen_food_ids text[] := '{}'::text[];
  v_patterns text[] := array['omnivore', 'vegetarian', 'vegan', 'pescatarian']::text[];
  v_allergens text[] := '{}'::text[];
  v_total_calories numeric := 0;
  v_total_protein numeric := 0;
  v_total_carbs numeric := 0;
  v_total_fat numeric := 0;
  v_total_fiber numeric := 0;
  v_meal_tags text[];
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Sessão inválida.';
  end if;
  if p_recipe_id is not null and not exists (
    select 1 from public.diet_recipes where id = p_recipe_id and user_id = v_user_id and is_active
  ) then
    raise exception using errcode = '42501', message = 'Receita não encontrada para esta conta.';
  end if;
  if char_length(btrim(coalesce(p_name_pt, ''))) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'Nome inválido.';
  end if;
  if p_category is null or p_category not in ('grain', 'vegetable', 'fruit', 'fat', 'fish', 'meat', 'dairy', 'egg', 'legume') then
    raise exception using errcode = '22023', message = 'Categoria inválida.';
  end if;
  if p_servings is null or p_yield_grams is null or p_servings not between 1 and 100 or p_yield_grams not between 1 and 10000 then
    raise exception using errcode = '22023', message = 'Rendimento inválido.';
  end if;
  if coalesce(p_preparation_minutes, 0) not between 0 and 1440 or char_length(coalesce(p_instructions, '')) > 5000 then
    raise exception using errcode = '22023', message = 'Dados de preparo inválidos.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = '22023', message = 'Ingredientes inválidos.';
  end if;
  if jsonb_array_length(p_items) not between 2 and 30 then
    raise exception using errcode = '22023', message = 'Use entre 2 e 30 ingredientes.';
  end if;

  for v_item, v_item_order in
    select value, ordinality - 1 from jsonb_array_elements(p_items) with ordinality
  loop
    v_food_id := v_item ->> 'food_id';
    v_grams := (v_item ->> 'grams')::numeric;
    if v_food_id is null or v_grams is null then
      raise exception using errcode = '22023', message = 'Ingrediente inválido.';
    end if;
    if v_food_id = any(v_seen_food_ids) then
      raise exception using errcode = '22023', message = 'Um ingrediente foi incluído mais de uma vez.';
    end if;
    if v_grams not between 0.1 and 10000 then
      raise exception using errcode = '22023', message = 'Quantidade de ingrediente inválida.';
    end if;
    select * into v_food
    from public.food_catalog food
    where food.id = v_food_id
      and food.is_active
      and food.recipe_id is null
      and (
        (food.source_type = 'reference' and food.user_id is null)
        or (food.source_type = 'custom' and food.user_id = v_user_id)
      );
    if not found then
      raise exception using errcode = '42501', message = 'Ingrediente indisponível para esta conta.';
    end if;
    v_seen_food_ids := array_append(v_seen_food_ids, v_food_id);
    v_total_calories := v_total_calories + v_food.calories * v_grams / 100;
    v_total_protein := v_total_protein + v_food.protein_g * v_grams / 100;
    v_total_carbs := v_total_carbs + v_food.carbs_g * v_grams / 100;
    v_total_fat := v_total_fat + v_food.fat_g * v_grams / 100;
    v_total_fiber := v_total_fiber + v_food.fiber_g * v_grams / 100;
    select coalesce(array_agg(pattern), '{}'::text[])
      into v_patterns
      from unnest(v_patterns) as pattern
      where pattern = any(v_food.dietary_patterns);
    select coalesce(array_agg(distinct tag), '{}'::text[])
      into v_allergens
      from unnest(v_allergens || coalesce(v_food.allergen_tags, '{}'::text[])) as tag;
  end loop;

  if cardinality(v_patterns) = 0 then
    raise exception using errcode = '22023', message = 'Os ingredientes não compartilham um padrão alimentar compatível.';
  end if;

  insert into public.diet_recipes (
    id, user_id, name_pt, category, servings, yield_grams, preparation_minutes,
    instructions, dietary_patterns, allergen_tags, total_calories, total_protein_g,
    total_carbs_g, total_fat_g, total_fiber_g, is_active
  ) values (
    v_recipe_id, v_user_id, btrim(p_name_pt), p_category, p_servings, p_yield_grams,
    coalesce(p_preparation_minutes, 0), btrim(coalesce(p_instructions, '')), v_patterns,
    v_allergens, round(v_total_calories, 2), round(v_total_protein, 2),
    round(v_total_carbs, 2), round(v_total_fat, 2), round(v_total_fiber, 2), true
  )
  on conflict (id) do update set
    name_pt = excluded.name_pt,
    category = excluded.category,
    servings = excluded.servings,
    yield_grams = excluded.yield_grams,
    preparation_minutes = excluded.preparation_minutes,
    instructions = excluded.instructions,
    dietary_patterns = excluded.dietary_patterns,
    allergen_tags = excluded.allergen_tags,
    total_calories = excluded.total_calories,
    total_protein_g = excluded.total_protein_g,
    total_carbs_g = excluded.total_carbs_g,
    total_fat_g = excluded.total_fat_g,
    total_fiber_g = excluded.total_fiber_g,
    is_active = true
  where public.diet_recipes.user_id = v_user_id;

  delete from public.diet_recipe_items where recipe_id = v_recipe_id and user_id = v_user_id;

  for v_item, v_item_order in
    select value, ordinality - 1 from jsonb_array_elements(p_items) with ordinality
  loop
    v_food_id := v_item ->> 'food_id';
    v_grams := (v_item ->> 'grams')::numeric;
    select * into v_food from public.food_catalog where id = v_food_id;
    insert into public.diet_recipe_items (
      recipe_id, user_id, food_id, food_name_snapshot, grams, calories,
      protein_g, carbs_g, fat_g, fiber_g, item_order
    ) values (
      v_recipe_id, v_user_id, v_food.id, v_food.name_pt, v_grams,
      round(v_food.calories * v_grams / 100, 2),
      round(v_food.protein_g * v_grams / 100, 2),
      round(v_food.carbs_g * v_grams / 100, 2),
      round(v_food.fat_g * v_grams / 100, 2),
      round(v_food.fiber_g * v_grams / 100, 2),
      v_item_order
    );
  end loop;

  v_catalog_id := 'custom-recipe-' || v_recipe_id::text;
  v_meal_tags := case
    when p_category = 'grain' then array['main', 'breakfast', 'snack', 'carb']::text[]
    when p_category = 'vegetable' then array['main', 'vegetable']::text[]
    when p_category = 'fruit' then array['breakfast', 'snack', 'fruit', 'carb']::text[]
    when p_category = 'fat' then array['main', 'snack', 'fat']::text[]
    else array['main', 'breakfast', 'snack', 'protein']::text[]
  end;

  insert into public.food_catalog (
    id, user_id, recipe_id, source_type, name_pt, category, dietary_patterns,
    allergen_tags, meal_tags, calories, protein_g, carbs_g, fat_g, fiber_g,
    serving_grams, serving_label, cost_level, source_name, source_code, source_url, is_active
  ) values (
    v_catalog_id, v_user_id, v_recipe_id, 'custom', btrim(p_name_pt), p_category,
    v_patterns, v_allergens, v_meal_tags,
    round(v_total_calories * 100 / p_yield_grams, 2),
    round(v_total_protein * 100 / p_yield_grams, 2),
    round(v_total_carbs * 100 / p_yield_grams, 2),
    round(v_total_fat * 100 / p_yield_grams, 2),
    round(v_total_fiber * 100 / p_yield_grams, 2),
    round(p_yield_grams / p_servings, 1),
    '1 porção (' || round(p_yield_grams / p_servings, 1)::text || ' g)',
    2, 'Receita pessoal Apex', v_recipe_id::text, '', true
  )
  on conflict (id) do update set
    name_pt = excluded.name_pt,
    category = excluded.category,
    dietary_patterns = excluded.dietary_patterns,
    allergen_tags = excluded.allergen_tags,
    meal_tags = excluded.meal_tags,
    calories = excluded.calories,
    protein_g = excluded.protein_g,
    carbs_g = excluded.carbs_g,
    fat_g = excluded.fat_g,
    fiber_g = excluded.fiber_g,
    serving_grams = excluded.serving_grams,
    serving_label = excluded.serving_label,
    is_active = true
  where public.food_catalog.user_id = v_user_id and public.food_catalog.recipe_id = v_recipe_id;

  return v_recipe_id;
end;
$$;

create or replace function public.archive_diet_recipe(p_recipe_id uuid)
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
  update public.diet_recipes
    set is_active = false
    where id = p_recipe_id and user_id = v_user_id and is_active;
  if not found then
    raise exception using errcode = '42501', message = 'Receita não encontrada para esta conta.';
  end if;
  update public.food_catalog
    set is_active = false
    where recipe_id = p_recipe_id and user_id = v_user_id;
end;
$$;

revoke all on function public.save_diet_recipe(uuid, text, text, integer, numeric, integer, text, jsonb) from public;
revoke all on function public.archive_diet_recipe(uuid) from public;
grant execute on function public.save_diet_recipe(uuid, text, text, integer, numeric, integer, text, jsonb) to authenticated;
grant execute on function public.archive_diet_recipe(uuid) to authenticated;
