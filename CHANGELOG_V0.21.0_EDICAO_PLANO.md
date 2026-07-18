# Apex v0.21.0 — Edição completa do plano

## Implementado

- Novo botão **Editar** em cada refeição desbloqueada do plano semanal.
- Ajuste direto da quantidade em gramas de qualquer item planejado.
- Remoção de itens, preservando pelo menos um alimento por refeição.
- Inclusão de alimentos pessoais, itens TACO ou receitas inteiras sem substituir outro ingrediente.
- Filtro específico **Receitas**, além de todos, favoritos e recentes.
- Respeito ao padrão alimentar, alergias, restrições e alimentos rejeitados já configurados.
- Cálculo imediato de energia e macronutrientes dentro do editor.
- Recálculo automático dos totais da refeição e do dia após salvar.
- Persistência no plano semanal existente do Supabase.
- Integração com o recurso **Desfazer** já existente.
- Atualização automática da lista de compras após inclusão, remoção ou mudança de quantidade.
- Expansão dos ingredientes quando uma receita completa é adicionada ao plano.
- Aviso específico quando a refeição já possui consumo registrado; o histórico real permanece imutável.
- Confirmação antes de descartar alterações não salvas.
- Limite de 13 itens por refeição, compatível com o esquema atual do banco.

## Banco de dados

- Nenhuma migration nova é necessária.
- A versão reutiliza `save_weekly_diet_plan`, as tabelas do plano semanal e as políticas RLS já aplicadas.
- Nenhum novo dado foi colocado em `localStorage`.

## Arquivos principais

- `src/components/diet/PlannedMealEditor.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/lib/diet/planEditing.ts`

## Validação funcional local

- Inclusão de uma receita como novo item: aprovada.
- Recálculo após alteração de quantidade: aprovado.
- Recálculo dos totais da refeição e do dia: aprovado.
- Normalização da ordem dos itens para persistência: aprovada.
- `npm install`: concluído, dependências já atualizadas.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 28 avisos antigos e 0 erros.
- `npm run build`: aprovado no Next.js 16.2.9.

## Limites desta versão

- O editor altera os itens da refeição, mas ainda não copia uma refeição inteira para outros dias.
- Refeições bloqueadas precisam ser desbloqueadas antes da edição.
- A persistência após atualização, o desfazer e a integração com a lista de compras dependem do teste no Supabase real.
