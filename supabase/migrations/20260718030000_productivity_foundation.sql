-- APEX PRODUCTIVITY FOUNDATION — v0.31.0–v0.34.0 — REVISAO SQL 2
-- Habitos, tarefas, metas, check-ins, revisoes, captura e leitura persistentes.

create table if not exists public.productivity_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  scheduled_time time not null default '07:00',
  period text not null default 'morning' check (period in ('morning', 'afternoon', 'evening', 'anytime')),
  category text not null default 'focus' check (category in ('spiritual', 'training', 'focus', 'health', 'learning', 'personal')),
  color text not null default '#E3AD52' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  icon_name text not null default 'Star' check (char_length(icon_name) between 1 and 80),
  frequency_type text not null default 'daily' check (frequency_type in ('daily', 'times_per_week', 'specific_days')),
  frequency_times smallint check (frequency_times is null or frequency_times between 1 and 7),
  frequency_days smallint[] not null default '{}'::smallint[],
  weekly_goal smallint not null default 7 check (weekly_goal between 1 and 7),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 1440),
  opens_reading_log boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (frequency_type = 'daily' and frequency_times is null)
    or (frequency_type = 'times_per_week' and frequency_times between 1 and 7)
    or (frequency_type = 'specific_days' and cardinality(frequency_days) between 1 and 7)
  ),
  check (frequency_days <@ array[0,1,2,3,4,5,6]::smallint[])
);

create index if not exists productivity_habits_user_active_idx
  on public.productivity_habits (user_id, is_archived, scheduled_time, created_at);

create table if not exists public.productivity_habit_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.productivity_habits(id) on delete cascade,
  entry_date date not null,
  status text not null check (status in ('done', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, habit_id, entry_date)
);

create index if not exists productivity_habit_entries_user_date_idx
  on public.productivity_habit_entries (user_id, entry_date, habit_id);

create table if not exists public.productivity_habit_day_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,
  habit_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create index if not exists productivity_habit_day_plans_user_date_idx
  on public.productivity_habit_day_plans (user_id, plan_date);

create table if not exists public.productivity_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  scheduled_time time,
  frequency_type text not null default 'once' check (frequency_type in ('once', 'daily', 'times_per_week', 'specific_days')),
  frequency_times smallint check (frequency_times is null or frequency_times between 1 and 7),
  frequency_days smallint[] not null default '{}'::smallint[],
  due_date date,
  notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (frequency_type = 'once' and due_date is not null and frequency_times is null and cardinality(frequency_days) = 0)
    or (frequency_type = 'daily' and due_date is null and frequency_times is null and cardinality(frequency_days) = 0)
    or (frequency_type = 'times_per_week' and due_date is null and frequency_times between 1 and 7 and cardinality(frequency_days) = 0)
    or (frequency_type = 'specific_days' and due_date is null and frequency_times is null and cardinality(frequency_days) between 1 and 7)
  ),
  check (frequency_days <@ array[0,1,2,3,4,5,6]::smallint[])
);

create index if not exists productivity_tasks_user_active_idx
  on public.productivity_tasks (user_id, is_archived, due_date, scheduled_time, created_at);

create table if not exists public.productivity_task_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.productivity_tasks(id) on delete cascade,
  entry_date date not null,
  status text not null check (status in ('done', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_id, entry_date)
);

create index if not exists productivity_task_entries_user_date_idx
  on public.productivity_task_entries (user_id, entry_date, task_id);

create table if not exists public.productivity_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  target_date date not null,
  current_value numeric(12,2) not null default 0,
  target_value numeric(12,2) not null check (target_value > 0),
  unit text not null default '' check (char_length(unit) <= 40),
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists productivity_goals_user_status_idx
  on public.productivity_goals (user_id, status, target_date);

create table if not exists public.productivity_goal_habits (
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.productivity_goals(id) on delete cascade,
  habit_id uuid not null references public.productivity_habits(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (goal_id, habit_id)
);

create table if not exists public.productivity_goal_training_templates (
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.productivity_goals(id) on delete cascade,
  template_id uuid not null references public.training_templates(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (goal_id, template_id)
);

create table if not exists public.productivity_daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,
  energy smallint not null check (energy between 1 and 5),
  sleep smallint not null check (sleep between 1 and 5),
  mood smallint not null check (mood between 1 and 5),
  stress smallint not null check (stress between 1 and 5),
  muscle_soreness smallint not null check (muscle_soreness between 1 and 5),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index if not exists productivity_daily_checkins_user_date_idx
  on public.productivity_daily_checkins (user_id, checkin_date desc);

create table if not exists public.productivity_day_moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood_date date not null,
  mood smallint not null check (mood between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mood_date)
);

create index if not exists productivity_day_moods_user_date_idx
  on public.productivity_day_moods (user_id, mood_date desc);

create table if not exists public.productivity_inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('idea', 'note')),
  content text not null check (char_length(trim(content)) between 1 and 2000),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists productivity_inbox_items_user_active_idx
  on public.productivity_inbox_items (user_id, is_archived, created_at desc);

create table if not exists public.productivity_weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start),
  check (jsonb_typeof(answers) = 'object')
);

create index if not exists productivity_weekly_reviews_user_week_idx
  on public.productivity_weekly_reviews (user_id, week_start desc);

create table if not exists public.productivity_focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid references public.productivity_habits(id) on delete set null,
  session_date date not null,
  task_name text not null check (char_length(trim(task_name)) between 1 and 240),
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists productivity_focus_sessions_user_date_idx
  on public.productivity_focus_sessions (user_id, session_date desc, completed_at desc);

create table if not exists public.reading_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 120),
  start_date date not null,
  end_date date not null,
  target_books integer not null default 1 check (target_books between 1 and 1000),
  linked_goal_id uuid references public.productivity_goals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists reading_cycles_user_dates_idx
  on public.reading_cycles (user_id, start_date desc, end_date desc);

create table if not exists public.reading_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  author text,
  total_pages integer not null check (total_pages between 1 and 100000),
  current_page integer not null default 0 check (current_page between 0 and 100000),
  weekly_target_pages integer not null default 1 check (weekly_target_pages between 1 and 100000),
  reading_days smallint[] not null default '{}'::smallint[],
  status text not null default 'planned' check (status in ('planned', 'active', 'paused', 'completed', 'abandoned')),
  priority text not null default 'main' check (priority in ('main', 'secondary')),
  start_date date not null,
  target_end_date date,
  completed_at date,
  cycle_id uuid references public.reading_cycles(id) on delete set null,
  linked_goal_id uuid references public.productivity_goals(id) on delete set null,
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  category text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_page <= total_pages),
  check (reading_days <@ array[0,1,2,3,4,5,6]::smallint[])
);

create index if not exists reading_projects_user_status_idx
  on public.reading_projects (user_id, status, priority, updated_at desc);

create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.reading_projects(id) on delete cascade,
  session_date date not null,
  from_page integer not null check (from_page >= 0),
  to_page integer not null check (to_page >= from_page),
  pages_read integer not null check (pages_read >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reading_sessions_user_date_idx
  on public.reading_sessions (user_id, session_date desc, project_id);

alter table public.productivity_habits enable row level security;
alter table public.productivity_habit_entries enable row level security;
alter table public.productivity_habit_day_plans enable row level security;
alter table public.productivity_tasks enable row level security;
alter table public.productivity_task_entries enable row level security;
alter table public.productivity_goals enable row level security;
alter table public.productivity_goal_habits enable row level security;
alter table public.productivity_goal_training_templates enable row level security;
alter table public.productivity_daily_checkins enable row level security;
alter table public.productivity_day_moods enable row level security;
alter table public.productivity_inbox_items enable row level security;
alter table public.productivity_weekly_reviews enable row level security;
alter table public.productivity_focus_sessions enable row level security;
alter table public.reading_cycles enable row level security;
alter table public.reading_projects enable row level security;
alter table public.reading_sessions enable row level security;

revoke all on public.productivity_habits, public.productivity_habit_entries, public.productivity_habit_day_plans from anon;
revoke all on public.productivity_tasks, public.productivity_task_entries, public.productivity_goals from anon;
revoke all on public.productivity_goal_habits, public.productivity_goal_training_templates from anon;
revoke all on public.productivity_daily_checkins, public.productivity_inbox_items, public.productivity_weekly_reviews from anon;
revoke all on public.productivity_day_moods from anon;
revoke all on public.productivity_focus_sessions from anon;
revoke all on public.reading_cycles, public.reading_projects, public.reading_sessions from anon;

grant select, insert, update, delete on public.productivity_habits, public.productivity_habit_entries, public.productivity_habit_day_plans to authenticated;
grant select, insert, update, delete on public.productivity_tasks, public.productivity_task_entries, public.productivity_goals to authenticated;
grant select, insert, update, delete on public.productivity_goal_habits, public.productivity_goal_training_templates to authenticated;
grant select, insert, update, delete on public.productivity_daily_checkins, public.productivity_inbox_items, public.productivity_weekly_reviews to authenticated;
grant select, insert, update, delete on public.productivity_day_moods to authenticated;
grant select, insert, update, delete on public.productivity_focus_sessions to authenticated;
grant select, insert, update, delete on public.reading_cycles, public.reading_projects, public.reading_sessions to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'productivity_habits', 'productivity_habit_entries', 'productivity_habit_day_plans',
    'productivity_tasks', 'productivity_task_entries', 'productivity_goals',
    'productivity_goal_habits', 'productivity_goal_training_templates', 'productivity_daily_checkins', 'productivity_day_moods',
    'productivity_inbox_items', 'productivity_weekly_reviews', 'productivity_focus_sessions',
    'reading_cycles', 'reading_projects', 'reading_sessions'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_all_own', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      table_name || '_all_own', table_name
    );
  end loop;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'productivity_habits', 'productivity_habit_entries', 'productivity_habit_day_plans',
    'productivity_tasks', 'productivity_task_entries', 'productivity_goals',
    'productivity_daily_checkins', 'productivity_day_moods', 'productivity_inbox_items', 'productivity_weekly_reviews',
    'reading_cycles', 'reading_projects'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', table_name || '_set_updated_at', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end;
$$;

create or replace function public.set_habit_entry(p_habit_id uuid, p_entry_date date, p_status text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.productivity_habits
    where id = p_habit_id and user_id = (select auth.uid()) and not is_archived
  ) then raise exception 'Habit not found'; end if;
  if p_status = 'pending' then
    delete from public.productivity_habit_entries
    where user_id = (select auth.uid()) and habit_id = p_habit_id and entry_date = p_entry_date;
  elsif p_status in ('done', 'skipped') then
    insert into public.productivity_habit_entries (user_id, habit_id, entry_date, status, completed_at)
    values ((select auth.uid()), p_habit_id, p_entry_date, p_status, case when p_status = 'done' then now() else null end)
    on conflict (user_id, habit_id, entry_date) do update
    set status = excluded.status, completed_at = excluded.completed_at;
  else
    raise exception 'Invalid habit status';
  end if;
end;
$$;

create or replace function public.set_task_entry(p_task_id uuid, p_entry_date date, p_status text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.productivity_tasks
    where id = p_task_id and user_id = (select auth.uid()) and not is_archived
  ) then raise exception 'Task not found'; end if;
  if p_status = 'pending' then
    delete from public.productivity_task_entries
    where user_id = (select auth.uid()) and task_id = p_task_id and entry_date = p_entry_date;
  elsif p_status in ('done', 'skipped') then
    insert into public.productivity_task_entries (user_id, task_id, entry_date, status, completed_at)
    values ((select auth.uid()), p_task_id, p_entry_date, p_status, case when p_status = 'done' then now() else null end)
    on conflict (user_id, task_id, entry_date) do update
    set status = excluded.status, completed_at = excluded.completed_at;
  else
    raise exception 'Invalid task status';
  end if;
end;
$$;

create or replace function public.save_habit_day_plan(p_plan_date date, p_habit_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare v_ids uuid[] := coalesce(p_habit_ids, '{}'::uuid[]);
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if exists (
    select 1 from unnest(v_ids) requested_id
    where not exists (
      select 1 from public.productivity_habits h
      where h.id = requested_id and h.user_id = (select auth.uid()) and not h.is_archived
    )
  ) then raise exception 'Invalid habit in day plan'; end if;
  insert into public.productivity_habit_day_plans (user_id, plan_date, habit_ids)
  values ((select auth.uid()), p_plan_date, v_ids)
  on conflict (user_id, plan_date) do update set habit_ids = excluded.habit_ids;
end;
$$;

create or replace function public.save_productivity_goal(
  p_goal_id uuid,
  p_title text,
  p_target_date date,
  p_current_value numeric,
  p_target_value numeric,
  p_unit text,
  p_status text,
  p_habit_ids uuid[],
  p_training_template_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_goal_id uuid;
  v_habit_id uuid;
  v_template_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_title, ''))) not between 1 and 180 then raise exception 'Invalid goal title'; end if;
  if p_target_value is null or p_target_value <= 0 then raise exception 'Invalid goal target'; end if;
  if p_status not in ('active', 'completed', 'paused', 'archived') then raise exception 'Invalid goal status'; end if;

  if p_goal_id is null then
    insert into public.productivity_goals (user_id, title, target_date, current_value, target_value, unit, status)
    values ((select auth.uid()), trim(p_title), p_target_date, p_current_value, p_target_value, left(trim(coalesce(p_unit, '')), 40), p_status)
    returning id into v_goal_id;
  else
    update public.productivity_goals
    set title = trim(p_title), target_date = p_target_date, current_value = p_current_value,
        target_value = p_target_value, unit = left(trim(coalesce(p_unit, '')), 40), status = p_status
    where id = p_goal_id and user_id = (select auth.uid())
    returning id into v_goal_id;
    if v_goal_id is null then raise exception 'Goal not found'; end if;
    delete from public.productivity_goal_habits where goal_id = v_goal_id and user_id = (select auth.uid());
    delete from public.productivity_goal_training_templates where goal_id = v_goal_id and user_id = (select auth.uid());
  end if;

  foreach v_habit_id in array coalesce(p_habit_ids, '{}'::uuid[]) loop
    if not exists (select 1 from public.productivity_habits where id = v_habit_id and user_id = (select auth.uid())) then raise exception 'Invalid linked habit'; end if;
    insert into public.productivity_goal_habits (user_id, goal_id, habit_id) values ((select auth.uid()), v_goal_id, v_habit_id);
  end loop;
  foreach v_template_id in array coalesce(p_training_template_ids, '{}'::uuid[]) loop
    if not exists (select 1 from public.training_templates where id = v_template_id and user_id = (select auth.uid())) then raise exception 'Invalid linked training template'; end if;
    insert into public.productivity_goal_training_templates (user_id, goal_id, template_id) values ((select auth.uid()), v_goal_id, v_template_id);
  end loop;
  return v_goal_id;
end;
$$;

create or replace function public.record_reading_progress(p_project_id uuid, p_session_date date, p_to_page integer, p_note text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_project public.reading_projects%rowtype;
  v_session_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select * into v_project from public.reading_projects
  where id = p_project_id and user_id = (select auth.uid()) for update;
  if v_project.id is null then raise exception 'Reading project not found'; end if;
  if p_to_page <= v_project.current_page or p_to_page > v_project.total_pages then raise exception 'Invalid reading page'; end if;
  insert into public.reading_sessions (user_id, project_id, session_date, from_page, to_page, pages_read, note)
  values ((select auth.uid()), v_project.id, p_session_date, v_project.current_page, p_to_page, p_to_page - v_project.current_page, trim(coalesce(p_note, '')))
  returning id into v_session_id;
  update public.reading_projects
  set current_page = p_to_page,
      status = case when p_to_page = total_pages then 'completed' else status end,
      completed_at = case when p_to_page = total_pages then p_session_date else completed_at end
  where id = v_project.id and user_id = (select auth.uid());
  return v_session_id;
end;
$$;

revoke all on function public.set_habit_entry(uuid, date, text) from public, anon;
revoke all on function public.set_task_entry(uuid, date, text) from public, anon;
revoke all on function public.save_habit_day_plan(date, uuid[]) from public, anon;
revoke all on function public.save_productivity_goal(uuid, text, date, numeric, numeric, text, text, uuid[], uuid[]) from public, anon;
revoke all on function public.record_reading_progress(uuid, date, integer, text) from public, anon;

grant execute on function public.set_habit_entry(uuid, date, text) to authenticated;
grant execute on function public.set_task_entry(uuid, date, text) to authenticated;
grant execute on function public.save_habit_day_plan(date, uuid[]) to authenticated;
grant execute on function public.save_productivity_goal(uuid, text, date, numeric, numeric, text, text, uuid[], uuid[]) to authenticated;
grant execute on function public.record_reading_progress(uuid, date, integer, text) to authenticated;
