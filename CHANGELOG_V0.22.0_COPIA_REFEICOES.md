# Apex v0.22.0 — Cópia de refeições entre dias

## Implementado

- Novo botão **Copiar** em todas as refeições do plano semanal.
- Seleção de um ou vários dias de destino na mesma operação.
- Opção para selecionar ou desmarcar todos os destinos disponíveis.
- Cópia dos alimentos, receitas, quantidades e valores nutricionais da origem.
- Preservação do nome e do horário da refeição em cada destino.
- Refeições de destino bloqueadas ficam desativadas e não podem ser substituídas.
- Identificação dos destinos que já possuem consumo registrado.
- O consumo real já salvo permanece intacto; somente o plano é alterado.
- Recálculo automático dos totais de cada refeição e dia alterado.
- Uma única persistência atômica do plano semanal para todos os destinos.
- Integração com **Desfazer** após a cópia.
- Atualização automática da lista de compras, incluindo expansão das receitas.
- O diálogo permanece aberto se o Supabase rejeitar o salvamento.

## Banco de dados

- Nenhuma migration nova é necessária.
- A versão reutiliza `save_weekly_diet_plan` e as políticas RLS existentes.
- Nenhum dado novo é mantido apenas no navegador.

## Arquivos principais

- `src/components/diet/CopyMealDialog.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/lib/diet/planEditing.ts`

## Validação funcional local

- Cópia de itens para outro dia: aprovada.
- Preservação do nome e horário de destino: aprovada.
- Recálculo dos totais do destino: aprovado.
- Proteção de destino bloqueado: aprovada.
- Clonagem independente dos itens: aprovada.
- `npm install`: concluído, dependências já atualizadas.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 28 avisos antigos e 0 erros.
- `npm run build`: aprovado no Next.js 16.2.9.

## Limites desta versão

- A cópia funciona dentro da semana atualmente carregada.
- Modelos reutilizáveis entre semanas ainda não foram implementados.
- Persistência, desfazer e atualização da lista de compras dependem do teste no Supabase real.
