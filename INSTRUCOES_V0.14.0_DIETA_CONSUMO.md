# Apex v0.14.0 — Instalação e teste

## 1. Executar a migration

1. Abra o mesmo projeto no Supabase.
2. Entre em **SQL Editor** e crie uma nova consulta.
3. Cole todo o conteúdo de `supabase/migrations/20260717040000_diet_consumption.sql`.
4. Clique em **Run query**.
5. O resultado esperado é `Success. No rows returned`.

A migration não possui `drop table` e não remove o plano semanal existente.

## 2. Atualizar o projeto local

1. Extraia o ZIP da v0.14.0 em uma pasta nova.
2. Copie o `.env.local` da versão anterior.
3. Execute `npm install` e `npm run dev`.
4. Confirme a versão com `node -p "require('./package.json').version"`; o resultado deve ser `0.14.0`.

## 3. Testar

1. Abra **Dieta**; o plano semanal anterior deve continuar carregado.
2. Clique em **Registrar como consumida** em uma refeição.
3. Confirme o selo **Consumida** e a atualização do quadro **Progresso consumido**.
4. Atualize a página e confirme a persistência.
5. Clique em **Marcar como pendente** e confirme a redução do progresso.
6. Registre uma refeição, troque um ingrediente no planejamento e confirme que o progresso consumido preserva o retrato anterior.
7. Saia, entre novamente e confirme o histórico.
8. Use uma segunda conta para validar o isolamento.

O `.env.local`, `.next` e `node_modules` não acompanham o ZIP.
