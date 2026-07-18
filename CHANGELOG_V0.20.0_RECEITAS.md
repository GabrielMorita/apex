# Apex v0.20.0 — Receitas e preparações

## Implementado

- Novo cartão **Minhas receitas** na Dieta.
- Cadastro e edição de preparações com nome, categoria, porções, rendimento final, tempo e modo de preparo.
- Seleção de 2 a 30 ingredientes do catálogo TACO ou dos alimentos pessoais.
- Quantidade individual em gramas para cada ingrediente.
- Sugestão inicial de rendimento pela soma dos ingredientes, com ajuste manual para perdas ou ganhos no preparo.
- Cálculo automático de energia, proteínas, carboidratos, gorduras e fibras.
- Visualização dos macronutrientes por porção antes de salvar.
- Compatibilidade alimentar e alérgenos derivados dos ingredientes no servidor.
- Receita publicada automaticamente como item privado no catálogo do próprio usuário.
- Uso da receita em **Escolher ingrediente**, favoritos e edição do consumo real.
- Identificação visual específica com o selo **Receita**.
- Edição e arquivamento sem alterar planos ou históricos já registrados.
- Expansão automática das receitas em seus ingredientes na lista de compras semanal.
- Receitas e ingredientes incluídos na exportação dos dados da conta, agora no esquema 1.6.

## Banco e segurança

- Novas tabelas `public.diet_recipes` e `public.diet_recipe_items`.
- Ligação segura entre receita e a linha derivada em `public.food_catalog`.
- RLS por usuário em todas as novas tabelas.
- Funções atômicas `save_diet_recipe` e `archive_diet_recipe` com validação explícita de `auth.uid()`.
- Alterações diretas em linhas de catálogo geradas por receitas são bloqueadas; a sincronização ocorre apenas pelas funções controladas.
- Receitas dentro de receitas permanecem bloqueadas para evitar ciclos e cálculos ambíguos.

## Arquivos principais

- `src/components/diet/RecipeManager.tsx`
- `src/components/diet/DietHome.tsx`
- `src/components/diet/IngredientPicker.tsx`
- `src/components/diet/ConsumptionEditor.tsx`
- `src/components/diet/ShoppingList.tsx`
- `src/lib/diet/recipe.ts`
- `src/lib/diet/shopping.ts`
- `src/lib/diet/service.ts`
- `src/lib/diet/types.ts`
- `src/lib/account/service.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/20260717080000_diet_recipes.sql`

## Limites desta versão

- A receita usa a composição atual dos ingredientes no momento do salvamento.
- Cozimento pode alterar água, peso e nutrientes; o resultado continua sendo uma estimativa editável, não uma análise laboratorial.
- Receitas não são inseridas automaticamente em planos já existentes; elas ficam disponíveis para escolha e novos usos.
- Persistência, RLS e isolamento ainda precisam ser confirmados em um Supabase real.

## Validação executada

- `npm install`: concluído, dependências já atualizadas.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 28 avisos antigos e 0 erros.
- `npm run build`: aprovado no Next.js 16.2.9.
- Teste isolado de totais, valores por porção, rendimento e bloqueio de duplicatas: aprovado.
- Teste isolado de expansão proporcional da receita na lista de compras: aprovado.
