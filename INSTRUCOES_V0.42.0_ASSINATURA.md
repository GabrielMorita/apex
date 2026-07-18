# Como instalar o Apex v0.42.0

## 1. O que esta instalação faz

Ela adiciona a base de Assinatura, mas mantém o Apex em **Acesso Beta completo**. O plano Pro fica sem preço, inativo e incapaz de abrir checkout. Nenhuma cobrança será feita apenas por executar o SQL ou iniciar o projeto.

## 2. Pré-requisito

Use o projeto v0.42.0 completo. Se a migration de Notificações v0.38.0 ainda não foi executada, execute primeiro `apex-v0.38.0-notificacoes.sql` e depois o novo SQL de Assinatura.

Não apague nem substitua queries anteriores.

## 3. Executar o SQL

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor**.
3. Clique em **New query**.
4. Abra `apex-v0.42.0-assinatura.sql` ou, dentro do ZIP, `supabase/migrations/20260718050000_billing_foundation.sql`.
5. Confirme que a primeira linha contém **REVISAO SQL 1**.
6. Copie o arquivo inteiro, cole na nova query e clique em **Run query**.
7. O resultado esperado é **Success. No rows returned**.

O editor pode mostrar um aviso porque policies e triggers controlados pelo Apex são recriados. A migration não apaga tabelas ou registros funcionais.

## 4. Verificação opcional

```sql
select
  to_regclass('public.billing_plans') as plans,
  to_regclass('public.billing_customers') as customers,
  to_regclass('public.billing_subscriptions') as subscriptions,
  to_regclass('public.billing_invoices') as invoices,
  to_regclass('public.billing_checkout_attempts') as checkouts,
  to_regclass('public.billing_webhook_events') as webhook_events;

select code, name, tier, unit_amount, is_active
from public.billing_plans
order by sort_order;

select count(*) as billing_policies
from pg_policies
where schemaname = 'public' and tablename like 'billing_%';
```

As seis colunas devem mostrar os nomes das tabelas. O catálogo deve conter `apex-beta` ativo e `apex-pro-monthly` inativo. `billing_policies` deve retornar **5**.

## 5. Executar o projeto

1. Extraia `apex-v0.42.0-assinatura.zip`.
2. Copie seu `.env.local` atual para a nova pasta.
3. Não copie `.env.example` por cima do arquivo atual; use-o apenas como referência.
4. Execute `npm install`.
5. Execute `npm run dev`.
6. Abra `http://localhost:3000` e entre na sua conta.
7. Em **Configurações → Assinatura**, confirme que aparece **Acesso Beta**, **Beta completo** e **Apex Pro — Em preparação**.

## 6. Não configure cobrança agora

Para o uso cotidiano do Beta, não é necessário adicionar nenhuma variável nova. Mantenha:

```env
APEX_BILLING_ENABLED=false
```

Não coloque `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` ou `SUPABASE_SECRET_KEY` em variáveis `NEXT_PUBLIC`. Não compartilhe esses valores por print, chat, Git ou ZIP.

## 7. O que será necessário para ativar pagamentos no futuro

- escolher definitivamente o provedor;
- definir preço mensal/anual, período gratuito, recursos Pro e cancelamento;
- criar Product e Price em modo de teste;
- configurar as variáveis server-side do `.env.example`;
- publicar o aplicativo em uma URL HTTPS;
- configurar o webhook em `/api/billing/webhook`;
- habilitar e testar o portal do cliente;
- republicar a Edge Function `delete-account` desta versão;
- atualizar o plano `apex-pro-monthly` com o mesmo Price ID, moeda, valor e periodicidade;
- somente depois mudar `APEX_BILLING_ENABLED` para `true`;
- testar checkout, renovação, falha, cancelamento e reativação antes de produção.

Não ative isso apenas para “ver se funciona” em produção. A próxima ativação deve começar no modo de teste do provedor.
