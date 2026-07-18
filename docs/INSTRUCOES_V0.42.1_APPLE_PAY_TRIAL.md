# Instalação — Apex v0.42.1

## 1. Executar o SQL

No Supabase, abra **SQL Editor**, crie uma nova query, cole todo o conteúdo de `apex-v0.42.1-apple-pay-trial.sql` e clique em **Run**.

Esse arquivo é a revisão completa da fundação de cobrança. Pode ser executado tanto por quem já instalou a v0.42.0 quanto por quem ainda não instalou. Ele é idempotente e não apaga dados. O resultado normal é:

```text
Success. No rows returned
```

Se a migration de notificações v0.38.0 ainda não tiver sido executada, execute-a antes de testar o aviso de término do período gratuito.

Confira a configuração:

```sql
select code, trial_days, is_active, unit_amount, provider_price_id
from public.billing_plans
where code = 'apex-pro-monthly';
```

O resultado esperado nesta entrega é `trial_days = 7`, `is_active = false`, `unit_amount = null` e `provider_price_id = null`.

## 2. Instalar e verificar localmente

Na pasta do projeto:

```bash
npm install
npm run check
npm run dev
```

Abra o Apex, entre em **Configurações > Assinatura** e confirme os textos sobre Apple Pay e 7 dias gratuitos.

## 3. Ativar cobrança somente quando estiver pronto

Não ative agora sem possuir conta Stripe e um preço real. Para a ativação controlada:

1. Crie o produto e o preço mensal no Stripe em modo de teste.
2. Habilite cartão e Apple Pay nas configurações de métodos de pagamento do Stripe.
3. Configure no servidor `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` e `APEX_BILLING_ENABLED=true`.
4. Configure o endpoint `/api/billing/webhook` para receber, no mínimo, os eventos usados pelo Apex, incluindo `customer.subscription.trial_will_end`.
5. Atualize `provider_price_id`, `unit_amount` e `is_active` do plano somente depois de conferir que os valores coincidem exatamente com o Price do Stripe.
6. Faça o primeiro teste completo em modo de teste, com uma conta descartável.

O Checkout coleta um método de pagamento para iniciar o teste. A primeira cobrança ocorre após sete dias, a menos que a assinatura seja cancelada antes. O Apple Pay aparece automaticamente apenas em dispositivo e navegador Apple compatíveis, com uma carteira válida; caso contrário, o cartão continua disponível.

## 4. Checklist de validação real

- Conta nova recebe sete dias gratuitos.
- A mesma conta não recebe um segundo teste após ter usado o primeiro.
- Apple Pay aparece em Safari/dispositivo elegível com Wallet configurada.
- Cartão aparece como alternativa.
- Cancelar durante o teste impede a cobrança.
- O evento `trial_will_end` cria um único aviso em Notificações.
- O status muda de `trialing` para `active` após cobrança bem-sucedida.
- Falha de cobrança aparece como pendência sem liberar um novo teste.
- Portal permite gerenciar e cancelar a assinatura.

## Estado seguro desta entrega

O plano Pro vem inativo, sem preço e com a flag de cobrança desligada. Portanto, apenas executar o SQL não inicia Checkout nem cobra usuários.
