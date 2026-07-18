-- APEX TRAINING MIGRATION — REVISAO SQL 2
-- Apex v0.27.0–v0.30.0 — treino persistente, execução, progresso e biblioteca

create table if not exists public.training_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source_type text not null default 'custom' check (source_type in ('reference', 'custom')),
  name_pt text not null check (char_length(trim(name_pt)) between 2 and 120),
  category text not null check (category in ('strength', 'cardio', 'mobility')),
  primary_muscle_group text not null default '',
  equipment text not null default '',
  instructions text not null default '',
  video_url text,
  source_code text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (video_url is null or video_url ~ '^https?://'),
  check ((source_type = 'reference' and user_id is null) or (source_type = 'custom' and user_id is not null))
);

create unique index if not exists training_exercises_reference_code_idx
  on public.training_exercises (source_code) where user_id is null;
create index if not exists training_exercises_user_active_idx
  on public.training_exercises (user_id, is_active, name_pt);
create index if not exists training_exercises_category_idx
  on public.training_exercises (category, is_active, name_pt);

create table if not exists public.training_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  workout_type text not null check (workout_type in ('strength', 'running', 'mobility', 'recovery')),
  description text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_templates_user_active_idx
  on public.training_templates (user_id, is_archived, updated_at desc);

create table if not exists public.training_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.training_templates(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.training_exercises(id),
  exercise_order smallint not null check (exercise_order between 1 and 100),
  target_sets smallint not null default 3 check (target_sets between 1 and 20),
  target_reps smallint not null default 10 check (target_reps between 1 and 1000),
  target_load_kg numeric(7,2) check (target_load_kg is null or target_load_kg between 0 and 1000),
  rest_seconds integer not null default 60 check (rest_seconds between 0 and 3600),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, exercise_order)
);

create index if not exists training_template_exercises_template_idx
  on public.training_template_exercises (template_id, exercise_order);
create index if not exists training_template_exercises_user_idx
  on public.training_template_exercises (user_id, template_id);

create table if not exists public.training_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 120),
  goal text not null default '',
  start_date date not null,
  end_date date not null,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'archived')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists training_cycles_user_dates_idx
  on public.training_cycles (user_id, start_date desc, end_date desc);

create table if not exists public.training_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.training_templates(id),
  cycle_id uuid references public.training_cycles(id) on delete set null,
  scheduled_date date not null,
  scheduled_time time not null default '07:00',
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'skipped')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_schedule_user_date_idx
  on public.training_schedule (user_id, scheduled_date, scheduled_time);
create index if not exists training_schedule_cycle_idx
  on public.training_schedule (user_id, cycle_id, scheduled_date);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_workout_id uuid references public.training_schedule(id) on delete set null,
  template_id uuid references public.training_templates(id) on delete set null,
  template_name_snapshot text not null,
  workout_type_snapshot text not null check (workout_type_snapshot in ('strength', 'running', 'mobility', 'recovery')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 1440),
  total_volume_kg numeric(12,2) not null default 0 check (total_volume_kg >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_sessions_user_completed_idx
  on public.training_sessions (user_id, completed_at desc, started_at desc);
create index if not exists training_sessions_schedule_idx
  on public.training_sessions (user_id, scheduled_workout_id, status);

create table if not exists public.training_session_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  template_exercise_id uuid references public.training_template_exercises(id) on delete set null,
  exercise_id uuid references public.training_exercises(id) on delete set null,
  exercise_name_snapshot text not null,
  exercise_order smallint not null check (exercise_order between 1 and 100),
  set_order smallint not null check (set_order between 1 and 100),
  target_reps smallint not null check (target_reps between 0 and 1000),
  target_load_kg numeric(7,2) check (target_load_kg is null or target_load_kg between 0 and 1000),
  actual_reps smallint check (actual_reps is null or actual_reps between 0 and 1000),
  actual_load_kg numeric(7,2) check (actual_load_kg is null or actual_load_kg between 0 and 1000),
  rest_seconds integer not null default 60 check (rest_seconds between 0 and 3600),
  is_completed boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, exercise_order, set_order)
);

create index if not exists training_session_sets_session_idx
  on public.training_session_sets (session_id, exercise_order, set_order);
create index if not exists training_session_sets_records_idx
  on public.training_session_sets (user_id, exercise_id, is_completed, actual_load_kg desc);

alter table public.training_exercises enable row level security;
alter table public.training_templates enable row level security;
alter table public.training_template_exercises enable row level security;
alter table public.training_cycles enable row level security;
alter table public.training_schedule enable row level security;
alter table public.training_sessions enable row level security;
alter table public.training_session_sets enable row level security;

revoke all on public.training_exercises from anon;
revoke all on public.training_templates from anon;
revoke all on public.training_template_exercises from anon;
revoke all on public.training_cycles from anon;
revoke all on public.training_schedule from anon;
revoke all on public.training_sessions from anon;
revoke all on public.training_session_sets from anon;

grant select, insert, update, delete on public.training_exercises to authenticated;
grant select, insert, update, delete on public.training_templates to authenticated;
grant select, insert, update, delete on public.training_template_exercises to authenticated;
grant select, insert, update, delete on public.training_cycles to authenticated;
grant select, insert, update, delete on public.training_schedule to authenticated;
grant select, insert, update, delete on public.training_sessions to authenticated;
grant select, insert, update, delete on public.training_session_sets to authenticated;

drop policy if exists "training_exercises_select_available" on public.training_exercises;
create policy "training_exercises_select_available" on public.training_exercises for select to authenticated
using (user_id is null or user_id = (select auth.uid()));
drop policy if exists "training_exercises_insert_own" on public.training_exercises;
create policy "training_exercises_insert_own" on public.training_exercises for insert to authenticated
with check (user_id = (select auth.uid()) and source_type = 'custom');
drop policy if exists "training_exercises_update_own" on public.training_exercises;
create policy "training_exercises_update_own" on public.training_exercises for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and source_type = 'custom');
drop policy if exists "training_exercises_delete_own" on public.training_exercises;
create policy "training_exercises_delete_own" on public.training_exercises for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "training_templates_all_own" on public.training_templates;
create policy "training_templates_all_own" on public.training_templates for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "training_template_exercises_all_own" on public.training_template_exercises;
create policy "training_template_exercises_all_own" on public.training_template_exercises for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.training_templates t where t.id = template_id and t.user_id = (select auth.uid()))
  and exists (select 1 from public.training_exercises e where e.id = exercise_id and (e.user_id is null or e.user_id = (select auth.uid())))
);
drop policy if exists "training_cycles_all_own" on public.training_cycles;
create policy "training_cycles_all_own" on public.training_cycles for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "training_schedule_all_own" on public.training_schedule;
create policy "training_schedule_all_own" on public.training_schedule for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.training_templates t where t.id = template_id and t.user_id = (select auth.uid()))
  and (cycle_id is null or exists (select 1 from public.training_cycles c where c.id = cycle_id and c.user_id = (select auth.uid())))
);
drop policy if exists "training_sessions_all_own" on public.training_sessions;
create policy "training_sessions_all_own" on public.training_sessions for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (scheduled_workout_id is null or exists (select 1 from public.training_schedule s where s.id = scheduled_workout_id and s.user_id = (select auth.uid())))
  and (template_id is null or exists (select 1 from public.training_templates t where t.id = template_id and t.user_id = (select auth.uid())))
);
drop policy if exists "training_session_sets_all_own" on public.training_session_sets;
create policy "training_session_sets_all_own" on public.training_session_sets for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists training_exercises_set_updated_at on public.training_exercises;
create trigger training_exercises_set_updated_at before update on public.training_exercises for each row execute function public.set_updated_at();
drop trigger if exists training_templates_set_updated_at on public.training_templates;
create trigger training_templates_set_updated_at before update on public.training_templates for each row execute function public.set_updated_at();
drop trigger if exists training_template_exercises_set_updated_at on public.training_template_exercises;
create trigger training_template_exercises_set_updated_at before update on public.training_template_exercises for each row execute function public.set_updated_at();
drop trigger if exists training_cycles_set_updated_at on public.training_cycles;
create trigger training_cycles_set_updated_at before update on public.training_cycles for each row execute function public.set_updated_at();
drop trigger if exists training_schedule_set_updated_at on public.training_schedule;
create trigger training_schedule_set_updated_at before update on public.training_schedule for each row execute function public.set_updated_at();
drop trigger if exists training_sessions_set_updated_at on public.training_sessions;
create trigger training_sessions_set_updated_at before update on public.training_sessions for each row execute function public.set_updated_at();
drop trigger if exists training_session_sets_set_updated_at on public.training_session_sets;
create trigger training_session_sets_set_updated_at before update on public.training_session_sets for each row execute function public.set_updated_at();

create or replace function public.save_training_template(
  p_template_id uuid,
  p_name text,
  p_workout_type text,
  p_description text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_template_id uuid;
  v_item jsonb;
  v_exercise_id uuid;
  v_order integer := 0;
  v_sets integer;
  v_reps integer;
  v_load numeric;
  v_rest integer;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 120 then raise exception 'Invalid template name'; end if;
  if p_workout_type not in ('strength', 'running', 'mobility', 'recovery') then raise exception 'Invalid workout type'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 50 then raise exception 'Invalid template items'; end if;

  if p_template_id is null then
    insert into public.training_templates (user_id, name, workout_type, description)
    values ((select auth.uid()), trim(p_name), p_workout_type, trim(coalesce(p_description, '')))
    returning id into v_template_id;
  else
    update public.training_templates
    set name = trim(p_name), workout_type = p_workout_type, description = trim(coalesce(p_description, '')), is_archived = false
    where id = p_template_id and user_id = (select auth.uid())
    returning id into v_template_id;
    if v_template_id is null then raise exception 'Template not found'; end if;
    delete from public.training_template_exercises where template_id = v_template_id and user_id = (select auth.uid());
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_order := v_order + 1;
    v_exercise_id := (v_item ->> 'exercise_id')::uuid;
    v_sets := coalesce((v_item ->> 'target_sets')::integer, 3);
    v_reps := coalesce((v_item ->> 'target_reps')::integer, 10);
    v_load := nullif(v_item ->> 'target_load_kg', '')::numeric;
    v_rest := coalesce((v_item ->> 'rest_seconds')::integer, 60);
    if v_sets not between 1 and 20 or v_reps not between 1 and 1000 or v_rest not between 0 and 3600 or (v_load is not null and v_load not between 0 and 1000) then raise exception 'Invalid exercise prescription'; end if;
    if not exists (select 1 from public.training_exercises where id = v_exercise_id and is_active and (user_id is null or user_id = (select auth.uid()))) then raise exception 'Exercise unavailable'; end if;
    insert into public.training_template_exercises (template_id, user_id, exercise_id, exercise_order, target_sets, target_reps, target_load_kg, rest_seconds, notes)
    values (v_template_id, (select auth.uid()), v_exercise_id, v_order, v_sets, v_reps, v_load, v_rest, trim(coalesce(v_item ->> 'notes', '')));
  end loop;
  return v_template_id;
end;
$$;

create or replace function public.duplicate_training_template(p_template_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare v_source public.training_templates%rowtype; v_new_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select * into v_source from public.training_templates where id = p_template_id and user_id = (select auth.uid());
  if v_source.id is null then raise exception 'Template not found'; end if;
  insert into public.training_templates (user_id, name, workout_type, description)
  values ((select auth.uid()), left(v_source.name || ' — cópia', 120), v_source.workout_type, v_source.description)
  returning id into v_new_id;
  insert into public.training_template_exercises (template_id, user_id, exercise_id, exercise_order, target_sets, target_reps, target_load_kg, rest_seconds, notes)
  select v_new_id, (select auth.uid()), exercise_id, exercise_order, target_sets, target_reps, target_load_kg, rest_seconds, notes
  from public.training_template_exercises where template_id = p_template_id and user_id = (select auth.uid()) order by exercise_order;
  return v_new_id;
end;
$$;

create or replace function public.start_training_session(p_scheduled_workout_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_schedule public.training_schedule%rowtype;
  v_template public.training_templates%rowtype;
  v_session_id uuid;
  v_item record;
  v_set integer;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select * into v_schedule from public.training_schedule where id = p_scheduled_workout_id and user_id = (select auth.uid()) for update;
  if v_schedule.id is null then raise exception 'Scheduled workout not found'; end if;
  if v_schedule.status = 'completed' then raise exception 'Workout already completed'; end if;
  select id into v_session_id from public.training_sessions where scheduled_workout_id = v_schedule.id and user_id = (select auth.uid()) and status = 'in_progress' order by started_at desc limit 1;
  if v_session_id is not null then return v_session_id; end if;
  select * into v_template from public.training_templates where id = v_schedule.template_id and user_id = (select auth.uid());
  if v_template.id is null then raise exception 'Template not found'; end if;
  insert into public.training_sessions (user_id, scheduled_workout_id, template_id, template_name_snapshot, workout_type_snapshot)
  values ((select auth.uid()), v_schedule.id, v_template.id, v_template.name, v_template.workout_type)
  returning id into v_session_id;
  for v_item in
    select te.*, e.name_pt from public.training_template_exercises te join public.training_exercises e on e.id = te.exercise_id
    where te.template_id = v_template.id and te.user_id = (select auth.uid()) order by te.exercise_order
  loop
    for v_set in 1..v_item.target_sets loop
      insert into public.training_session_sets (user_id, session_id, template_exercise_id, exercise_id, exercise_name_snapshot, exercise_order, set_order, target_reps, target_load_kg, actual_reps, actual_load_kg, rest_seconds)
      values ((select auth.uid()), v_session_id, v_item.id, v_item.exercise_id, v_item.name_pt, v_item.exercise_order, v_set, v_item.target_reps, v_item.target_load_kg, v_item.target_reps, v_item.target_load_kg, v_item.rest_seconds);
    end loop;
  end loop;
  update public.training_schedule set status = 'in_progress' where id = v_schedule.id and user_id = (select auth.uid());
  return v_session_id;
end;
$$;

create or replace function public.finish_training_session(p_session_id uuid, p_duration_minutes integer, p_notes text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare v_schedule_id uuid; v_volume numeric;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if p_duration_minutes is not null and p_duration_minutes not between 0 and 1440 then raise exception 'Invalid duration'; end if;
  select scheduled_workout_id into v_schedule_id from public.training_sessions where id = p_session_id and user_id = (select auth.uid()) and status = 'in_progress' for update;
  if not found then raise exception 'Active session not found'; end if;
  select coalesce(sum(coalesce(actual_reps, 0) * coalesce(actual_load_kg, 0)), 0) into v_volume
  from public.training_session_sets where session_id = p_session_id and user_id = (select auth.uid()) and is_completed;
  update public.training_sessions set status = 'completed', completed_at = now(), duration_minutes = p_duration_minutes, notes = trim(coalesce(p_notes, '')), total_volume_kg = v_volume
  where id = p_session_id and user_id = (select auth.uid());
  if v_schedule_id is not null then update public.training_schedule set status = 'completed' where id = v_schedule_id and user_id = (select auth.uid()); end if;
end;
$$;

create or replace function public.replace_training_session_exercise(p_session_id uuid, p_template_exercise_id uuid, p_replacement_exercise_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare v_name text;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.training_sessions where id = p_session_id and user_id = (select auth.uid()) and status = 'in_progress') then raise exception 'Active session not found'; end if;
  if exists (select 1 from public.training_session_sets where session_id = p_session_id and user_id = (select auth.uid()) and template_exercise_id = p_template_exercise_id and is_completed) then raise exception 'Completed exercise cannot be replaced'; end if;
  select name_pt into v_name from public.training_exercises where id = p_replacement_exercise_id and is_active and (user_id is null or user_id = (select auth.uid()));
  if v_name is null then raise exception 'Replacement exercise unavailable'; end if;
  update public.training_session_sets set exercise_id = p_replacement_exercise_id, exercise_name_snapshot = v_name
  where session_id = p_session_id and user_id = (select auth.uid()) and template_exercise_id = p_template_exercise_id and not is_completed;
  if not found then raise exception 'Exercise not found in session'; end if;
end;
$$;

create or replace function public.cancel_training_session(p_session_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare v_schedule_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select scheduled_workout_id into v_schedule_id
  from public.training_sessions
  where id = p_session_id and user_id = (select auth.uid()) and status = 'in_progress'
  for update;
  if not found then raise exception 'Active session not found'; end if;
  update public.training_sessions
  set status = 'cancelled'
  where id = p_session_id and user_id = (select auth.uid()) and status = 'in_progress';
  if v_schedule_id is not null then
    update public.training_schedule
    set status = 'scheduled'
    where id = v_schedule_id and user_id = (select auth.uid()) and status = 'in_progress';
  end if;
end;
$$;

revoke all on function public.save_training_template(uuid, text, text, text, jsonb) from public, anon;
revoke all on function public.duplicate_training_template(uuid) from public, anon;
revoke all on function public.start_training_session(uuid) from public, anon;
revoke all on function public.finish_training_session(uuid, integer, text) from public, anon;
revoke all on function public.replace_training_session_exercise(uuid, uuid, uuid) from public, anon;
revoke all on function public.cancel_training_session(uuid) from public, anon;
grant execute on function public.save_training_template(uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.duplicate_training_template(uuid) to authenticated;
grant execute on function public.start_training_session(uuid) to authenticated;
grant execute on function public.finish_training_session(uuid, integer, text) to authenticated;
grant execute on function public.replace_training_session_exercise(uuid, uuid, uuid) to authenticated;
grant execute on function public.cancel_training_session(uuid) to authenticated;

insert into public.training_exercises (id, user_id, source_type, name_pt, category, primary_muscle_group, equipment, instructions, source_code)
values
  ('10000000-0000-4000-8000-000000000001', null, 'reference', 'Supino reto', 'strength', 'Peitoral', 'Barra ou halteres', 'Mantenha os pés firmes, controle a descida e preserve a posição dos ombros.', 'strength_bench_press'),
  ('10000000-0000-4000-8000-000000000002', null, 'reference', 'Remada sentada', 'strength', 'Costas', 'Cabo ou máquina', 'Mantenha o tronco estável e conduza os cotovelos para trás sem compensar com a lombar.', 'strength_seated_row'),
  ('10000000-0000-4000-8000-000000000003', null, 'reference', 'Desenvolvimento de ombros', 'strength', 'Ombros', 'Halteres ou máquina', 'Evite arquear excessivamente a lombar e mantenha o movimento controlado.', 'strength_shoulder_press'),
  ('10000000-0000-4000-8000-000000000004', null, 'reference', 'Puxada pela frente', 'strength', 'Costas', 'Cabo', 'Puxe em direção à parte superior do peito e mantenha o tronco estável.', 'strength_lat_pulldown'),
  ('10000000-0000-4000-8000-000000000005', null, 'reference', 'Agachamento livre', 'strength', 'Pernas', 'Barra ou peso corporal', 'Use amplitude compatível com seu controle e mantenha os joelhos acompanhando a direção dos pés.', 'strength_squat'),
  ('10000000-0000-4000-8000-000000000006', null, 'reference', 'Leg press', 'strength', 'Pernas', 'Máquina', 'Mantenha quadril e lombar apoiados e controle a amplitude sem travar os joelhos.', 'strength_leg_press'),
  ('10000000-0000-4000-8000-000000000007', null, 'reference', 'Levantamento terra romeno', 'strength', 'Posterior de coxa', 'Barra ou halteres', 'Leve o quadril para trás mantendo a coluna neutra e a carga próxima ao corpo.', 'strength_romanian_deadlift'),
  ('10000000-0000-4000-8000-000000000008', null, 'reference', 'Mesa flexora', 'strength', 'Posterior de coxa', 'Máquina', 'Controle a flexão e a extensão sem retirar o quadril do apoio.', 'strength_leg_curl'),
  ('10000000-0000-4000-8000-000000000009', null, 'reference', 'Cadeira extensora', 'strength', 'Quadríceps', 'Máquina', 'Ajuste o equipamento e execute o movimento sem impulso.', 'strength_leg_extension'),
  ('10000000-0000-4000-8000-000000000010', null, 'reference', 'Rosca direta', 'strength', 'Bíceps', 'Barra ou halteres', 'Mantenha os cotovelos estáveis e evite balanço do tronco.', 'strength_biceps_curl'),
  ('10000000-0000-4000-8000-000000000011', null, 'reference', 'Tríceps no cabo', 'strength', 'Tríceps', 'Cabo', 'Mantenha os cotovelos próximos ao corpo e controle o retorno.', 'strength_triceps_pushdown'),
  ('10000000-0000-4000-8000-000000000012', null, 'reference', 'Prancha frontal', 'strength', 'Core', 'Peso corporal', 'Mantenha tronco e quadril alinhados e respire normalmente.', 'strength_front_plank'),
  ('10000000-0000-4000-8000-000000000013', null, 'reference', 'Corrida contínua', 'cardio', 'Cardiorrespiratório', 'Livre ou esteira', 'Defina duração e intensidade compatíveis com o seu planejamento.', 'cardio_continuous_run'),
  ('10000000-0000-4000-8000-000000000014', null, 'reference', 'Corrida intervalada', 'cardio', 'Cardiorrespiratório', 'Livre ou esteira', 'Alterne blocos de esforço e recuperação conforme o treino planejado.', 'cardio_interval_run'),
  ('10000000-0000-4000-8000-000000000015', null, 'reference', 'Ciclismo leve', 'cardio', 'Cardiorrespiratório', 'Bicicleta', 'Use cadência confortável e intensidade compatível com recuperação ativa.', 'cardio_easy_cycling'),
  ('10000000-0000-4000-8000-000000000016', null, 'reference', 'Mobilidade de quadril', 'mobility', 'Quadril', 'Peso corporal', 'Execute movimentos controlados dentro de uma amplitude confortável.', 'mobility_hip'),
  ('10000000-0000-4000-8000-000000000017', null, 'reference', 'Mobilidade de tornozelo', 'mobility', 'Tornozelo', 'Peso corporal', 'Mantenha o calcanhar apoiado e avance o joelho de forma controlada.', 'mobility_ankle'),
  ('10000000-0000-4000-8000-000000000018', null, 'reference', 'Alongamento dinâmico', 'mobility', 'Corpo inteiro', 'Peso corporal', 'Use movimentos leves e progressivos, sem forçar posições dolorosas.', 'mobility_dynamic')
on conflict (id) do update set
  name_pt = excluded.name_pt,
  category = excluded.category,
  primary_muscle_group = excluded.primary_muscle_group,
  equipment = excluded.equipment,
  instructions = excluded.instructions,
  source_code = excluded.source_code,
  is_active = true;
