-- Apex v0.13.0 — Catálogo nutricional e gerador semanal
-- Idempotente e não destrutiva. A composição dos alimentos é informada por 100 g.

create table if not exists public.food_catalog (
  id text primary key,
  name_pt text not null,
  category text not null,
  dietary_patterns text[] not null default '{}',
  allergen_tags text[] not null default '{}',
  meal_tags text[] not null default '{}',
  calories numeric(7,1) not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  fiber_g numeric(6,1) not null default 0,
  serving_grams numeric(6,1) not null default 100,
  serving_label text not null default '100 g',
  cost_level smallint not null default 2,
  source_name text not null,
  source_code text not null,
  source_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_catalog_category_check check (category in ('grain', 'vegetable', 'fruit', 'fat', 'fish', 'meat', 'dairy', 'egg', 'legume')),
  constraint food_catalog_patterns_check check (dietary_patterns <@ array['omnivore', 'vegetarian', 'vegan', 'pescatarian']::text[]),
  constraint food_catalog_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0 and fiber_g >= 0),
  constraint food_catalog_cost_check check (cost_level between 1 and 3)
);

create table if not exists public.diet_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  status text not null default 'active',
  generation_version text not null,
  targets_snapshot jsonb not null,
  preferences_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diet_plans_status_check check (status in ('active', 'archived')),
  constraint diet_plans_week_start_check check (extract(isodow from week_start) = 1),
  unique (id, user_id),
  unique (user_id, week_start)
);

create table if not exists public.diet_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  day_order smallint not null,
  calories numeric(7,1) not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  created_at timestamptz not null default now(),
  constraint diet_plan_days_order_check check (day_order between 0 and 6),
  constraint diet_plan_days_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0),
  constraint diet_plan_days_plan_owner_fk foreign key (plan_id, user_id) references public.diet_plans(id, user_id) on delete cascade,
  unique (id, user_id),
  unique (id, plan_id, user_id),
  unique (plan_id, day_order),
  unique (plan_id, plan_date)
);

create table if not exists public.diet_meals (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null,
  plan_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  meal_order smallint not null,
  scheduled_time time,
  is_locked boolean not null default false,
  regeneration_count integer not null default 0,
  calories numeric(7,1) not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  created_at timestamptz not null default now(),
  constraint diet_meals_order_check check (meal_order between 0 and 5),
  constraint diet_meals_regeneration_check check (regeneration_count >= 0),
  constraint diet_meals_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0),
  constraint diet_meals_day_owner_fk foreign key (day_id, plan_id, user_id) references public.diet_plan_days(id, plan_id, user_id) on delete cascade,
  unique (id, user_id),
  unique (day_id, meal_order)
);

create table if not exists public.diet_meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id text not null references public.food_catalog(id),
  food_name text not null,
  grams numeric(7,1) not null,
  serving_label text not null,
  item_order smallint not null,
  calories numeric(7,1) not null,
  protein_g numeric(6,1) not null,
  carbs_g numeric(6,1) not null,
  fat_g numeric(6,1) not null,
  created_at timestamptz not null default now(),
  constraint diet_meal_items_grams_check check (grams > 0 and grams <= 1000),
  constraint diet_meal_items_order_check check (item_order between 0 and 12),
  constraint diet_meal_items_nutrients_check check (calories >= 0 and protein_g >= 0 and carbs_g >= 0 and fat_g >= 0),
  constraint diet_meal_items_meal_owner_fk foreign key (meal_id, user_id) references public.diet_meals(id, user_id) on delete cascade,
  unique (meal_id, item_order)
);

create index if not exists food_catalog_active_category_idx on public.food_catalog (is_active, category);
create index if not exists diet_plans_user_week_idx on public.diet_plans (user_id, week_start desc);
create index if not exists diet_plan_days_user_date_idx on public.diet_plan_days (user_id, plan_date);
create index if not exists diet_meals_user_plan_idx on public.diet_meals (user_id, plan_id);
create index if not exists diet_meal_items_user_meal_idx on public.diet_meal_items (user_id, meal_id);

alter table public.food_catalog enable row level security;
alter table public.diet_plans enable row level security;
alter table public.diet_plan_days enable row level security;
alter table public.diet_meals enable row level security;
alter table public.diet_meal_items enable row level security;

revoke all on public.food_catalog from anon, authenticated;
grant select on public.food_catalog to authenticated;

revoke all on public.diet_plans, public.diet_plan_days, public.diet_meals, public.diet_meal_items from anon;
grant select, insert, update, delete on public.diet_plans, public.diet_plan_days, public.diet_meals, public.diet_meal_items to authenticated;

drop policy if exists "food_catalog_read_authenticated" on public.food_catalog;
create policy "food_catalog_read_authenticated" on public.food_catalog for select to authenticated using (is_active);

drop policy if exists "diet_plans_own" on public.diet_plans;
create policy "diet_plans_own" on public.diet_plans for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "diet_plan_days_own" on public.diet_plan_days;
create policy "diet_plan_days_own" on public.diet_plan_days for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "diet_meals_own" on public.diet_meals;
create policy "diet_meals_own" on public.diet_meals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "diet_meal_items_own" on public.diet_meal_items;
create policy "diet_meal_items_own" on public.diet_meal_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop trigger if exists food_catalog_set_updated_at on public.food_catalog;
create trigger food_catalog_set_updated_at before update on public.food_catalog for each row execute function public.set_updated_at();
drop trigger if exists diet_plans_set_updated_at on public.diet_plans;
create trigger diet_plans_set_updated_at before update on public.diet_plans for each row execute function public.set_updated_at();

create or replace function public.save_weekly_diet_plan(
  p_week_start date,
  p_generation_version text,
  p_targets_snapshot jsonb,
  p_preferences_snapshot jsonb,
  p_days jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_plan_id uuid;
  current_day_id uuid;
  current_meal_id uuid;
  day_json jsonb;
  meal_json jsonb;
  item_json jsonb;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if extract(isodow from p_week_start) <> 1 then raise exception 'week_start must be a Monday'; end if;
  if coalesce(jsonb_typeof(p_days), 'null') <> 'array' then raise exception 'Days must be a JSON array'; end if;
  if jsonb_array_length(p_days) <> 7 then raise exception 'A weekly plan must contain exactly 7 days'; end if;

  insert into public.diet_plans (user_id, week_start, status, generation_version, targets_snapshot, preferences_snapshot)
  values (current_user_id, p_week_start, 'active', p_generation_version, p_targets_snapshot, p_preferences_snapshot)
  on conflict (user_id, week_start) do update set
    status = 'active',
    generation_version = excluded.generation_version,
    targets_snapshot = excluded.targets_snapshot,
    preferences_snapshot = excluded.preferences_snapshot
  returning id into current_plan_id;

  delete from public.diet_plan_days where plan_id = current_plan_id and user_id = current_user_id;

  for day_json in select value from jsonb_array_elements(p_days)
  loop
    if (day_json ->> 'plan_date')::date <> p_week_start + (day_json ->> 'day_order')::integer then
      raise exception 'Plan date and day order are inconsistent';
    end if;
    if coalesce(jsonb_typeof(day_json -> 'meals'), 'null') <> 'array' then
      raise exception 'Meals must be a JSON array';
    end if;
    if jsonb_array_length(day_json -> 'meals') not between 2 and 6 then
      raise exception 'Each day must contain between 2 and 6 meals';
    end if;
    insert into public.diet_plan_days (plan_id, user_id, plan_date, day_order, calories, protein_g, carbs_g, fat_g)
    values (
      current_plan_id, current_user_id, (day_json ->> 'plan_date')::date, (day_json ->> 'day_order')::smallint,
      (day_json ->> 'calories')::numeric, (day_json ->> 'protein_g')::numeric,
      (day_json ->> 'carbs_g')::numeric, (day_json ->> 'fat_g')::numeric
    ) returning id into current_day_id;

    for meal_json in select value from jsonb_array_elements(day_json -> 'meals')
    loop
      if coalesce(jsonb_typeof(meal_json -> 'items'), 'null') <> 'array' then
        raise exception 'Meal items must be a JSON array';
      end if;
      if jsonb_array_length(meal_json -> 'items') < 1 then
        raise exception 'Each meal must contain at least one item';
      end if;
      insert into public.diet_meals (
        day_id, plan_id, user_id, name, meal_order, scheduled_time, is_locked, regeneration_count,
        calories, protein_g, carbs_g, fat_g
      ) values (
        current_day_id, current_plan_id, current_user_id, meal_json ->> 'name', (meal_json ->> 'meal_order')::smallint,
        nullif(meal_json ->> 'scheduled_time', '')::time, (meal_json ->> 'is_locked')::boolean,
        (meal_json ->> 'regeneration_count')::integer, (meal_json ->> 'calories')::numeric,
        (meal_json ->> 'protein_g')::numeric, (meal_json ->> 'carbs_g')::numeric, (meal_json ->> 'fat_g')::numeric
      ) returning id into current_meal_id;

      for item_json in select value from jsonb_array_elements(meal_json -> 'items')
      loop
        insert into public.diet_meal_items (
          meal_id, user_id, food_id, food_name, grams, serving_label, item_order,
          calories, protein_g, carbs_g, fat_g
        ) values (
          current_meal_id, current_user_id, item_json ->> 'food_id', item_json ->> 'food_name',
          (item_json ->> 'grams')::numeric, item_json ->> 'serving_label', (item_json ->> 'item_order')::smallint,
          (item_json ->> 'calories')::numeric, (item_json ->> 'protein_g')::numeric,
          (item_json ->> 'carbs_g')::numeric, (item_json ->> 'fat_g')::numeric
        );
      end loop;
    end loop;
  end loop;

  return current_plan_id;
end;
$$;

revoke all on function public.save_weekly_diet_plan(date, text, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_weekly_diet_plan(date, text, jsonb, jsonb, jsonb) to authenticated;

-- TACO, 4ª edição revisada e ampliada. Valores por 100 g da parte comestível.
insert into public.food_catalog (
  id, name_pt, category, dietary_patterns, allergen_tags, meal_tags,
  calories, protein_g, carbs_g, fat_g, fiber_g, serving_grams, serving_label,
  cost_level, source_name, source_code, source_url
) values
('taco-0001','Arroz integral, cozido','grain',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','carb'],124,2.6,25.8,1.0,2.7,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0001','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0003','Arroz tipo 1, cozido','grain',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','carb'],128,2.5,28.1,0.2,1.6,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0003','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0007','Aveia em flocos, crua','grain',array['omnivore','vegetarian','vegan','pescatarian'],array['aveia','gluten'],array['breakfast','carb'],394,13.9,66.6,8.5,9.1,30,'3 colheres de sopa',1,'TACO/NEPA-UNICAMP','0007','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0052','Pão de forma integral','grain',array['omnivore','vegetarian','vegan','pescatarian'],array['trigo','gluten'],array['breakfast','snack','carb'],253,9.4,49.9,3.7,6.9,50,'2 fatias',1,'TACO/NEPA-UNICAMP','0052','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0053','Pão francês','grain',array['omnivore','vegetarian','vegan','pescatarian'],array['trigo','gluten'],array['breakfast','snack','carb'],300,8.0,58.6,3.1,2.3,50,'1 unidade média',1,'TACO/NEPA-UNICAMP','0053','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0064','Abóbora cabotiá, cozida','vegetable',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','vegetable'],48,1.4,10.8,0.7,2.5,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0064','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0070','Abobrinha italiana, cozida','vegetable',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','vegetable'],15,1.1,3.0,0.2,1.6,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0070','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0078','Alface crespa, crua','vegetable',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','vegetable'],11,1.3,1.7,0.2,1.8,50,'1 prato de sobremesa',1,'TACO/NEPA-UNICAMP','0078','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0088','Batata-doce, cozida','grain',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','breakfast','carb'],77,0.6,18.4,0.1,2.2,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0088','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0091','Batata inglesa, cozida','grain',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','carb'],52,1.2,11.9,0,1.3,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0091','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0100','Brócolis, cozido','vegetable',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','vegetable'],25,2.1,4.4,0.5,3.4,100,'1 porção de 100 g',2,'TACO/NEPA-UNICAMP','0100','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0109','Cenoura, cozida','vegetable',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','vegetable'],30,0.8,6.7,0.2,2.6,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0109','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0129','Mandioca, cozida','grain',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','carb'],125,0.6,30.1,0.3,1.6,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0129','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0157','Tomate com semente, cru','vegetable',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','vegetable'],15,1.1,3.1,0.2,1.2,100,'1 unidade pequena',1,'TACO/NEPA-UNICAMP','0157','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0182','Banana-prata, crua','fruit',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['breakfast','snack','fruit','carb'],98,1.3,26.0,0.1,2.0,80,'1 unidade média',1,'TACO/NEPA-UNICAMP','0182','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0214','Laranja-pêra, crua','fruit',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['breakfast','snack','fruit','carb'],37,1.0,8.9,0.1,0.8,140,'1 unidade média',1,'TACO/NEPA-UNICAMP','0214','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0222','Maçã Fuji com casca, crua','fruit',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['breakfast','snack','fruit','carb'],56,0.3,15.2,0,1.3,130,'1 unidade média',2,'TACO/NEPA-UNICAMP','0222','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0225','Mamão Formosa, cru','fruit',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['breakfast','snack','fruit','carb'],45,0.8,11.6,0.1,1.8,150,'1 fatia média',1,'TACO/NEPA-UNICAMP','0225','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0260','Azeite de oliva extravirgem','fat',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','fat'],884,0,0,100,0,8,'1 colher de sobremesa rasa',2,'TACO/NEPA-UNICAMP','0260','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0318','Sardinha, assada','fish',array['omnivore','pescatarian'],array['peixe'],array['main','protein'],164,32.2,0,3.0,0,100,'1 filé grande',2,'TACO/NEPA-UNICAMP','0318','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0377','Patinho sem gordura, grelhado','meat',array['omnivore'],array['carne bovina'],array['main','protein'],219,35.9,0,7.3,0,100,'1 bife pequeno',3,'TACO/NEPA-UNICAMP','0377','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0410','Peito de frango sem pele, grelhado','meat',array['omnivore'],array['frango'],array['main','protein'],159,32.0,0,2.5,0,100,'1 filé pequeno',2,'TACO/NEPA-UNICAMP','0410','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0448','Iogurte natural','dairy',array['omnivore','vegetarian','pescatarian'],array['leite','lactose'],array['breakfast','snack','protein'],51,4.1,1.9,3.0,0,170,'1 pote',2,'TACO/NEPA-UNICAMP','0448','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0461','Queijo minas frescal','dairy',array['omnivore','vegetarian','pescatarian'],array['leite','lactose'],array['breakfast','snack','protein'],264,17.4,3.2,20.2,0,30,'1 fatia média',2,'TACO/NEPA-UNICAMP','0461','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0486','Clara de ovo de galinha, cozida','egg',array['omnivore','vegetarian','pescatarian'],array['ovo'],array['breakfast','snack','main','protein'],59,13.4,0,0.1,0,50,'Claras de aproximadamente 2 ovos',1,'TACO/NEPA-UNICAMP','0486','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0488','Ovo de galinha inteiro, cozido','egg',array['omnivore','vegetarian','pescatarian'],array['ovo'],array['breakfast','snack','main','protein'],146,13.3,0.6,9.5,0,50,'1 unidade',1,'TACO/NEPA-UNICAMP','0488','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0546','Salada de legumes, cozida no vapor','vegetable',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','vegetable'],35,2.0,7.1,0.3,2.5,100,'1 porção de 100 g',1,'TACO/NEPA-UNICAMP','0546','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0557','Amendoim, grão cru','legume',array['omnivore','vegetarian','vegan','pescatarian'],array['amendoim'],array['breakfast','snack','protein','fat'],544,27.2,20.3,43.9,8.0,20,'1 punhado pequeno',1,'TACO/NEPA-UNICAMP','0557','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0561','Feijão carioca, cozido','legume',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','protein'],76,4.8,13.6,0.5,8.5,100,'1 concha pequena',1,'TACO/NEPA-UNICAMP','0561','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0567','Feijão preto, cozido','legume',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','protein'],77,4.5,14.0,0.5,8.4,100,'1 concha pequena',1,'TACO/NEPA-UNICAMP','0567','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0577','Lentilha, cozida','legume',array['omnivore','vegetarian','vegan','pescatarian'],array[]::text[],array['main','snack','protein'],93,6.3,16.3,0.5,7.9,100,'1 concha pequena',1,'TACO/NEPA-UNICAMP','0577','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0581','Farinha de soja','legume',array['omnivore','vegetarian','vegan','pescatarian'],array['soja'],array['main','breakfast','snack','protein'],404,36.0,38.4,14.6,20.2,30,'3 colheres de sopa',1,'TACO/NEPA-UNICAMP','0581','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0584','Tofu','legume',array['omnivore','vegetarian','vegan','pescatarian'],array['soja'],array['main','breakfast','snack','protein'],64,6.6,2.1,4.0,0.8,100,'1 porção de 100 g',2,'TACO/NEPA-UNICAMP','0584','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/'),
('taco-0586','Tremoço em conserva','legume',array['omnivore','vegetarian','vegan','pescatarian'],array['tremoco'],array['main','breakfast','snack','protein'],121,11.1,12.4,3.8,14.4,100,'1 porção de 100 g',2,'TACO/NEPA-UNICAMP','0586','https://nepa.unicamp.br/tabela-brasileira-de-composicao-de-alimentos-4a-edicao/')
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
  cost_level = excluded.cost_level,
  source_name = excluded.source_name,
  source_code = excluded.source_code,
  source_url = excluded.source_url,
  is_active = true;
