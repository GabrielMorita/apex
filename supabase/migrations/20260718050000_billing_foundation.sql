-- APEX BILLING FOUNDATION — v0.39.0–v0.42.1 — REVISAO SQL 2
-- Catalogo, assinaturas, faturas, auditoria e direitos de acesso sem ativar cobranca automaticamente.

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  tier text not null check (tier in ('beta', 'pro')),
  billing_interval text not null check (billing_interval in ('none', 'month', 'year')),
  currency text not null default 'brl' check (currency ~ '^[a-z]{3}$'),
  unit_amount integer check (unit_amount is null or unit_amount >= 0),
  trial_days smallint not null default 0 check (trial_days between 0 and 90),
  provider text not null default 'manual' check (provider in ('manual', 'stripe', 'mercado_pago')),
  provider_price_id text,
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features) = 'array'),
  is_active boolean not null default false,
  is_public boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    billing_interval <> 'none'
    or (coalesce(unit_amount, 0) = 0 and provider = 'manual' and provider_price_id is null)
  ),
  check (
    not is_active
    or billing_interval = 'none'
    or (unit_amount is not null and unit_amount > 0 and nullif(trim(provider_price_id), '') is not null)
  )
);

create unique index if not exists billing_plans_provider_price_uidx
  on public.billing_plans (provider, provider_price_id)
  where provider_price_id is not null;
create index if not exists billing_plans_catalog_idx
  on public.billing_plans (is_public, sort_order, created_at);

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'mercado_pago')),
  provider_customer_id text not null,
  email_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_customer_id),
  unique (user_id, provider)
);

create index if not exists billing_customers_user_idx
  on public.billing_customers (user_id, provider);

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.billing_plans(id) on delete set null,
  provider text not null check (provider in ('stripe', 'mercado_pago', 'manual')),
  provider_subscription_id text not null,
  provider_price_id text,
  status text not null check (status in (
    'incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due',
    'paused', 'canceled', 'unpaid'
  )),
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

create index if not exists billing_subscriptions_user_status_idx
  on public.billing_subscriptions (user_id, status, current_period_end desc, updated_at desc);
create index if not exists billing_subscriptions_plan_idx
  on public.billing_subscriptions (plan_id, status);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  provider text not null check (provider in ('stripe', 'mercado_pago', 'manual')),
  provider_invoice_id text not null,
  status text not null check (status in ('draft', 'open', 'paid', 'void', 'uncollectible', 'failed')),
  currency text not null default 'brl' check (currency ~ '^[a-z]{3}$'),
  amount_due integer not null default 0 check (amount_due >= 0),
  amount_paid integer not null default 0 check (amount_paid >= 0),
  hosted_invoice_url text,
  invoice_pdf_url text,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_invoice_id)
);

create index if not exists billing_invoices_user_created_idx
  on public.billing_invoices (user_id, created_at desc);

create table if not exists public.billing_checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.billing_plans(id) on delete restrict,
  provider text not null check (provider in ('stripe', 'mercado_pago')),
  provider_checkout_id text,
  status text not null default 'created' check (status in ('created', 'redirected', 'completed', 'expired', 'failed')),
  expires_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists billing_checkout_attempts_provider_id_uidx
  on public.billing_checkout_attempts (provider, provider_checkout_id)
  where provider_checkout_id is not null;
create index if not exists billing_checkout_attempts_user_created_idx
  on public.billing_checkout_attempts (user_id, created_at desc);

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'mercado_pago')),
  provider_event_id text not null,
  event_type text not null check (char_length(event_type) between 1 and 160),
  processing_status text not null default 'processing' check (processing_status in ('processing', 'processed', 'failed')),
  attempts smallint not null default 1 check (attempts between 1 and 100),
  user_id uuid references auth.users(id) on delete set null,
  event_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(event_metadata) = 'object'),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);

create index if not exists billing_webhook_events_status_idx
  on public.billing_webhook_events (processing_status, received_at desc);

insert into public.billing_plans (
  code, name, description, tier, billing_interval, currency, unit_amount,
  trial_days, provider, provider_price_id, features, is_active, is_public, sort_order
)
values (
  'apex-beta',
  'Acesso Beta',
  'Acesso completo durante a fase de desenvolvimento e validação do Apex.',
  'beta',
  'none',
  'brl',
  0,
  0,
  'manual',
  null,
  '["all_current_features"]'::jsonb,
  true,
  true,
  10
)
on conflict (code) do nothing;

insert into public.billing_plans (
  code, name, description, tier, billing_interval, currency, unit_amount,
  trial_days, provider, provider_price_id, features, is_active, is_public, sort_order
)
values (
  'apex-pro-monthly',
  'Apex Pro',
  'Plano recorrente preparado para ativação depois da definição comercial.',
  'pro',
  'month',
  'brl',
  null,
  7,
  'stripe',
  null,
  '["all_current_features", "future_pro_features"]'::jsonb,
  false,
  true,
  20
)
on conflict (code) do update
set trial_days = excluded.trial_days,
    updated_at = now()
where public.billing_plans.trial_days = 0;

alter table public.billing_plans enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.billing_checkout_attempts enable row level security;
alter table public.billing_webhook_events enable row level security;

revoke all on public.billing_plans, public.billing_customers, public.billing_subscriptions,
  public.billing_invoices, public.billing_checkout_attempts, public.billing_webhook_events from anon;
revoke all on public.billing_plans, public.billing_customers, public.billing_subscriptions,
  public.billing_invoices, public.billing_checkout_attempts, public.billing_webhook_events from authenticated;

grant select on public.billing_plans, public.billing_customers, public.billing_subscriptions,
  public.billing_invoices, public.billing_checkout_attempts to authenticated;

drop policy if exists billing_plans_select_catalog on public.billing_plans;
create policy billing_plans_select_catalog on public.billing_plans
  for select to authenticated using (is_public);

drop policy if exists billing_customers_select_own on public.billing_customers;
create policy billing_customers_select_own on public.billing_customers
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists billing_subscriptions_select_own on public.billing_subscriptions;
create policy billing_subscriptions_select_own on public.billing_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists billing_invoices_select_own on public.billing_invoices;
create policy billing_invoices_select_own on public.billing_invoices
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists billing_checkout_attempts_select_own on public.billing_checkout_attempts;
create policy billing_checkout_attempts_select_own on public.billing_checkout_attempts
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists billing_plans_set_updated_at on public.billing_plans;
create trigger billing_plans_set_updated_at before update on public.billing_plans
for each row execute function public.set_updated_at();

drop trigger if exists billing_customers_set_updated_at on public.billing_customers;
create trigger billing_customers_set_updated_at before update on public.billing_customers
for each row execute function public.set_updated_at();

drop trigger if exists billing_subscriptions_set_updated_at on public.billing_subscriptions;
create trigger billing_subscriptions_set_updated_at before update on public.billing_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists billing_invoices_set_updated_at on public.billing_invoices;
create trigger billing_invoices_set_updated_at before update on public.billing_invoices
for each row execute function public.set_updated_at();

drop trigger if exists billing_checkout_attempts_set_updated_at on public.billing_checkout_attempts;
create trigger billing_checkout_attempts_set_updated_at before update on public.billing_checkout_attempts
for each row execute function public.set_updated_at();

create or replace function public.my_billing_access()
returns table (
  tier text,
  status text,
  plan_code text,
  plan_name text,
  access_until timestamptz,
  cancel_at_period_end boolean,
  source text
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  return query
  select p.tier, s.status, p.code, p.name, s.current_period_end, s.cancel_at_period_end, s.provider
  from public.billing_subscriptions s
  join public.billing_plans p on p.id = s.plan_id
  where s.user_id = v_user_id
    and s.status in ('trialing', 'active', 'past_due')
    and (s.current_period_end is null or s.current_period_end > now() - interval '7 days')
  order by
    case s.status when 'active' then 1 when 'trialing' then 2 else 3 end,
    s.current_period_end desc nulls first,
    s.updated_at desc
  limit 1;

  if not found then
    return query
    select p.tier, 'beta'::text, p.code, p.name, null::timestamptz, false, 'beta'::text
    from public.billing_plans p
    where p.code = 'apex-beta'
    limit 1;
  end if;
end;
$$;

revoke all on function public.my_billing_access() from public, anon;
grant execute on function public.my_billing_access() to authenticated;
