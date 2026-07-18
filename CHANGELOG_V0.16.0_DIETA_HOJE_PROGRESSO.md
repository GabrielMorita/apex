# Apex v0.16.0 — Dieta em Hoje e Progresso

## Implementado

- Resumo nutricional real na tela **Hoje**, respeitando a data selecionada na semana.
- Comparação de energia, proteína, carboidratos e gorduras consumidos com as metas atuais.
- Quantidade de refeições registradas no dia e acesso direto à Dieta.
- Nova aba **Alimentação** em **Progresso**.
- Gráfico dos últimos sete dias com consumo de energia em relação à meta provisória.
- Indicadores de dias registrados, refeições, média calórica e faixa de aderência.
- Médias de energia e macronutrientes calculadas apenas sobre dias que possuem registros.
- Histórico alimentar real dos últimos 28 dias, com totais e quantidade de refeições.
- Estado vazio quando não há consumo e mensagens para sessão, conexão e migration ausente.
- Agregações centralizadas em `src/lib/diet/analytics.ts`.
- Consulta reutilizável por intervalo de datas em `src/lib/diet/service.ts`.

## Banco de dados

Nenhuma migration nova é necessária. A versão utiliza `diet_consumption_entries`, criada e validada na v0.14.0, sempre sob as políticas RLS existentes.

## Arquivos principais alterados

- `src/app/dashboard/page.tsx`
- `src/app/progresso/page.tsx`
- `src/components/diet/NutritionProgress.tsx`
- `src/components/workspaces/ProgressOverview.tsx`
- `src/lib/diet/analytics.ts`
- `src/lib/diet/service.ts`
- `package.json`
- `package-lock.json`

## Validação executada

- `npm install`: concluído.
- `npm run typecheck`: aprovado sem erros.
- `npm run lint`: aprovado sem erros; permanecem 28 avisos antigos em arquivos não relacionados.
- `npm run build`: aprovado com todas as rotas compiladas.
- Teste isolado das agregações: aprovado para múltiplas refeições no mesmo dia, troca da data selecionada, estado vazio e cálculo de médias.

## Delimitação

- O histórico cobre os últimos 28 dias nesta versão.
- Dias sem nenhuma refeição registrada não recebem valores inventados e não entram nas médias.
- A faixa de 85% a 115% é apenas uma referência visual em torno da meta provisória, não uma avaliação clínica.
