# Apex v0.24.2 — Navegação interna da Dieta

## Implementado

- Nova barra de navegação interna na ordem **Plano · Alimentos · Compras · Ajustes**.
- **Plano** é a abertura padrão da Dieta.
- A seção ativa fica registrada na URL com `?secao=...`.
- Voltar e avançar no navegador restaura a seção correspondente.
- A semana selecionada é preservada ao alternar entre Plano e Compras.
- A barra permanece acessível durante a rolagem da página.

## Plano

- Mantém seletor semanal, dias, metas do dia, Progresso consumido e refeições.
- Mantém todas as ações de editar, concluir, copiar, trocar e bloquear.
- A lista de compras foi removida do final do plano.

## Alimentos

- Reúne **Meus alimentos**, **Receitas** e **Modelos**.
- Um seletor secundário mostra apenas uma dessas áreas por vez.
- Cadastros, edições, arquivamentos e formulários existentes foram preservados.

## Compras

- A lista automática ganhou uma seção própria.
- O seletor semanal aparece no cabeçalho da lista.
- Marcação, progresso, limpeza e cópia continuam funcionando.
- Uma semana sem plano direciona o usuário para a aba Plano.

## Ajustes

- Reúne metas diárias, recalcular com o Perfil e edição da configuração.
- Reúne também rotina, tempo de preparo, padrão alimentar, orçamento e restrições.
- Os cartões de configuração deixaram de ocupar o início da aba Plano.

## Banco e segurança

- Nenhuma migration nova é necessária.
- Todas as leituras e gravações continuam usando os mesmos serviços e políticas RLS.
- A migration v0.24.1 continua necessária para sincronização atômica entre plano e consumo.

## Arquivos principais

- `src/components/diet/DietHome.tsx`
- `src/components/diet/DietFoodLibrary.tsx`
- `src/components/diet/WeeklyPlan.tsx`
- `src/components/diet/ShoppingList.tsx`
- `src/components/diet/DietModule.tsx`

## Validação funcional local

- `npm install`: concluído; dependências já estavam atualizadas.
- TypeScript (`npm run typecheck`): aprovado.
- ESLint (`npm run lint`): 0 erros e 28 avisos antigos fora do escopo.
- Build de produção (`npm run build`): aprovado com Next.js 16.2.9.

## Teste pendente em ambiente real

- Alternar entre as quatro seções.
- Atualizar a página em cada URL de seção.
- Confirmar preservação da semana entre Plano e Compras.
- Confirmar todos os formulários em Alimentos.
- Confirmar edição e recálculo em Ajustes.
