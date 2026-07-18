# Apex v0.18.0 — Atualização e teste

## Executar a migration

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor** e clique em **New query**.
3. Abra `supabase/migrations/20260717060000_diet_food_favorites.sql`.
4. Copie todo o conteúdo, cole no editor e clique em **Run**.
5. O resultado esperado é `Success. No rows returned`.

Execute somente a nova migration. Não apague as queries ou tabelas existentes.

## Atualizar o aplicativo

1. Extraia o ZIP em uma pasta nova.
2. Copie o `.env.local` da v0.17.0.
3. Execute `npm install` e `npm run dev`.
4. Confirme a versão com `node -p "require('./package.json').version"`; o resultado deve ser `0.18.0`.

## Testar favoritos

1. Abra **Dieta** e, em uma refeição, clique em **Escolher**.
2. Clique na estrela de um alimento.
3. Abra o filtro **Favoritos** e confirme que o alimento aparece.
4. Atualize a página e confirme a persistência.
5. Desmarque a estrela e confirme a remoção do filtro.
6. Repita em **Editar consumido → Adicionar alimento extra**.

## Testar recentes

1. Registre uma refeição como consumida ou salve um consumo real com um alimento extra.
2. Abra novamente um seletor e escolha **Recentes**.
3. Confirme que os alimentos consumidos aparecem.
4. Use uma segunda conta para confirmar que favoritos e recentes não são compartilhados.

