# Apex v0.18.0 — Favoritos e alimentos recentes

## Implementado

- Ação de favoritar e desfavoritar alimentos nos dois seletores da Dieta.
- Filtros **Todos**, **Favoritos** e **Recentes** em **Escolher ingrediente**.
- Os mesmos filtros em **Editar consumido → Adicionar alimento extra**.
- Favoritos persistentes e separados por usuário no Supabase.
- Favoritos priorizados também na listagem geral.
- Alimentos recentes derivados das refeições realmente consumidas nos últimos 30 dias.
- Atualização imediata dos recentes após registrar uma refeição ou salvar o consumo real.
- Compatibilidade com alimentos TACO e personalizados.
- Mensagens de erro dentro dos modais quando a atualização do favorito falha.
- Inclusão dos favoritos na exportação dos dados da conta.
- Funções de filtro, ordenação e consolidação centralizadas em `src/lib/diet/foodDiscovery.ts`.

## Banco de dados

Nova migration: `supabase/migrations/20260717060000_diet_food_favorites.sql`.

Ela cria `diet_food_favorites` com:

- chave composta por `user_id` e `food_id`;
- referências a `auth.users` e `food_catalog`;
- índice por usuário e data de criação;
- políticas RLS para leitura, inclusão e remoção somente pelo proprietário;
- validação de que alimentos personalizados pertencem à mesma conta.

Alimentos recentes não exigem uma nova tabela: são obtidos de `diet_consumption_entries`.

## Arquivos principais alterados

- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/IngredientPicker.tsx`
- `src/components/diet/ConsumptionEditor.tsx`
- `src/lib/diet/foodDiscovery.ts`
- `src/lib/diet/service.ts`
- `src/lib/supabase/database.types.ts`
- `src/lib/account/service.ts`
- `supabase/migrations/20260717060000_diet_food_favorites.sql`
- `package.json`
- `package-lock.json`

## Validação executada

- `npm install`: concluído.
- `npm run typecheck`: aprovado sem erros.
- `npm run lint`: aprovado sem erros; permanecem 28 avisos antigos em arquivos não relacionados.
- `npm run build`: aprovado com todas as rotas compiladas.
- Teste isolado: aprovado para prioridade dos favoritos, filtros, ordem dos recentes e remoção de duplicatas.
- Migration revisada estaticamente; execução e RLS dependem de validação no Supabase real.

## Delimitação

- **Recentes** considera alimentos presentes em consumos reais dos últimos 30 dias.
- Apenas visualizar, pesquisar ou substituir um item sem consumi-lo não cria um uso recente.
- Leitura de código de barras permanece fora desta versão.
