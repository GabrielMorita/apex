# Apex v0.15.0 — Edição do consumo real

## Implementado

- Botão **Editar consumido** em cada refeição já registrada.
- Edição da quantidade efetivamente consumida em gramas.
- Remoção de alimentos que estavam planejados, mas não foram ingeridos.
- Inclusão de alimentos extras a partir do catálogo TACO.
- Busca de extras filtrada por padrão alimentar, alergias, restrições e rejeições.
- Identificação visual dos itens extras.
- Recálculo imediato dos macros do item, da refeição e do progresso diário.
- Planejamento original preservado durante todas as alterações do consumo.
- Compatibilidade com registros criados na v0.14.0, tratados automaticamente como itens planejados.
- Operações de cálculo centralizadas em `src/lib/diet/consumption.ts` para reutilização futura no Dashboard e em Progresso.

## Banco de dados

Nenhuma migration nova é necessária. A v0.14.0 já armazena o retrato consumido em `items_snapshot` e a função RPC existente atualiza esse conteúdo com segurança.

## Arquivos principais alterados

- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/ConsumptionEditor.tsx`
- `src/lib/diet/consumption.ts`
- `src/lib/diet/service.ts`
- `src/lib/diet/types.ts`
- `package.json`
- `package-lock.json`

## Validação executada

- `npm install`: concluído.
- `npm run typecheck`: aprovado sem erros.
- `npm run lint`: aprovado sem erros; permanecem 28 avisos antigos em arquivos não relacionados.
- `npm run build`: aprovado com todas as rotas compiladas.
- Teste isolado do consumo real: aprovado para recálculo de quantidade, preservação do plano original, inclusão de alimento extra e consolidação de extras repetidos.

## Delimitação

- Quantidades são registradas em gramas nesta versão.
- Cadastro de alimentos personalizados e leitura de código de barras continuam pendentes.
- O acompanhamento é uma estimativa pessoal, não avaliação ou prescrição clínica.
