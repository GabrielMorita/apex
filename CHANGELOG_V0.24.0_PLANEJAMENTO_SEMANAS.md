# Apex v0.24.0 — Planejamento entre semanas

## Implementado

- Navegação para a semana anterior e para a próxima diretamente na Dieta.
- Retorno rápido para a semana atual.
- Faixa visual com até dez semanas já salvas pelo usuário.
- Identificação clara entre semana atual, planejamento futuro e histórico.
- Geração de um plano novo em qualquer semana atual ou futura sem plano.
- Cópia integral da semana anterior para uma nova semana.
- Datas dos sete dias recalculadas ao copiar um plano.
- Bloqueios e contadores de regeneração reiniciados na cópia para evitar carregar estado operacional antigo.
- Variação determinística entre semanas novas, mantendo os mesmos dados e preferências.
- Planos anteriores à semana atual protegidos contra edição, regeneração, troca e cópia interna acidentais.
- Consumo histórico permanece disponível para consulta e correção.
- Sem criação de registros retroativos para semanas antigas que nunca tiveram plano.
- Lista de compras e consumo acompanham automaticamente a semana selecionada.

## Banco e segurança

- Nenhuma migration nova é necessária.
- A versão reutiliza `diet_plans`, `diet_plan_days`, `diet_meals` e `diet_meal_items`.
- Continua existindo no máximo um plano por usuário e segunda-feira de início.
- As políticas RLS existentes permanecem responsáveis pelo isolamento entre contas.
- A consulta de semanas sempre inclui o `user_id` autenticado.

## Arquivos principais

- `src/components/diet/WeekNavigator.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/DietHome.tsx`
- `src/lib/diet/weekPlanning.ts`
- `src/lib/diet/generator.ts`
- `src/lib/diet/service.ts`
- `src/lib/diet/types.ts`
- `docs/APEX-ROADMAP.md`

## Validação funcional local

- `npm install`: concluído; dependências já estavam atualizadas.
- TypeScript (`npm run typecheck`): aprovado.
- ESLint: 0 erros; 28 avisos antigos fora do escopo.
- Build de produção (`npm run build`): aprovado com Next.js 16.2.9.
- Cálculo de semana anterior e remapeamento de datas: aprovado em teste isolado.
- Remoção de bloqueios e contadores na cópia: aprovada em teste isolado.

## Limites desta versão

- A interface mostra atalhos para as dez semanas salvas mais recentes; as setas permitem navegar além desse intervalo.
- O histórico é protegido pela interface; as tabelas continuam disponíveis para operações autorizadas conforme a RLS.
- Persistência, isolamento entre contas e atualização após recarregar precisam ser confirmados no Supabase real.
- A migration da v0.23.0 continua necessária para usar modelos de refeições.
