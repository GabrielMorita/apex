# Apex v0.17.0 — Alimentos personalizados

## Implementado

- Área **Meus alimentos** dentro da Dieta.
- Cadastro de alimentos e preparações com composição por 100 g.
- Campos de nome, categoria, calorias, proteínas, carboidratos, gorduras, fibras, porção, compatibilidade alimentar e alérgenos.
- Validações centralizadas com limites plausíveis e suporte a vírgula decimal.
- Edição de alimentos próprios sem alterar retratos já salvos no histórico.
- Arquivamento no lugar de exclusão física para preservar planos e consumos anteriores.
- Identificação visual **Pessoal** nos seletores.
- Uso dos alimentos próprios em **Escolher ingrediente** e **Adicionar alimento extra**.
- Recálculo de porção, calorias e macros pelas mesmas funções usadas no catálogo TACO.
- Atualização automática do catálogo após criar, editar ou arquivar.
- Inclusão de alimentos personalizados na exportação dos dados da conta.
- Nenhum alimento personalizado é compartilhado entre contas.

## Banco de dados

Nova migration: `supabase/migrations/20260717050000_custom_foods.sql`.

Ela amplia `food_catalog` com:

- `user_id` opcional para distinguir registros públicos e pessoais;
- `source_type` com valores `reference` e `custom`;
- chave estrangeira para `auth.users`;
- índice de consulta por usuário;
- nome ativo único por usuário;
- políticas RLS de leitura e escrita por proprietário.

Registros TACO continuam globais e somente leitura. Registros personalizados ficam disponíveis exclusivamente para o usuário que os criou.

## Arquivos principais alterados

- `src/components/diet/CustomFoodManager.tsx`
- `src/components/diet/DietHome.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/IngredientPicker.tsx`
- `src/components/diet/ConsumptionEditor.tsx`
- `src/lib/diet/customFood.ts`
- `src/lib/diet/service.ts`
- `src/lib/diet/types.ts`
- `src/lib/supabase/database.types.ts`
- `src/lib/account/service.ts`
- `supabase/migrations/20260717050000_custom_foods.sql`
- `package.json`
- `package-lock.json`

## Validação executada

- `npm install`: concluído.
- `npm run typecheck`: aprovado sem erros.
- `npm run lint`: aprovado sem erros; permanecem 28 avisos antigos em arquivos não relacionados.
- `npm run build`: aprovado com todas as rotas compiladas.
- Teste isolado: aprovado para vírgula decimal, limites, alérgenos e entrada do alimento pessoal nas substituições compatíveis.
- Migration revisada estaticamente; execução e políticas RLS dependem de validação no Supabase real.

## Delimitação

- Valores personalizados são informados pelo usuário e não recebem selo TACO.
- Leitura de código de barras e consulta automática de produtos ficam para uma etapa posterior.
- O arquivamento remove o alimento dos novos seletores, mas mantém referências e retratos históricos.
