# Apex v0.13.0 — Gerador semanal da Dieta

## Implementado

- Catálogo nutricional compartilhado com 34 alimentos brasileiros e composição por 100 g da TACO/NEPA-UNICAMP.
- Metadados de fonte, código TACO, padrão alimentar, alérgenos, custo e uso por refeição.
- Geração determinística de um plano de sete dias usando metas, horários, padrão alimentar, orçamento, variedade, favoritos, alergias, restrições e alimentos rejeitados.
- Porções e totais estimados de energia, proteína, carboidratos e gorduras por item, refeição e dia.
- Persistência normalizada no Supabase: plano, dias, refeições e itens.
- Navegação entre os sete dias, comparação visual com as metas e detalhamento das porções.
- Regeneração da refeição, do dia e da semana.
- Bloqueio de refeições; regenerações preservam as refeições bloqueadas.
- Desfazer a última regeneração com persistência no Supabase.
- Aviso quando as metas atuais diferem do retrato usado para gerar o plano.
- RLS por `auth.uid()` e vínculos compostos que impedem associar registros a planos de outra conta.
- Salvamento atômico pela função `save_weekly_diet_plan`.
- Exportação da conta atualizada para incluir preferências, metas e todo o plano alimentar.

## Delimitação honesta desta versão

- As quantidades são estimativas provisórias para adultos saudáveis, não prescrição clínica.
- O algoritmo é determinístico e não usa IA nem API externa nesta versão.
- A estrutura do catálogo já registra o provedor e permite adicionar um conector server-side e cache futuramente, sem expor chaves no navegador.
- Troca de um alimento isolado, consumo planejado versus realizado, receitas, lista de compras e hidratação permanecem para as próximas entregas.
- Planos com restrições amplas ou padrão vegano podem ficar mais distantes de metas proteicas elevadas; a interface mostra essa diferença em vez de ocultá-la.

## Arquivos principais alterados

- `src/components/diet/DietHome.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/lib/diet/types.ts`
- `src/lib/diet/generator.ts`
- `src/lib/diet/service.ts`
- `src/lib/account/service.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/20260717030000_diet_weekly_generator.sql`
- `docs/APEX-ROADMAP.md`
- `package.json`
- `package-lock.json`

## Validação local

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem erros; permanecem 28 avisos anteriores em arquivos não relacionados.
- `npm run build`: aprovado com Next.js 16.2.9.
- Teste automatizado do gerador: 20 combinações de padrão alimentar e quantidade de refeições, catálogo com 34 itens, saída determinística, limites de porção, exclusões e preservação de bloqueios.

## Pendente de Supabase real

- Executar a migration v0.13.0.
- Gerar um plano e confirmar persistência após F5 e novo login.
- Validar regeneração, bloqueio e desfazer.
- Confirmar isolamento com duas contas.
- Revisar os planos e as regras com nutricionista antes de uso comercial.
