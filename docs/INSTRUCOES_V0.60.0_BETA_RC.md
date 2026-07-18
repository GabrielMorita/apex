# Instalação — Apex v0.60.0 candidato a beta

## 1. Banco de dados

Não apague nenhuma query, migration ou tabela anterior.

Se a migration de privacidade ainda não foi executada, abra o **SQL Editor** do Supabase, crie uma nova query e execute primeiro todo o arquivo:

```text
20260718060000_privacy_lgpd_foundation.sql
```

Depois, em outra query, execute todo o arquivo:

```text
20260718070000_launch_readiness.sql
```

O resultado normal para cada arquivo é:

```text
Success. No rows returned
```

Não use a Secret Key no navegador. A função de limite de requisições é chamada apenas pelas rotas server-side.

## 2. Variáveis do ambiente

Copie `.env.example` para `.env.local` e preencha os valores reais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
NEXT_PUBLIC_DATA_CONTROLLER_NAME=Nome ou razão social
NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=privacidade@seu-dominio.com.br
NEXT_PUBLIC_SUPPORT_EMAIL=suporte@seu-dominio.com.br
APEX_BILLING_ENABLED=false
```

Mantenha `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `SUPABASE_SECRET_KEY` vazias enquanto a cobrança estiver desativada. No deploy futuro, essas chaves são segredos exclusivos do servidor.

## 3. Validação local

```bash
npm install
npm run check
npm run security:audit
npm run dev
```

Para executar o E2E público pela primeira vez:

```bash
npx playwright install chromium
npm run test:e2e
```

## 4. Validação manual no Supabase real

1. Abra `/api/health` e confirme `status: "ok"` e versão `0.60.0`.
2. Abra `/suporte`, `/termos`, `/privacidade` e `/dados-saude` sem login.
3. Crie uma conta descartável, confirme o e-mail e conclua Perfil, Dieta e Treino.
4. Saia e entre novamente; atualize a página nos fluxos principais.
5. Use uma segunda conta e valide que ela não acessa dados da primeira.
6. Teste exportação e exclusão com uma conta descartável.
7. Confirme que rotas de cobrança continuam indisponíveis com `APEX_BILLING_ENABLED=false`.
8. Verifique **Security Advisor** e **Performance Advisor** no Supabase.

## 5. Deploy

### Vercel

1. Envie o projeto a um repositório privado.
2. Importe o repositório na Vercel.
3. Cadastre as variáveis de ambiente para **Preview** e **Production**.
4. Mantenha os segredos apenas nas configurações protegidas do projeto.
5. Faça primeiro um Preview, execute o checklist e só depois promova para Production.

### Docker

Informe as variáveis `NEXT_PUBLIC_*` como argumentos de build e os segredos server-side somente em runtime. A imagem expõe a porta 3000 e verifica `/api/health`.

## 6. Antes de convidar usuários

- Configure domínio, HTTPS, SMTP próprio e e-mails de confirmação.
- Ative MFA na conta administrativa do Supabase.
- Revise restrições de rede, proteção contra abuso, CAPTCHA e limites de autenticação.
- Confirme backups e faça ao menos um ensaio de restauração.
- Configure monitoramento externo de `/api/health` e alertas de erro.
- Preencha e revise juridicamente controlador, privacidade, suporte e documentos.
- Comece com um grupo pequeno de beta e cobrança desativada.
