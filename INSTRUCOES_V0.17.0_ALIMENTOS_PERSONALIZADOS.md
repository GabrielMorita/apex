# Apex v0.17.0 — Atualização e teste

## Executar a migration

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor** e clique em **New query**.
3. Abra o arquivo `supabase/migrations/20260717050000_custom_foods.sql` do projeto extraído.
4. Copie todo o conteúdo, cole no editor e clique em **Run**.
5. O resultado esperado é `Success. No rows returned`.

Não apague nem execute novamente as migrations anteriores. Esta migration é idempotente e não destrutiva.

## Atualizar o aplicativo

1. Extraia o ZIP em uma pasta nova.
2. Copie o `.env.local` da v0.16.0.
3. Execute `npm install` e `npm run dev`.
4. Confirme a versão com `node -p "require('./package.json').version"`; o resultado deve ser `0.17.0`.

## Testar

1. Abra **Dieta → Meus alimentos**.
2. Clique em **Novo alimento** e use dados reais de um rótulo ou fonte confiável.
3. Salve e confirme o cartão com o marcador **Pessoal**.
4. Em uma refeição, clique em **Escolher** e procure o alimento quando a categoria for compatível.
5. Marque uma refeição como consumida, clique em **Editar consumido → Adicionar alimento extra** e procure o cadastro.
6. Salve o consumo e confira os totais em Dieta, Hoje e Progresso.
7. Edite o alimento e confirme que novos usos consideram os valores atualizados.
8. Arquive o alimento e confirme que ele deixa de aparecer nos seletores, sem apagar consumos anteriores.
9. Atualize a página e confirme a persistência.
10. Com uma segunda conta, confirme que o alimento não aparece.

