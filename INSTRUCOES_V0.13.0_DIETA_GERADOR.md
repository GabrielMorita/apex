# Apex v0.13.0 — Instalação e teste

## 1. Executar a migration no Supabase

1. Abra o mesmo projeto Supabase usado pelo Apex.
2. Entre em **SQL Editor** e clique em **New query**.
3. Abra `supabase/migrations/20260717030000_diet_weekly_generator.sql` no projeto recebido.
4. Copie todo o conteúdo, cole no SQL Editor e clique em **Run query**.
5. O resultado esperado é `Success. No rows returned`.

A migration é idempotente e não apaga preferências, metas ou planos existentes. O editor pode alertar sobre operações potencialmente destrutivas por causa da recriação de políticas e gatilhos; não há `drop table` nem remoção de dados do usuário.

## 2. Rodar localmente

1. Extraia o ZIP em uma nova pasta.
2. Copie `.env.example` para `.env.local` e preencha somente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Não use `service_role`, Secret Key ou senha do banco no frontend.
4. No terminal, dentro da pasta do projeto, execute:

```bash
npm install
npm run dev
```

5. Abra `http://localhost:3000`, entre e acesse **Dieta**.

## 3. Roteiro curto de validação

1. Na Dieta já configurada, clique em **Gerar plano de 7 dias**.
2. Confirme que aparecem sete dias e que cada um contém a quantidade de refeições escolhida no onboarding.
3. Atualize a página e confirme que o plano continua igual.
4. Use **Trocar** em uma refeição e confirme que somente ela muda.
5. Clique no cadeado de uma refeição, use **Regerar dia** e confirme que a refeição bloqueada não muda.
6. Use **Desfazer** e confirme o retorno do conteúdo anterior.
7. Use **Regerar semana** e confirme que refeições bloqueadas permanecem.
8. Saia da conta, entre novamente e confirme a persistência.
9. Entre com uma segunda conta e confirme que ela não enxerga o plano da primeira.
10. Altere uma preferência ou meta, volte à tela inicial e confira o aviso para regerar com os dados atuais.

## 4. O que depende do ambiente real

- Execução e permissões da função RPC `save_weekly_diet_plan`.
- Políticas RLS e isolamento entre contas.
- Persistência após F5, logout e novo login.
- Comportamento com sessão expirada ou conexão interrompida.
- Revisão das porções e combinações por nutricionista antes de comercialização.

O `.env.local`, a pasta `.next` e `node_modules` não fazem parte do ZIP final.
