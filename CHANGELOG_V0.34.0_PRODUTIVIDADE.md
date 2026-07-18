# Apex v0.34.0 — Produtividade integrada

Esta entrega consolida as versões v0.31.0, v0.32.0, v0.33.0 e v0.34.0 em um único bloco instalável. O objetivo é encerrar os sistemas locais paralelos de hábitos, planejamento, leitura, Hoje e Progresso.

## v0.31.0 — Hábitos persistentes

- Cadastro e edição de hábitos com horário, período, categoria, cor, ícone, duração e frequência.
- Frequências diária, flexível por quantidade semanal ou por dias fixos.
- Meta semanal editável e arquivamento sem apagar o histórico.
- Personalização de uma data específica sem alterar a frequência padrão.
- Registros de concluído, ignorado e pendente persistidos por usuário.
- A conta autenticada começa vazia, sem hábitos fictícios.

## v0.32.0 — Planejamento unificado

- Agenda semanal derivada dos hábitos e de suas exceções por data.
- Tarefas únicas ou recorrentes com horário e observações.
- Metas mensuráveis com prazo, status, hábitos e fichas de treino vinculadas.
- Biblioteca de leitura com livros, progresso, prioridade, ciclos e metas relacionadas.
- Captura rápida salva tarefas e ideias diretamente no Supabase.
- Rotas antigas de Rotina e Biblioteca encaminham para o Planejamento oficial.

## v0.33.0 — Execução no Hoje

- Hoje carrega somente hábitos, tarefas, ideias, check-ins e leitura da conta autenticada.
- Alterações são refletidas de forma otimista e reconciliadas com o Supabase.
- Hábitos de leitura abrem o registro real do livro; o avanço conclui o hábito relacionado.
- Hábitos de foco abrem o cronômetro e registram a sessão antes de concluir o hábito.
- Check-ins de energia, sono, humor, estresse e dor muscular são persistentes.
- O indicador lateral de sequência é calculado a partir do histórico real.

## v0.34.0 — Progresso, revisão e consolidação

- Visão geral do Progresso calcula consistência, entregas, treinos, energia e score usando dados reais.
- Progresso de hábitos mostra os sete dias, meta, execução e sequência.
- Revisão semanal combina resumo real com respostas persistentes por semana.
- Configurações exibem históricos reais de check-in, foco e leitura.
- Exportação da conta passa ao esquema 2.0 e inclui as 16 tabelas do bloco de Produtividade.
- Rotas antigas de Tracker, Revisão, Deep Work e Diário deixam de gravar em `localStorage` e encaminham para os fluxos oficiais.

## Banco, privacidade e arquitetura

- Migration: `supabase/migrations/20260718030000_productivity_foundation.sql`.
- Cria 16 tabelas, índices, triggers, RLS e cinco funções transacionais.
- Todas as tabelas privadas filtram `user_id = auth.uid()`.
- Nenhum registro funcional novo deste bloco fica apenas no navegador; o estado local remanescente é somente de interface, como a aba selecionada.
- A migration é idempotente e não contém `drop table`, `truncate` ou exclusão de dados do usuário.
- A ligação opcional entre meta e ficha usa a tabela de Treino da v0.30.0; por isso a migration de Treino precisa ter sido executada antes.

## Validação executada

- Análise sintática do SQL: aprovada.
- Execução da migration em PostgreSQL local: aprovada duas vezes consecutivas.
- Teste automatizado local: 16 tabelas, 16 políticas, isolamento RLS entre duas identidades e funções de hábito, tarefa, meta e leitura aprovados.
- `npm install`: aprovado; dependências e lockfile consistentes.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem erros.
- `npm run build`: aprovado com Next.js 16.2.9.
- O servidor de desenvolvimento alcançou o estado `Ready` com hostname explícito; a requisição HTTP separada não pôde ser confirmada por isolamento de rede do executor.

## Dependências de um Supabase real

- Executar a migration da v0.34.0 no projeto que já contém a v0.30.0.
- Validar persistência após atualizar, sair e entrar novamente.
- Confirmar isolamento com duas contas reais.
- Acompanhar o uso cotidiano para registrar correções e melhorias, conforme a estratégia de validação escolhida para este bloco.
