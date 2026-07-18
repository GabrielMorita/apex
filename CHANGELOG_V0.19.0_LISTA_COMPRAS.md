# Apex v0.19.0 — Lista de compras semanal

## Implementado

- Lista derivada diretamente do plano semanal salvo, sem duplicar quantidades ou dados nutricionais no banco.
- Soma automática das porções de ingredientes repetidos nos sete dias.
- Agrupamento em hortifruti, proteínas e leguminosas, cereais e carboidratos, laticínios e ovos, gorduras e outros.
- Identificação de alimentos pessoais cadastrados pelo usuário.
- Marcação e desmarcação de itens comprados com persistência por usuário e semana no Supabase.
- Progresso de compras em quantidade e percentual.
- Ação para limpar todas as marcações da semana, com confirmação.
- Cópia da lista completa em texto, já separada por categorias.
- Atualização imediata da lista quando o plano, uma refeição ou um ingrediente é alterado.
- Inclusão das marcações na exportação dos dados da conta, agora no esquema 1.5.

## Banco e segurança

- Nova tabela `public.diet_shopping_checks`.
- Chave primária composta por usuário, semana e alimento, impedindo marcações duplicadas.
- RLS e políticas próprias usando `auth.uid()`.
- Usuários autenticados só podem consultar, criar ou remover as próprias marcações.
- A migration é idempotente, não destrutiva e não usa `service_role` no navegador.

## Arquivos principais

- `src/components/diet/ShoppingList.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/lib/diet/shopping.ts`
- `src/lib/diet/service.ts`
- `src/lib/account/service.ts`
- `src/lib/supabase/database.types.ts`
- `supabase/migrations/20260717070000_diet_shopping_checks.sql`

## Limites desta versão

- As quantidades representam o peso bruto somado das porções planejadas; embalagem, rendimento e estoque doméstico continuam sob decisão do usuário.
- Leitura de código de barras foi mantida fora desta versão para uma etapa futura.
- A persistência e o isolamento das marcações ainda precisam ser confirmados em um projeto Supabase real.

## Validação executada

- `npm install`: concluído, dependências já atualizadas.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado com 28 avisos antigos e 0 erros.
- `npm run build`: aprovado no Next.js 16.2.9.
- Teste isolado da agregação, categorias, unidade em kg, alimento pessoal e texto copiado: aprovado.
