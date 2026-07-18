-- APEX PRIVACY & LGPD FOUNDATION — v0.43.0–v0.48.0 — REVISAO SQL 1
-- Documentos versionados, escolhas append-only, preferencias, direitos do titular e retencao.

create table if not exists public.privacy_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('terms_of_use', 'privacy_notice', 'health_data_consent')),
  version text not null check (char_length(trim(version)) between 1 and 40),
  title text not null check (char_length(trim(title)) between 1 and 160),
  public_path text not null check (public_path ~ '^/[a-z0-9/_-]+$'),
  content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  published_at timestamptz not null,
  effective_at timestamptz not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, version)
);

create unique index if not exists privacy_documents_one_current_idx
  on public.privacy_documents (document_type)
  where is_current;

create table if not exists public.privacy_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references public.privacy_documents(id) on delete restrict,
  document_type text not null check (document_type in ('terms_of_use', 'privacy_notice', 'health_data_consent')),
  document_version text not null check (char_length(trim(document_version)) between 1 and 40),
  event_type text not null check (event_type in ('accepted', 'acknowledged', 'withdrawn')),
  source text not null check (source in ('signup', 'privacy_center', 'system')),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists privacy_consent_events_user_created_idx
  on public.privacy_consent_events (user_id, created_at desc);
create index if not exists privacy_consent_events_user_document_idx
  on public.privacy_consent_events (user_id, document_type, document_version, created_at desc);

create table if not exists public.privacy_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  product_updates_enabled boolean not null default false,
  anonymous_usage_analytics_enabled boolean not null default false,
  research_participation_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('confirmation', 'access', 'correction', 'anonymization', 'deletion', 'portability', 'sharing_information', 'consent_revocation', 'objection', 'automated_decision_review', 'other')),
  status text not null default 'received' check (status in ('received', 'in_review', 'waiting_user', 'completed', 'rejected', 'canceled')),
  details text not null default '' check (char_length(details) <= 4000),
  response_summary text check (response_summary is null or char_length(response_summary) <= 4000),
  identity_verified_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists privacy_requests_user_created_idx
  on public.privacy_requests (user_id, created_at desc);
create index if not exists privacy_requests_status_created_idx
  on public.privacy_requests (status, created_at);

create table if not exists public.privacy_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.privacy_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('received', 'status_changed', 'user_message', 'response')),
  note text not null default '' check (char_length(note) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists privacy_request_events_request_created_idx
  on public.privacy_request_events (request_id, created_at);

create table if not exists public.privacy_retention_rules (
  code text primary key check (code ~ '^[a-z0-9_]{3,60}$'),
  data_category text not null check (char_length(trim(data_category)) between 1 and 160),
  active_account_period text not null check (char_length(trim(active_account_period)) between 1 and 500),
  after_account_deletion text not null check (char_length(trim(after_account_deletion)) between 1 and 500),
  rationale text not null check (char_length(trim(rationale)) between 1 and 500),
  sort_order smallint not null default 100,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

update public.privacy_documents
set is_current = false, updated_at = now()
where version <> '2026-07-18.1'
  and document_type in ('terms_of_use', 'privacy_notice', 'health_data_consent')
  and is_current;

insert into public.privacy_documents (document_type, version, title, public_path, content_sha256, published_at, effective_at, is_current)
values
  ('terms_of_use', '2026-07-18.1', 'Termos de Uso do Apex', '/termos', null, '2026-07-18T00:00:00-03:00', '2026-07-18T00:00:00-03:00', true),
  ('privacy_notice', '2026-07-18.1', 'Aviso de Privacidade do Apex', '/privacidade', null, '2026-07-18T00:00:00-03:00', '2026-07-18T00:00:00-03:00', true),
  ('health_data_consent', '2026-07-18.1', 'Consentimento para Dados de Saúde', '/dados-saude', null, '2026-07-18T00:00:00-03:00', '2026-07-18T00:00:00-03:00', true)
on conflict (document_type, version) do update
set title = excluded.title,
    public_path = excluded.public_path,
    content_sha256 = excluded.content_sha256,
    published_at = excluded.published_at,
    effective_at = excluded.effective_at,
    is_current = true,
    updated_at = now();

insert into public.privacy_retention_rules (code, data_category, active_account_period, after_account_deletion, rationale, sort_order)
values
  ('account_profile', 'Conta e Perfil', 'Enquanto a conta estiver ativa e os dados forem necessários para prestar o serviço.', 'Exclusão com a conta, ressalvadas hipóteses legais de conservação que deverão ser documentadas.', 'Execução do serviço, transparência e exercício de direitos.', 10),
  ('health_fitness', 'Saúde, corpo, alimentação e treino', 'Enquanto a conta estiver ativa e o usuário mantiver o consentimento aplicável.', 'Exclusão com a conta ou mediante solicitação válida, ressalvadas hipóteses do art. 16 da LGPD.', 'Personalização solicitada pelo usuário e consentimento específico quando aplicável.', 20),
  ('productivity', 'Hábitos, tarefas, metas, foco e leitura', 'Enquanto a conta estiver ativa ou até exclusão pelo usuário.', 'Exclusão com a conta.', 'Prestação das funcionalidades escolhidas pelo usuário.', 30),
  ('billing', 'Assinatura e cobrança', 'Durante a assinatura e pelo período necessário à operação e contestação.', 'Conservação apenas quando necessária ao cumprimento de obrigação legal ou exercício regular de direitos.', 'Execução contratual, obrigação legal e prevenção a fraude.', 40),
  ('privacy_records', 'Consentimentos e solicitações de privacidade', 'Enquanto necessários para atender solicitações e demonstrar conformidade.', 'Conservação mínima necessária quando houver fundamento legal; caso contrário, exclusão com a conta.', 'Exercício regular de direitos, obrigação legal e prestação de contas.', 50),
  ('security_incidents', 'Registros de incidentes de segurança', 'Pelo período necessário à investigação e resposta.', 'Ao menos cinco anos quando sujeitos ao Regulamento de Comunicação de Incidente de Segurança da ANPD.', 'Segurança, prevenção, obrigação regulatória e prestação de contas.', 60)
on conflict (code) do update
set data_category = excluded.data_category,
    active_account_period = excluded.active_account_period,
    after_account_deletion = excluded.after_account_deletion,
    rationale = excluded.rationale,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.privacy_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.privacy_consent_events (user_id, document_id, document_type, document_version, event_type, source, evidence)
select users.id, documents.id, documents.document_type, documents.version, choices.event_type, 'signup', jsonb_build_object('server_recorded_at', now(), 'backfilled_from_signup_metadata', true)
from auth.users as users
cross join lateral (
  values
    ('terms_of_use'::text, 'accepted'::text, users.raw_user_meta_data ->> 'apex_terms_version', users.raw_user_meta_data ->> 'apex_terms_accepted' = 'true'),
    ('privacy_notice'::text, 'acknowledged'::text, users.raw_user_meta_data ->> 'apex_privacy_version', users.raw_user_meta_data ->> 'apex_privacy_acknowledged' = 'true'),
    ('health_data_consent'::text, 'accepted'::text, users.raw_user_meta_data ->> 'apex_health_data_version', users.raw_user_meta_data ->> 'apex_health_data_accepted' = 'true')
) as choices(document_type, event_type, metadata_version, accepted)
join public.privacy_documents as documents
  on documents.document_type = choices.document_type and documents.is_current
where choices.accepted
  and choices.metadata_version = documents.version
  and not exists (
    select 1 from public.privacy_consent_events as existing
    where existing.user_id = users.id and existing.document_type = choices.document_type
  );

alter table public.privacy_documents enable row level security;
alter table public.privacy_consent_events enable row level security;
alter table public.privacy_preferences enable row level security;
alter table public.privacy_requests enable row level security;
alter table public.privacy_request_events enable row level security;
alter table public.privacy_retention_rules enable row level security;

revoke all on public.privacy_documents, public.privacy_consent_events, public.privacy_preferences,
  public.privacy_requests, public.privacy_request_events, public.privacy_retention_rules from anon, authenticated;

grant select on public.privacy_documents, public.privacy_retention_rules to anon, authenticated;
grant select on public.privacy_consent_events, public.privacy_requests, public.privacy_request_events to authenticated;
grant select, insert, update on public.privacy_preferences to authenticated;

drop policy if exists privacy_documents_public_read on public.privacy_documents;
create policy privacy_documents_public_read on public.privacy_documents for select
  to anon, authenticated using (is_current or (select auth.uid()) is not null);

drop policy if exists privacy_retention_rules_public_read on public.privacy_retention_rules;
create policy privacy_retention_rules_public_read on public.privacy_retention_rules for select
  to anon, authenticated using (is_active);

drop policy if exists privacy_consent_events_select_own on public.privacy_consent_events;
create policy privacy_consent_events_select_own on public.privacy_consent_events for select
  to authenticated using (user_id = (select auth.uid()));

drop policy if exists privacy_preferences_select_own on public.privacy_preferences;
create policy privacy_preferences_select_own on public.privacy_preferences for select
  to authenticated using (user_id = (select auth.uid()));
drop policy if exists privacy_preferences_insert_own on public.privacy_preferences;
create policy privacy_preferences_insert_own on public.privacy_preferences for insert
  to authenticated with check (user_id = (select auth.uid()));
drop policy if exists privacy_preferences_update_own on public.privacy_preferences;
create policy privacy_preferences_update_own on public.privacy_preferences for update
  to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists privacy_requests_select_own on public.privacy_requests;
create policy privacy_requests_select_own on public.privacy_requests for select
  to authenticated using (user_id = (select auth.uid()));

drop policy if exists privacy_request_events_select_own on public.privacy_request_events;
create policy privacy_request_events_select_own on public.privacy_request_events for select
  to authenticated using (user_id = (select auth.uid()));

drop trigger if exists privacy_documents_set_updated_at on public.privacy_documents;
create trigger privacy_documents_set_updated_at before update on public.privacy_documents
  for each row execute function public.set_updated_at();
drop trigger if exists privacy_preferences_set_updated_at on public.privacy_preferences;
create trigger privacy_preferences_set_updated_at before update on public.privacy_preferences
  for each row execute function public.set_updated_at();
drop trigger if exists privacy_requests_set_updated_at on public.privacy_requests;
create trigger privacy_requests_set_updated_at before update on public.privacy_requests
  for each row execute function public.set_updated_at();

create or replace function public.record_my_privacy_choice(p_document_type text, p_event_type text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_document public.privacy_documents%rowtype;
  latest_event public.privacy_consent_events%rowtype;
  result_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not (
    (p_document_type = 'terms_of_use' and p_event_type = 'accepted') or
    (p_document_type = 'privacy_notice' and p_event_type = 'acknowledged') or
    (p_document_type = 'health_data_consent' and p_event_type in ('accepted', 'withdrawn'))
  ) then raise exception 'Invalid privacy choice'; end if;

  select * into current_document
  from public.privacy_documents
  where document_type = p_document_type and is_current
  limit 1;
  if current_document.id is null then raise exception 'Current privacy document not found'; end if;

  select * into latest_event
  from public.privacy_consent_events
  where user_id = current_user_id and document_type = p_document_type
  order by created_at desc, id desc
  limit 1;

  if latest_event.document_id = current_document.id and latest_event.event_type = p_event_type then
    return latest_event.id;
  end if;

  insert into public.privacy_consent_events (
    user_id, document_id, document_type, document_version, event_type, source, evidence
  ) values (
    current_user_id, current_document.id, current_document.document_type, current_document.version,
    p_event_type, 'privacy_center', jsonb_build_object('server_recorded_at', now())
  ) returning id into result_id;
  return result_id;
end;
$$;

revoke all on function public.record_my_privacy_choice(text, text) from public, anon;
grant execute on function public.record_my_privacy_choice(text, text) to authenticated;

create or replace function public.submit_my_privacy_request(p_request_type text, p_details text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  result_id uuid;
  clean_details text := trim(coalesce(p_details, ''));
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if p_request_type not in ('confirmation', 'access', 'correction', 'anonymization', 'deletion', 'portability', 'sharing_information', 'consent_revocation', 'objection', 'automated_decision_review', 'other') then
    raise exception 'Invalid privacy request type';
  end if;
  if char_length(clean_details) > 4000 then raise exception 'Request details too long'; end if;

  insert into public.privacy_requests (user_id, request_type, details)
  values (current_user_id, p_request_type, clean_details)
  returning id into result_id;

  insert into public.privacy_request_events (request_id, user_id, event_type, note)
  values (result_id, current_user_id, 'received', 'Solicitação registrada por usuário autenticado.');
  return result_id;
end;
$$;

revoke all on function public.submit_my_privacy_request(text, text) from public, anon;
grant execute on function public.submit_my_privacy_request(text, text) to authenticated;

create or replace function public.capture_signup_privacy_choices()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  document_record record;
  expected_version text;
  accepted boolean;
  choice_event text;
begin
  insert into public.privacy_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  for document_record in
    select id, document_type, version from public.privacy_documents where is_current
  loop
    if document_record.document_type = 'terms_of_use' then
      expected_version := new.raw_user_meta_data ->> 'apex_terms_version';
      accepted := new.raw_user_meta_data ->> 'apex_terms_accepted' = 'true';
      choice_event := 'accepted';
    elsif document_record.document_type = 'privacy_notice' then
      expected_version := new.raw_user_meta_data ->> 'apex_privacy_version';
      accepted := new.raw_user_meta_data ->> 'apex_privacy_acknowledged' = 'true';
      choice_event := 'acknowledged';
    else
      expected_version := new.raw_user_meta_data ->> 'apex_health_data_version';
      accepted := new.raw_user_meta_data ->> 'apex_health_data_accepted' = 'true';
      choice_event := 'accepted';
    end if;

    if accepted and expected_version = document_record.version then
      insert into public.privacy_consent_events (
        user_id, document_id, document_type, document_version, event_type, source, evidence
      ) values (
        new.id, document_record.id, document_record.document_type, document_record.version,
        choice_event, 'signup', jsonb_build_object('server_recorded_at', now())
      );
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.capture_signup_privacy_choices() from public, anon, authenticated;

drop trigger if exists on_auth_user_privacy_choices on auth.users;
create trigger on_auth_user_privacy_choices
after insert on auth.users
for each row execute function public.capture_signup_privacy_choices();

comment on table public.privacy_consent_events is 'Registro append-only de aceite, ciência e revogação; escrita apenas por funções controladas.';
comment on table public.privacy_requests is 'Solicitações do titular autenticado; atualização reservada ao fluxo administrativo futuro.';
