# Apex v0.24.1 — Sincronização e ajuste visual

## Corrigido

- Editar uma refeição já consumida agora atualiza imediatamente o retrato consumido.
- Quantidades, itens removidos e alimentos ou receitas adicionados passam a refletir no cartão **Progresso consumido**.
- A atualização também fica disponível para as telas que consultam o histórico de consumo, incluindo Progresso.
- Itens marcados como extras no editor do consumo são preservados durante a sincronização.
- Plano semanal e consumo são persistidos na mesma transação do Supabase.
- Se uma refeição for desmarcada como consumida em outra sessão, a edição do plano não volta a marcá-la automaticamente.
- A mensagem do editor explica o novo comportamento antes do salvamento.

## Ajuste de interface

- Removido o cartão independente **Semanas**.
- A navegação semanal agora aparece como um seletor compacto no lado direito do cabeçalho do plano.
- As setas anterior e próxima foram preservadas.
- O seletor lista semana atual, semanas salvas e a semana futura selecionada.
- Estados vazio e de erro mantêm o mesmo seletor dentro do próprio cartão do plano.

## Banco e segurança

- Nova função `save_weekly_diet_plan_and_sync_consumption`.
- A função reutiliza as validações de plano e consumo já existentes.
- A sincronização ocorre apenas quando já existe um registro consumido do mesmo usuário, data e refeição.
- `security invoker`, `auth.uid()` e as políticas RLS existentes continuam protegendo as contas.
- A migration é idempotente e não remove tabelas nem dados.

## Arquivos principais

- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/WeekNavigator.tsx`
- `src/components/diet/PlannedMealEditor.tsx`
- `src/lib/diet/planEditing.ts`
- `src/lib/diet/service.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/20260718010000_diet_plan_consumption_sync.sql`

## Validação funcional local

- `npm install`: concluído; dependências já estavam atualizadas.
- TypeScript (`npm run typecheck`): aprovado.
- ESLint (`npm run lint`): 0 erros e 28 avisos antigos fora do escopo.
- Build de produção (`npm run build`): aprovado com Next.js 16.2.9.
- Sincronização dos itens planejados: aprovada em teste isolado.
- Preservação de itens extras: aprovada em teste isolado.

## Teste pendente em ambiente real

- Executar a migration v0.24.1.
- Confirmar atualização imediata do Progresso consumido.
- Confirmar persistência após atualizar a página.
- Confirmar isolamento com duas contas.
