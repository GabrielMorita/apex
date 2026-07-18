# Apex v0.42.0 — Assinatura segura em modo Beta

Esta entrega consolida as versões v0.39.0, v0.40.0, v0.41.0 e v0.42.0. Ela prepara cobrança recorrente sem definir preço, retirar funcionalidades ou ativar pagamentos por conta própria.

## v0.39.0 — Catálogo e direitos de acesso

- Catálogo privado de operação com planos Beta e Pro.
- Fallback automático para **Acesso Beta completo** quando não existe assinatura paga.
- Estados de assinatura, período, teste, cancelamento e inadimplência centralizados.
- Helper reutilizável para consultar direitos de acesso sem espalhar regras pelo aplicativo.
- Nenhum recurso atual foi bloqueado ou transformado em Pro nesta versão.

## v0.40.0 — Experiência de assinatura

- Novo cartão **Assinatura** em Configurações.
- Plano atual, status, período e cancelamento exibidos de forma clara.
- Apex Pro aparece como **Em preparação** enquanto preço e ativação não forem definidos.
- Histórico de cobranças com situação, valor e acesso à fatura hospedada.
- Estados de carregamento, erro, checkout concluído e checkout cancelado.

## v0.41.0 — Checkout e portal server-side

- Adaptador Stripe isolado e executado somente no servidor.
- Checkout hospedado para assinatura recorrente.
- Portal hospedado para pagamento, troca de método e cancelamento.
- Validação do Price ID, moeda, valor e periodicidade antes de criar o checkout.
- Sessões de checkout auditadas e criação idempotente para reduzir cliques duplicados.
- Nenhuma Secret Key é enviada ao navegador.

## v0.42.0 — Webhook, faturas e consolidação

- Verificação obrigatória da assinatura criptográfica do webhook.
- Eventos processados uma única vez por identificador do provedor.
- Sincronização de cliente, assinatura, período, cancelamento e faturas.
- Erros ficam registrados em auditoria privada para permitir nova tentativa.
- O usuário lê somente seus próprios registros; eventos internos não ficam disponíveis ao navegador.
- A exclusão de conta impede apagar uma conta com renovação ou pendência ativa, evitando uma assinatura órfã.
- Exportação da conta passa ao esquema 2.2 e inclui dados de cobrança pertencentes ao usuário.

## Escolha técnica e limites

O banco aceita `stripe`, `mercado_pago` e `manual`, portanto uma troca futura não exige redesenhar os dados. O primeiro adaptador foi implementado para Stripe por oferecer Checkout de assinaturas e portal hospedado em uma integração coesa. A decisão comercial continua aberta: o [Mercado Pago também oferece assinaturas, período de teste e meios locais](https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview), enquanto a [Stripe publica preços específicos para pagamentos e Billing no Brasil](https://stripe.com/br/pricing).

`APEX_BILLING_ENABLED` permanece `false`. O Apex Pro fica inativo e sem preço. Assim, instalar esta versão não inicia cobrança nem pede cartão.

## Banco e segurança

- Migration: `supabase/migrations/20260718050000_billing_foundation.sql`.
- Cria seis tabelas, índices, triggers, RLS e a função `my_billing_access`.
- O navegador recebe somente `select` nas tabelas necessárias; não pode criar ou alterar cliente, assinatura, fatura ou checkout.
- Operações administrativas exigem `SUPABASE_SECRET_KEY` somente no servidor.
- Credenciais Stripe são lidas somente nas rotas server-side.
- A migration é idempotente e não contém `drop table`, `truncate` ou exclusão de dados do usuário.

## Validação executada

- Análise sintática do SQL: aprovada.
- Execução da migration em PostgreSQL local: aprovada duas vezes consecutivas.
- Teste local: seis tabelas, cinco políticas, dois planos, fallback Beta, acesso Pro, bloqueio de escrita, auditoria privada e isolamento entre duas contas aprovados.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem erros.
- `npm run build`: aprovado com Next.js 16.2.9 e as três rotas dinâmicas de cobrança.
- Servidor de produção standalone: alcançou `Ready`; requisições HTTP em outro processo não puderam atravessar o isolamento de rede do executor.

## Dependências externas não testadas

- Criação da conta Stripe e verificação cadastral da empresa.
- Definição de preço, período de teste, recursos Pro e política de cancelamento.
- Criação do Product/Price em modo de teste.
- Configuração de Secret Key, webhook e portal no ambiente de deploy.
- Republicação da Edge Function `delete-account` incluída nesta versão.
- Checkout, renovação, falha, cancelamento e reativação ponta a ponta no provedor real.
- Revisão jurídica, fiscal, contábil e de proteção ao consumidor antes de cobrar usuários.
