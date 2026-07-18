# Apex v0.30.0 — Treino completo

Esta entrega consolida as versões v0.27.0, v0.28.0, v0.29.0 e v0.30.0 em uma única atualização instalável.

**Revisão SQL 2:** a política RLS de `training_session_sets` foi reduzida à regra direta `user_id = auth.uid()`, mantendo o isolamento entre contas e eliminando o bloco aninhado que causava erro na versão inicial. O arquivo passou por validação sintática antes do novo empacotamento.

## v0.27.0 — Biblioteca, fichas e calendário

- Biblioteca inicial de exercícios de referência, sem prescrever um treino ao usuário.
- Exercícios pessoais privados, com cadastro, edição, instruções, equipamento e vídeo opcional.
- Fichas privadas com tipo, descrição, exercícios, séries, repetições, carga, intervalo e observações.
- Duplicação e arquivamento de fichas.
- Calendário semanal com horário, ciclo opcional, remoção e estado ignorado.
- Nenhum treino fictício é criado para uma conta autenticada.

## v0.28.0 — Execução real

- Início e retomada idempotentes de uma sessão planejada.
- Snapshot da ficha e dos exercícios no momento do início.
- Registro de repetições, carga e conclusão por série.
- Cronômetro local de descanso por série.
- Conclusão com duração, observações e volume calculado no servidor.
- Cancelamento atômico da sessão com reabertura do treino planejado.
- Estados de carregamento, salvamento, erro, sessão vazia e somente leitura.

## v0.29.0 — Histórico e evolução

- Histórico real de sessões concluídas em 4, 8 ou 12 semanas.
- Frequência semanal, duração, séries concluídas e volume por carga registrada.
- Comparação da frequência da semana atual com a anterior.
- Recordes por exercício com melhor carga e volume da melhor série.
- Detalhamento das séries e observações de cada sessão.
- Integração do total de treinos planejados/concluídos no Progresso.

## v0.30.0 — Substituições e ciclos

- Substituição de um exercício durante a execução antes de qualquer série concluída.
- Troca de exercício na ficha para os próximos treinos.
- Ciclos com nome, objetivo livre, datas, status e observações.
- Associação opcional entre treino planejado e ciclo.
- Periodização incorporada em **Treino → Plano / ciclos**.
- As antigas rotas Performance e Periodização não mantêm sistemas paralelos.

## Integrações e privacidade

- **Hoje** mostra somente o resumo real da data selecionada e leva à execução em Treino.
- **Progresso** usa a agenda real do Supabase no indicador semanal.
- A exportação da conta inclui exercícios pessoais, fichas, calendário, ciclos, sessões e séries.
- As sete tabelas novas usam RLS e `auth.uid()` para isolar cada conta.
- Exercícios de referência são somente leitura; itens pessoais pertencem ao usuário autenticado.
- Operações compostas críticas usam funções transacionais com `security invoker`.
- Nenhum dado novo de Treino é persistido em `localStorage`; ele permanece apenas para a preferência visual da aba.

## Migration

- `supabase/migrations/20260718020000_training_system.sql`
- Cria tabelas, índices, triggers, RLS, políticas, funções transacionais e o catálogo inicial de referência.
- Não apaga tabelas nem dados do usuário.
- Os comandos `drop policy if exists` e `drop trigger if exists` apenas substituem definições controladas pela própria migration para permitir nova execução.

## Arquivos principais

- `src/components/training/TrainingPlanWorkspace.tsx`
- `src/components/training/TrainingWeekPlanner.tsx`
- `src/components/training/TrainingTemplateManager.tsx`
- `src/components/training/TrainingExerciseLibrary.tsx`
- `src/components/training/TrainingCycleManager.tsx`
- `src/components/training/TrainingWeek.tsx`
- `src/components/training/TrainingHistory.tsx`
- `src/components/training/TodayTrainingCard.tsx`
- `src/lib/training/`
- `src/lib/supabase/database.types.ts`
- `src/lib/account/service.ts`
- `src/app/treinos/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/components/workspaces/ProgressOverview.tsx`

## Validação executada

- `npm install`: aprovado, dependências já atualizadas.
- `npm run typecheck`: aprovado.
- `npm run lint`: 0 erros; 16 avisos antigos fora do módulo de Treino.
- `npm run build`: aprovado com Next.js 16.2.9.
- Teste HTTP local: aplicação iniciou e respondeu ao acesso; a proteção de autenticação redirecionou a sessão anônima corretamente.

## Dependências de um Supabase real

- Executar a migration da v0.30.0.
- Validar os fluxos autenticados descritos em `INSTRUCOES_V0.30.0_TREINO_COMPLETO.md`.
- Confirmar isolamento de RLS com duas contas.
- Confirmar persistência após atualizar a página, sair e entrar novamente.
