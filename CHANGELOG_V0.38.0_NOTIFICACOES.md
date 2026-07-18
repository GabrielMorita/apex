# Apex v0.38.0 — Notificações integradas

Esta entrega consolida as versões v0.35.0, v0.36.0, v0.37.0 e v0.38.0 em um único bloco instalável. Ela adiciona alertas úteis sem criar uma nova área na navegação principal.

## v0.35.0 — Central in-app

- Sino de notificações integrado ao cabeçalho do Apex.
- Badge com a quantidade de avisos não lidos.
- Lista com categoria, título, mensagem e horário.
- Ações para abrir a área relacionada, marcar tudo como lido ou dispensar um aviso.
- Estados de carregamento, vazio, erro e atualização periódica.

## v0.36.0 — Lembretes reais

- Lembretes derivados de hábitos e tarefas do Planejamento.
- Lembretes de treinos agendados e refeições do plano alimentar.
- Resumo diário configurável e revisão semanal aos domingos.
- Avisos já concluídos ou consumidos são dispensados automaticamente.
- Chave de deduplicação impede alertas repetidos quando a sincronização é chamada novamente.
- Nenhum lembrete fictício é criado para a conta autenticada.

## v0.37.0 — Preferências

- Novo cartão recolhível em Configurações.
- Canal dentro do Apex ativável de forma independente.
- Categorias de hábito, tarefa, treino, Dieta, resumo diário e revisão semanal separadas.
- Antecedência configurável entre o horário exato e uma hora.
- Horários do resumo diário e da revisão semanal editáveis.
- Fuso do navegador salvo no Supabase.
- Horário silencioso armazenado para uso futuro pelos canais externos.

## v0.38.0 — Fundação multicanal

- Preferências de in-app, push e e-mail armazenadas separadamente.
- Estrutura privada e protegida por RLS para futuras assinaturas Web Push.
- Push e e-mail permanecem visíveis como indisponíveis até a configuração segura de provedor e dispatcher server-side.
- Exportação da conta atualizada para o esquema 2.1, incluindo preferências e caixa de notificações.

## Banco, segurança e arquitetura

- Migration: `supabase/migrations/20260718040000_notifications_foundation.sql`.
- Cria três tabelas privadas, índices, triggers, RLS e a função `sync_my_notifications`.
- Todas as operações do navegador usam a conta autenticada e políticas com `auth.uid()`.
- A função é `security invoker`; não usa `service_role`, Secret Key nem credenciais de provedor.
- A migration é idempotente e não contém `drop table`, `truncate` ou exclusão de dados funcionais do usuário.
- O bloco depende das migrations já instaladas de Dieta, Treino e Produtividade.

## Validação executada

- Análise sintática do SQL: aprovada.
- Execução da migration em PostgreSQL local: aprovada duas vezes consecutivas.
- Teste local: três tabelas, três políticas, cinco lembretes de fontes distintas, deduplicação, dispensa ao concluir a fonte e isolamento RLS entre duas identidades aprovados.
- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem erros.
- `npm run build`: aprovado com Next.js 16.2.9.

## Dependências de um ambiente real

- Executar o SQL no Supabase que já recebeu a v0.34.0.
- Validar horários com o fuso do dispositivo e dados reais da conta.
- Confirmar persistência após atualizar a página, sair e entrar novamente.
- Push e e-mail externos exigirão provedor, segredo server-side, consentimento e uma função de envio; esse envio não faz parte desta versão.
