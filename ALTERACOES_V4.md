# Apex V4 — Arquitetura final do produto

## Navegação principal

- Hoje
- Planejamento
- Progresso
- Corpo

Configurações ficam no ícone de perfil do cabeçalho.

## Funções incorporadas

### Planejamento
- Agenda semanal e exceções
- Criação e edição de hábitos
- Metas
- Livros e ciclos de leitura

### Progresso
- Visão geral e antigo conteúdo de Performance
- Detalhamento dos hábitos
- Revisão semanal

### Corpo
- Execução dos treinos da semana
- Histórico de treinos
- Plano e ciclos de treino
- Dieta no formato de plano alimentar

## Funções removidas como áreas independentes

- Rotina
- Tracker / Hábitos
- Performance
- Revisão semanal
- Treinos
- Periodização
- Dieta
- Deep Work
- Biblioteca
- Diário

As funções úteis foram incorporadas às quatro áreas principais. O Diário foi removido do produto.

## Deep Work

O timer agora aparece como pop-up ao concluir um hábito da categoria Foco. A sessão é registrada em `apex-deepwork-sessions` e o hábito é concluído ao finalizar o timer.

## Compatibilidade

As estruturas existentes de localStorage foram preservadas. Os antigos destinos internos são redirecionados para a nova área correspondente para evitar botões quebrados.
