# Apex v0.42.1 — Apple Pay e teste gratuito

Data: 18/07/2026

## Implementado

- Checkout de assinatura preparado para exibir Apple Pay automaticamente quando o dispositivo, navegador, carteira e região forem compatíveis.
- Cartão mantido como alternativa no mesmo Checkout hospedado da Stripe.
- Coleta obrigatória do método de pagamento antes de iniciar o teste.
- Teste gratuito de 7 dias no plano Apex Pro.
- Teste concedido apenas quando a conta nunca teve uma assinatura com `trial_start`.
- Primeira cobrança somente depois do teste, salvo cancelamento antes do término.
- Bloqueio de novo checkout quando já existe assinatura em teste, ativa ou com pagamento pendente.
- Tratamento do evento `customer.subscription.trial_will_end`.
- Aviso in-app idempotente antes do fim do teste, com atalho para Configurações.
- Interface informa elegibilidade do Apple Pay, período gratuito, cobrança posterior e cancelamento.
- Migração de cobrança revisada, idempotente e não destrutiva.

## Segurança preservada

- Nenhuma chave Stripe foi colocada no navegador ou no ZIP.
- O Apex continua sem armazenar dados de cartão.
- Estado de assinatura só é confirmado por webhook server-side.
- RLS e isolamento das tabelas de cobrança permanecem inalterados.
- O plano Apex Pro continua inativo e sem preço por padrão.
- `APEX_BILLING_ENABLED=false` continua sendo o padrão seguro.

## Limites do teste local

- Apple Pay só aparece no Checkout para usuários elegíveis; não é possível forçar sua exibição em dispositivo incompatível.
- Checkout, Apple Pay, cobrança após sete dias, cancelamento e webhook exigem conta Stripe real em modo de teste.
- Uma versão nativa distribuída pela App Store exige revisão separada das regras de compras digitais da Apple. Esta implementação é para o Apex web/PWA.

## Referências técnicas

- [Stripe: teste gratuito em assinaturas](https://docs.stripe.com/billing/subscriptions/trials)
- [Stripe: métodos de pagamento no Checkout](https://docs.stripe.com/payments/payment-method-configurations)
- [Stripe: Apple Pay e cartões salvos no Checkout](https://docs.stripe.com/payments/save-and-reuse-cards-only)
