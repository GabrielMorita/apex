# Apex v0.25.0 — Comparativo nutricional semanal

## Implementado

- Períodos selecionáveis de **4, 8 ou 12 semanas** no Progresso alimentar.
- Comparação da semana atual com a semana anterior.
- Médias de energia, proteína, carboidratos e gorduras por dia registrado.
- Comparação de cada média com a meta diária atualmente salva na Dieta.
- Diferença neutra em relação à média da semana anterior.
- Tendência semanal de energia com indicação visual da meta.
- Contagem de dias e refeições registrados em cada semana.
- Indicadores consolidados e histórico recente atualizados conforme o período escolhido.

## Regras dos cálculos

- A única fonte é `diet_consumption_entries`, já protegida por RLS.
- Um dia entra na média somente quando possui ao menos uma refeição consumida registrada.
- Semanas sem registros permanecem sem média e não são interpretadas como consumo zero.
- A semana atual é identificada como parcial e considera registros somente até o dia corrente.
- A faixa energética continua sendo de 85% a 115% da meta provisória.
- Os textos descrevem variações de registro e não fazem diagnóstico ou interpretação clínica.

## Estados da interface

- Carregamento a cada troca de período.
- Erro de sessão, conexão ou ausência da migration de consumo.
- Ausência de configuração da Dieta.
- Semana atual sem registros.
- Semana anterior sem base suficiente para comparação.
- Semanas vazias visíveis na tendência.

## Banco e segurança

- Nenhuma migration nova é necessária.
- A consulta usa o usuário autenticado e o intervalo correspondente ao período selecionado.
- Nenhum dado fictício foi adicionado.
- Não há gravação nova em `localStorage` nem segunda fonte de consumo.

## Arquivos principais

- `src/components/diet/NutritionProgress.tsx`
- `src/components/diet/WeeklyNutritionComparison.tsx`
- `src/lib/diet/analytics.ts`
- `docs/APEX-ROADMAP.md`

## Validação local

- TypeScript (`npm run typecheck`): aprovado.
- ESLint (`npm run lint`): 0 erros e 28 avisos antigos fora do escopo.
- Build de produção (`npm run build`): consultar o resultado final da entrega.

## Teste pendente em Supabase real

- Confirmar os períodos de 4, 8 e 12 semanas com registros reais.
- Confirmar semanas vazias, semana anterior vazia e semana atual parcial.
- Alterar uma refeição consumida e confirmar a atualização do comparativo.
- Confirmar persistência após atualizar a página e isolamento com duas contas.
