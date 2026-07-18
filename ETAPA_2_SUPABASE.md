# Etapa 2 — Supabase, login e banco de dados

## O que esta versão já faz

- cadastro com e-mail e senha;
- confirmação de e-mail;
- login e logout;
- recuperação e alteração de senha;
- sessão por cookies compatível com SSR;
- proteção de todas as páginas privadas pelo `proxy.ts` do Next.js 16;
- perfis separados por usuário;
- Row Level Security (RLS);
- sincronização automática dos dados que antes ficavam somente no `localStorage`;
- separação dos dados locais por conta no mesmo dispositivo;
- migração automática dos dados locais antigos para a primeira conta usada.

## 1. Criar o projeto

1. Entre no Supabase e crie um projeto.
2. No painel do projeto, abra **SQL Editor**.
3. Copie todo o conteúdo de:

```text
supabase/migrations/20260717000000_initial_auth_and_user_data.sql
```

4. Execute o SQL uma única vez.

## 2. Configurar as chaves

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Use somente a **Publishable Key** no frontend. Nunca coloque a Secret Key ou a antiga `service_role` em uma variável `NEXT_PUBLIC_*`.

## 3. Configurar URLs de autenticação

No Supabase, abra **Authentication > URL Configuration**.

Durante o desenvolvimento:

```text
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/**
```

Quando publicar, substitua ou acrescente o domínio real, por exemplo:

```text
https://app.seudominio.com/**
```

## 4. Configurar os e-mails para SSR

Em **Authentication > Email Templates**, altere os links dos templates.

### Confirm signup

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirmar meu e-mail
</a>
```

### Reset password

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/atualizar-senha">
  Redefinir minha senha
</a>
```

## 5. Segurança recomendada no painel

Em **Authentication > Providers > Email**:

- mantenha confirmação de e-mail ativada;
- use senha mínima de pelo menos 8 caracteres;
- ative requisitos de maiúsculas, minúsculas, número e símbolo quando preparar a produção;
- configure SMTP próprio antes de vender o produto;
- considere CAPTCHA antes de abrir cadastro público.

O serviço de e-mail padrão do Supabase é adequado apenas para testes e possui limite baixo.

## 6. Rodar

```bash
npm install
npm run check
npm run dev
```

Sem `.env.local`, o Apex entra em modo seguro e exibe `/configurar-supabase` em vez de liberar as telas privadas.

## Estrutura criada no banco

### `profiles`

Dados básicos do usuário e estado do onboarding.

### `user_module_state`

Armazena, por usuário e por módulo, os dados atuais do aplicativo em JSONB. Esta tabela é uma ponte segura para colocar o protótipo online rapidamente. Nas próximas etapas, os módulos mais importantes serão migrados para tabelas relacionais próprias, começando por hábitos, treinos e progresso.

## Limite desta etapa

A sincronização já evita que os dados fiquem presos a um navegador, mas ainda não substitui o desenho final das tabelas de negócio. Também faltam pagamentos, termos, privacidade, monitoramento e testes completos antes da comercialização.
