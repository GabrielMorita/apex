# Apex v0.23.0 — Modelos de refeições

## Implementado

- Novo cartão **Modelos de refeições** na Dieta.
- Salvamento dos itens e quantidades visíveis no editor como um modelo nomeado.
- Modelos disponíveis para reutilização em qualquer refeição e semana futura.
- Aplicação do modelo dentro do editor sem alterar o plano antes da confirmação do usuário.
- Substituição completa dos itens atuais pelo conteúdo do modelo.
- Recálculo com nome, porção e composição atual dos alimentos e receitas do catálogo.
- Bloqueio da aplicação quando o modelo contém um item arquivado ou indisponível.
- Arquivamento de modelos com confirmação.
- Proteção contra nomes ativos duplicados e alimentos repetidos.
- Persistência privada no Supabase, sem `localStorage`.
- Inclusão dos modelos e de seus itens na exportação de dados da conta, agora no esquema 1.7.

## Banco e segurança

- Novas tabelas `public.diet_meal_templates` e `public.diet_meal_template_items`.
- Novas funções atômicas `save_diet_meal_template` e `archive_diet_meal_template`.
- Cálculo nutricional feito no servidor a partir do catálogo autorizado.
- RLS com `auth.uid()` nas duas tabelas.
- Usuários autenticados recebem leitura das próprias linhas; escrita ocorre apenas pelas funções validadas.
- Itens de referência precisam estar ativos e itens pessoais precisam pertencer ao usuário atual.

## Arquivos principais

- `src/components/diet/MealTemplateManager.tsx`
- `src/components/diet/PlannedMealEditor.tsx`
- `src/components/diet/DietHome.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/lib/diet/planEditing.ts`
- `src/lib/diet/service.ts`
- `src/lib/diet/types.ts`
- `src/lib/account/service.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/20260718000000_diet_meal_templates.sql`

## Validação funcional local

- `npm install`: concluído; dependências já estavam atualizadas.
- TypeScript (`npm run typecheck`): aprovado.
- ESLint (`npm run lint`): aprovado com 0 erros e 28 avisos antigos, fora do escopo desta versão.
- Build de produção (`npm run build`): aprovado com Next.js 16.2.9.
- Aplicação com recálculo pelo catálogo atual: aprovada.
- Preservação das quantidades do modelo: aprovada.
- Bloqueio de modelo com item indisponível: aprovado.

## Limites desta versão

- Modelos podem ser criados e arquivados; renomear um modelo existente ainda não foi implementado.
- Aplicar um modelo muda o estado do editor, mas exige **Salvar no plano** para persistir.
- Persistência, RLS e isolamento precisam ser confirmados em um Supabase real.
