# Apex v0.14.0 — Consumo alimentar e progresso diário

## Implementado

- Registro de cada refeição como consumida ou pendente.
- Cópia imutável dos alimentos, porções e macros no momento do consumo.
- Separação real entre planejamento atual e histórico consumido.
- Progresso diário de energia, proteína, carboidratos e gorduras consumidos versus planejados.
- Contador de refeições consumidas e indicação visual de dia concluído.
- Selo **Consumida** em cada refeição registrada.
- Persistência no Supabase e atualização após F5, logout e novo login.
- Função RPC `set_diet_meal_consumption` para registrar ou remover o consumo.
- RLS com isolamento por `auth.uid()`.
- Exportação dos dados da conta atualizada para incluir o histórico alimentar.

## Banco de dados

Migration: `supabase/migrations/20260717040000_diet_consumption.sql`.

Cria `diet_consumption_entries`, índices, gatilho de `updated_at`, política RLS e função de escrita. Não altera nem apaga os planos semanais já existentes.

## Arquivos principais alterados

- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/DailyConsumption.tsx`
- `src/lib/diet/types.ts`
- `src/lib/diet/service.ts`
- `src/lib/account/service.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/20260717040000_diet_consumption.sql`
- `package.json`
- `package-lock.json`

## Delimitação

- Registrar uma refeição salva inicialmente as porções planejadas como consumidas.
- Edição das quantidades realmente consumidas e inclusão de itens extras ficam para a próxima evolução.
- Os registros são estimativas de acompanhamento pessoal, não avaliação ou prescrição clínica.

## Validação local

- `npm install`: concluído.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem erros; permanecem 28 avisos antigos não relacionados.
- `npm run build`: aprovado com Next.js 16.2.9.
- Migration aceita pelo parser PostgreSQL em 13 instruções de nível superior.

## Pendente de Supabase real

- Executar a migration v0.14.0.
- Registrar e remover consumo, atualizar a página e testar novo login.
- Validar RLS com duas contas.
