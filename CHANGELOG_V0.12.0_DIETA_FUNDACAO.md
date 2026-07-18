# Apex v0.12.0 — Fundação da Dieta

## Implementado

- Novo fluxo real da Dieta com onboarding em sete etapas.
- Confirmação de elegibilidade para adultos saudáveis e bloqueio de menores de 18 anos.
- Estimativa provisória e editável de calorias, proteínas, carboidratos e gorduras.
- Registro da versão e das entradas usadas no cálculo.
- Persistência das preferências e metas no Supabase, sem `localStorage` no novo fluxo.
- Salvamento atômico por RPC, políticas RLS e isolamento por `auth.uid()`.
- Estados de carregamento, sessão, conexão, validação, salvamento e descarte.
- Dashboard ligado à configuração real da Dieta, sem refeições fictícias.
- Estado vazio explícito enquanto o gerador semanal não existe.

## Arquivos principais alterados

- `src/app/dieta/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/page.tsx`
- `src/components/diet/DietModule.tsx`
- `src/components/diet/DietOnboarding.tsx`
- `src/components/diet/DietHome.tsx`
- `src/lib/diet/types.ts`
- `src/lib/diet/calculation.ts`
- `src/lib/diet/service.ts`
- `src/lib/supabase/database.types.ts`
- `src/lib/profile/navigationGuard.ts`
- `supabase/migrations/20260717020000_diet_foundation.sql`
- `docs/APEX-ROADMAP.md`
- `docs/DIETA-V012.md`

## Validação local

- `npm install`: concluído.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem erros; 28 avisos antigos em arquivos não relacionados.
- `npm run build`: aprovado.

## Pendente de ambiente real

- Executar a migration v0.12.0 no Supabase.
- Validar persistência, novo login, conexão, sessão expirada e isolamento com duas contas.
- O gerador semanal e o banco real de alimentos pertencem à próxima entrega.
