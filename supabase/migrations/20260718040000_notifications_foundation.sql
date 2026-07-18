-- APEX NOTIFICATIONS FOUNDATION — v0.35.0–v0.38.0 — REVISAO SQL 2
-- Central in-app, preferencias por canal, lembretes idempotentes e base para push/e-mail.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  push_enabled boolean not null default false,
  habit_reminders boolean not null default true,
  task_reminders boolean not null default true,
  training_reminders boolean not null default true,
  diet_reminders boolean not null default true,
  weekly_review_reminders boolean not null default true,
  daily_summary_enabled boolean not null default true,
  reminder_lead_minutes smallint not null default 15 check (reminder_lead_minutes between 0 and 180),
  daily_summary_time time not null default '07:00',
  weekly_review_time time not null default '18:00',
  quiet_hours_enabled boolean not null default true,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '07:00',
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('habit', 'task', 'training', 'diet', 'weekly_review', 'daily_summary', 'system')),
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null default '' check (char_length(body) <= 1000),
  action_destination text check (action_destination is null or char_length(action_destination) between 1 and 120),
  source_type text check (source_type is null or source_type in ('habit', 'task', 'training_schedule', 'diet_meal', 'weekly_review', 'daily_summary', 'system')),
  source_id uuid,
  scheduled_for timestamptz not null,
  expires_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 240),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists notifications_user_inbox_idx
  on public.notifications (user_id, dismissed_at, scheduled_for desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, read_at, scheduled_for desc)
  where dismissed_at is null;

create table if not exists public.notification_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) between 10 and 4000),
  p256dh text not null check (char_length(p256dh) between 10 and 1000),
  auth_key text not null check (char_length(auth_key) between 5 and 500),
  user_agent text not null default '' check (char_length(user_agent) <= 1000),
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists notification_push_subscriptions_user_active_idx
  on public.notification_push_subscriptions (user_id, is_active, updated_at desc);

alter table public.notification_preferences enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_push_subscriptions enable row level security;

revoke all on public.notification_preferences, public.notifications, public.notification_push_subscriptions from anon;
grant select, insert, update, delete on public.notification_preferences, public.notifications, public.notification_push_subscriptions to authenticated;

drop policy if exists notification_preferences_all_own on public.notification_preferences;
create policy notification_preferences_all_own on public.notification_preferences
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists notifications_all_own on public.notifications;
create policy notifications_all_own on public.notifications
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists notification_push_subscriptions_all_own on public.notification_push_subscriptions;
create policy notification_push_subscriptions_all_own on public.notification_push_subscriptions
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at before update on public.notifications
for each row execute function public.set_updated_at();

drop trigger if exists notification_push_subscriptions_set_updated_at on public.notification_push_subscriptions;
create trigger notification_push_subscriptions_set_updated_at before update on public.notification_push_subscriptions
for each row execute function public.set_updated_at();

create or replace function public.sync_my_notifications(p_local_date date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_preferences public.notification_preferences%rowtype;
  v_inserted integer := 0;
  v_rows integer := 0;
  v_week_start date;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_local_date is null or p_local_date < current_date - 2 or p_local_date > current_date + 7 then
    raise exception 'Invalid notification date';
  end if;

  insert into public.notification_preferences (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  select * into v_preferences from public.notification_preferences where user_id = v_user_id;
  if not v_preferences.in_app_enabled then return 0; end if;

  update public.notifications n set dismissed_at = coalesce(n.dismissed_at, now())
  where n.user_id = v_user_id and n.dismissed_at is null and (
    (n.source_type = 'habit' and exists (
      select 1 from public.productivity_habit_entries e
      where e.user_id = v_user_id and e.habit_id = n.source_id and e.status in ('done', 'skipped')
        and e.entry_date::text = n.payload ->> 'date'
    ))
    or (n.source_type = 'task' and exists (
      select 1 from public.productivity_task_entries e
      where e.user_id = v_user_id and e.task_id = n.source_id and e.status in ('done', 'skipped')
        and e.entry_date::text = n.payload ->> 'date'
    ))
    or (n.source_type = 'training_schedule' and exists (
      select 1 from public.training_schedule ts
      where ts.user_id = v_user_id and ts.id = n.source_id and ts.status in ('completed', 'skipped')
    ))
    or (n.source_type = 'diet_meal' and exists (
      select 1 from public.diet_meals dm
      join public.diet_plan_days dd on dd.id = dm.day_id and dd.user_id = v_user_id
      join public.diet_consumption_entries ce on ce.user_id = v_user_id and ce.consumed_date = dd.plan_date and ce.meal_order = dm.meal_order
      where dm.user_id = v_user_id and dm.id = n.source_id
    ))
  );

  if v_preferences.habit_reminders then
    insert into public.notifications (user_id, kind, title, body, action_destination, source_type, source_id, scheduled_for, expires_at, dedupe_key, payload)
    select v_user_id, 'habit', h.name, 'Seu hábito está planejado para agora.', 'hoje', 'habit', h.id,
      ((p_local_date + h.scheduled_time) at time zone v_preferences.timezone) - make_interval(mins => v_preferences.reminder_lead_minutes),
      ((p_local_date + h.scheduled_time) at time zone v_preferences.timezone) + interval '12 hours',
      'habit:' || h.id::text || ':' || p_local_date::text,
      jsonb_build_object('date', p_local_date, 'time', h.scheduled_time)
    from public.productivity_habits h
    where h.user_id = v_user_id and not h.is_archived
      and (
        exists (
          select 1 from public.productivity_habit_day_plans dp
          where dp.user_id = v_user_id and dp.plan_date = p_local_date and h.id = any(dp.habit_ids)
        )
        or (
          not exists (
            select 1 from public.productivity_habit_day_plans dp
            where dp.user_id = v_user_id and dp.plan_date = p_local_date
          )
          and (
            h.frequency_type in ('daily', 'times_per_week')
            or (h.frequency_type = 'specific_days' and extract(dow from p_local_date)::smallint = any(h.frequency_days))
          )
        )
      )
      and not exists (
        select 1 from public.productivity_habit_entries e
        where e.user_id = v_user_id and e.habit_id = h.id and e.entry_date = p_local_date and e.status in ('done', 'skipped')
      )
    on conflict (user_id, dedupe_key) do nothing;
    get diagnostics v_rows = row_count; v_inserted := v_inserted + v_rows;
  end if;

  if v_preferences.task_reminders then
    insert into public.notifications (user_id, kind, title, body, action_destination, source_type, source_id, scheduled_for, expires_at, dedupe_key, payload)
    select v_user_id, 'task', t.title, 'Você tem uma tarefa planejada para hoje.', 'hoje', 'task', t.id,
      ((p_local_date + coalesce(t.scheduled_time, v_preferences.daily_summary_time)) at time zone v_preferences.timezone) - make_interval(mins => case when t.scheduled_time is null then 0 else v_preferences.reminder_lead_minutes end),
      ((p_local_date + coalesce(t.scheduled_time, v_preferences.daily_summary_time)) at time zone v_preferences.timezone) + interval '18 hours',
      'task:' || t.id::text || ':' || p_local_date::text,
      jsonb_build_object('date', p_local_date, 'time', t.scheduled_time)
    from public.productivity_tasks t
    where t.user_id = v_user_id and not t.is_archived
      and (
        (t.frequency_type = 'once' and t.due_date = p_local_date)
        or t.frequency_type in ('daily', 'times_per_week')
        or (t.frequency_type = 'specific_days' and extract(dow from p_local_date)::smallint = any(t.frequency_days))
      )
      and not exists (
        select 1 from public.productivity_task_entries e
        where e.user_id = v_user_id and e.task_id = t.id and e.entry_date = p_local_date and e.status in ('done', 'skipped')
      )
    on conflict (user_id, dedupe_key) do nothing;
    get diagnostics v_rows = row_count; v_inserted := v_inserted + v_rows;
  end if;

  if v_preferences.training_reminders then
    insert into public.notifications (user_id, kind, title, body, action_destination, source_type, source_id, scheduled_for, expires_at, dedupe_key, payload)
    select v_user_id, 'training', tt.name, 'Seu treino está planejado para hoje.', 'treinos:semana', 'training_schedule', ts.id,
      ((p_local_date + ts.scheduled_time) at time zone v_preferences.timezone) - make_interval(mins => v_preferences.reminder_lead_minutes),
      ((p_local_date + ts.scheduled_time) at time zone v_preferences.timezone) + interval '18 hours',
      'training:' || ts.id::text || ':' || p_local_date::text,
      jsonb_build_object('date', p_local_date, 'time', ts.scheduled_time, 'status', ts.status)
    from public.training_schedule ts
    join public.training_templates tt on tt.id = ts.template_id and tt.user_id = v_user_id
    where ts.user_id = v_user_id and ts.scheduled_date = p_local_date and ts.status in ('scheduled', 'in_progress')
    on conflict (user_id, dedupe_key) do nothing;
    get diagnostics v_rows = row_count; v_inserted := v_inserted + v_rows;
  end if;

  if v_preferences.diet_reminders then
    insert into public.notifications (user_id, kind, title, body, action_destination, source_type, source_id, scheduled_for, expires_at, dedupe_key, payload)
    select v_user_id, 'diet', dm.name, 'Confira ou registre esta refeição no seu plano.', 'dieta:plano', 'diet_meal', dm.id,
      ((p_local_date + dm.scheduled_time) at time zone v_preferences.timezone) - make_interval(mins => v_preferences.reminder_lead_minutes),
      ((p_local_date + dm.scheduled_time) at time zone v_preferences.timezone) + interval '8 hours',
      'diet:' || dm.id::text || ':' || p_local_date::text,
      jsonb_build_object('date', p_local_date, 'time', dm.scheduled_time, 'meal_order', dm.meal_order)
    from public.diet_meals dm
    join public.diet_plan_days dd on dd.id = dm.day_id and dd.user_id = v_user_id and dd.plan_date = p_local_date
    where dm.user_id = v_user_id and dm.scheduled_time is not null
      and not exists (
        select 1 from public.diet_consumption_entries ce
        where ce.user_id = v_user_id and ce.consumed_date = p_local_date and ce.meal_order = dm.meal_order
      )
    on conflict (user_id, dedupe_key) do nothing;
    get diagnostics v_rows = row_count; v_inserted := v_inserted + v_rows;
  end if;

  v_week_start := p_local_date - ((extract(dow from p_local_date)::integer + 6) % 7);
  if v_preferences.weekly_review_reminders and extract(dow from p_local_date)::integer = 0 then
    insert into public.notifications (user_id, kind, title, body, action_destination, source_type, scheduled_for, expires_at, dedupe_key, payload)
    select v_user_id, 'weekly_review', 'Revisão semanal', 'Transforme os sinais da semana em ajustes para a próxima.', 'progresso:revisao', 'weekly_review',
      ((p_local_date + v_preferences.weekly_review_time) at time zone v_preferences.timezone),
      ((p_local_date + v_preferences.weekly_review_time) at time zone v_preferences.timezone) + interval '2 days',
      'weekly-review:' || v_week_start::text,
      jsonb_build_object('week_start', v_week_start)
    where not exists (
      select 1 from public.productivity_weekly_reviews wr where wr.user_id = v_user_id and wr.week_start = v_week_start
    )
    on conflict (user_id, dedupe_key) do nothing;
    get diagnostics v_rows = row_count; v_inserted := v_inserted + v_rows;
  end if;

  if v_preferences.daily_summary_enabled then
    insert into public.notifications (user_id, kind, title, body, action_destination, source_type, scheduled_for, expires_at, dedupe_key, payload)
    values (
      v_user_id, 'daily_summary', 'Seu dia no Apex', 'Abra o Hoje para revisar hábitos, tarefas, treino e alimentação.', 'hoje', 'daily_summary',
      ((p_local_date + v_preferences.daily_summary_time) at time zone v_preferences.timezone),
      ((p_local_date + v_preferences.daily_summary_time) at time zone v_preferences.timezone) + interval '18 hours',
      'daily-summary:' || p_local_date::text,
      jsonb_build_object('date', p_local_date)
    )
    on conflict (user_id, dedupe_key) do nothing;
    get diagnostics v_rows = row_count; v_inserted := v_inserted + v_rows;
  end if;

  delete from public.notifications
  where user_id = v_user_id and expires_at is not null and expires_at < now() - interval '30 days';

  return v_inserted;
end;
$$;

revoke all on function public.sync_my_notifications(date) from public, anon;
grant execute on function public.sync_my_notifications(date) to authenticated;
