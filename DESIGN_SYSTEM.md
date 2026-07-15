# APEX — Design System v1

## Direção

O Apex é um sistema operacional pessoal para evolução contínua. A interface deve comunicar clareza, disciplina, foco e progresso acumulado — sem parecer um dashboard corporativo, um jogo medieval ou um template genérico de produtividade.

A metáfora central é **subir com método**: cada módulo representa uma parte do caminho, mas o usuário sempre precisa saber onde está, o que importa agora e qual é o próximo passo.

## Princípios

1. **Hoje antes de tudo** — a interface prioriza decisões e ações do dia.
2. **Uma marca, uma cor** — o dourado mineral representa ação, seleção e conquista. Cores adicionais só aparecem em dados configuráveis ou feedback funcional.
3. **Hierarquia por superfície** — canvas, superfície base, card elevado e overlay; nenhuma tela inventa seu próprio fundo.
4. **Mobile é uma experiência própria** — navegação inferior, bottom sheets, toque mínimo de 44px e safe areas.
5. **Progresso deve ter significado** — hábitos são consistência, rotina é arquitetura do dia, metas são trajetória e treino é ciclo.
6. **Movimento funcional** — animações explicam mudança de estado; não são decoração.

## Fonte de verdade

- `src/app/globals.css`: tokens CSS, classes estruturais e primitivas visuais.
- `tailwind.config.ts`: exposição semântica dos tokens para Tailwind.
- `src/components/ui/primitives.tsx`: Card, Button, IconTile e SectionHeader.
- `src/components/layout/navigation.ts`: arquitetura central de navegação.

## Tokens principais

### Superfícies

- `--surface-canvas`: fundo do produto.
- `--surface-base`: controles e áreas encaixadas.
- `--surface-raised`: cards e seções.
- `--surface-overlay`: modais e bottom sheets.
- `--surface-hover`: estados interativos.

### Texto

- `--text-primary`: títulos e conteúdo principal.
- `--text-secondary`: conteúdo de apoio.
- `--text-muted`: metadados e legendas.
- `--text-faint`: informação desabilitada ou de baixa prioridade.

### Marca

- `--accent-primary`: ação, seleção e progresso.
- `--accent-strong`: hover de ação principal.
- `--accent-muted`: estados discretos.
- `--accent-subtle`: fundos selecionados.

### Geometria

- `--radius-control`: botões, inputs e tiles.
- `--radius-card`: cards comuns.
- `--radius-panel`: heróis, modais e bottom sheets.

## Navegação responsiva

A arquitetura do produto possui quatro destinos principais em desktop e mobile:

- Hoje — execução do dia
- Planejamento — criação de hábitos, metas, agenda e livros
- Progresso — métricas, hábitos e revisão semanal
- Corpo — treinos, ciclos e dieta

Configurações são abertas pelo ícone de perfil no cabeçalho. Não existe menu “Mais”.

## Estado da migração

### Migrado para o sistema novo

- Shell do aplicativo
- Sidebar desktop
- Navegação mobile
- Cabeçalho das páginas
- Dashboard
- Cards de métricas
- Cards de hábitos
- Calendário semanal
- Check-in diário
- Modal de foco
- Espaçamento e safe area de todas as páginas

### Compatibilidade temporária

Os aliases `apex-*`, `surface-card` e `surface-raised` continuam disponíveis. Isso permite que telas antigas recebam a nova paleta e profundidade imediatamente, enquanto seus componentes internos são migrados gradualmente para os tokens semânticos.

## Regras para novos componentes

- Não usar hex diretamente para cor estrutural.
- Não criar novos radius ou shadows dentro da tela.
- Não usar `px-8` como container de página; usar `apex-page`.
- Todo controle tocável deve ter pelo menos 44px.
- Modais mobile devem virar bottom sheets quando a tarefa permitir.
- Cards importantes devem comunicar significado, não apenas exibir ícone + número.
- Cores configuráveis de hábitos e treinos podem existir, mas não substituem a cor da marca.

## V4 — Arquitetura do produto

- Hoje é o centro de execução.
- Planejamento configura o que aparecerá em Hoje.
- Progresso concentra análises e revisão.
- Corpo concentra treino, periodização e dieta.
- Deep Work é uma ação contextual, não uma página.
- A paleta oficial é espresso, marrom e dourado quente.
