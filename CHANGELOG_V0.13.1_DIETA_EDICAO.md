# Apex v0.13.1 — Edição do plano alimentar

## Implementado

- Botão **Escolher** em cada ingrediente de uma refeição desbloqueada.
- Seletor pesquisável com alternativas compatíveis do catálogo nutricional.
- Filtro obrigatório por padrão alimentar, alergias, restrições e alimentos rejeitados.
- Exclusão dos alimentos que já estão na mesma refeição para evitar duplicação acidental.
- Ajuste automático da nova porção para preservar aproximadamente as calorias do ingrediente substituído.
- Recálculo imediato de energia e macronutrientes do item, da refeição e do dia.
- Persistência da substituição no Supabase usando o salvamento atômico existente.
- Aviso flutuante de sucesso/erro sempre visível, com botão **Desfazer** ao lado.
- O botão **Desfazer** do cabeçalho foi mantido como acesso adicional.

## Banco de dados

Nenhuma migration nova é necessária. A estrutura normalizada aplicada na v0.13.0 já comporta substituições de ingredientes.

## Arquivos principais alterados

- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/IngredientPicker.tsx`
- `src/lib/diet/generator.ts`
- `package.json`
- `package-lock.json`

## Validação

- TypeScript aprovado.
- Lint sem erros novos; permanecem 28 avisos antigos não relacionados.
- Build de produção aprovado.
- Substituição validada quanto a compatibilidade, porção energética, recálculo dos totais e desfazer.
