# Checklist de lançamento do beta privado

## Bloqueadores

- [ ] Todas as migrations anteriores foram aplicadas na ordem.
- [ ] `20260718060000_privacy_lgpd_foundation.sql` foi aplicada.
- [ ] `20260718070000_launch_readiness.sql` foi aplicada.
- [ ] `npm run check` passou em instalação limpa.
- [ ] Smoke E2E público passou no ambiente de Preview.
- [ ] Cadastro, confirmação de e-mail, login, logout e recuperação passaram no Supabase real.
- [ ] Isolamento RLS foi testado manualmente com duas contas.
- [ ] Exportação e exclusão foram testadas com conta descartável.
- [ ] Nome do controlador, e-mail de privacidade e e-mail de suporte estão configurados.
- [ ] Documentos jurídicos foram revisados para o operador real.
- [ ] Backups e restauração estão configurados e testados.
- [ ] SMTP, domínio e URLs de redirecionamento estão corretos.
- [ ] Monitoramento externo de `/api/health` e alerta de indisponibilidade estão ativos.
- [ ] Não há `.env.local`, Secret Key, `service_role`, senha ou segredo Stripe no repositório/ZIP.

## Decisões do beta

- [x] Cobrança desativada (`APEX_BILLING_ENABLED=false`).
- [x] Apple Pay e teste de 7 dias não são oferecidos antes do teste externo.
- [x] Indexação pública bloqueada durante o beta.
- [x] Suporte inicial por e-mail, sem painel administrativo.
- [ ] Responsável e prazo de resposta do suporte definidos.
- [ ] Grupo inicial de usuários e canal de feedback definidos.

## Supabase de produção

- [ ] Security Advisor revisado.
- [ ] Performance Advisor revisado.
- [ ] Confirmação de e-mail habilitada.
- [ ] MFA habilitada para administradores.
- [ ] SSL e restrições de rede avaliadas.
- [ ] CAPTCHA e limites de autenticação configurados conforme o risco.
- [ ] Edge Function `delete-account` publicada e validada.
- [ ] Storage privado de avatares validado com duas contas.

## Experiência

- [ ] Fluxos principais revisados em desktop e celular real.
- [ ] Navegação por teclado e foco visível revisados.
- [ ] Estados de carregamento, vazio, offline e erro revisados.
- [ ] Datas, timezone e notificações revisados no horário de Brasília.
- [ ] Dados exibidos após recarregar e novo login permanecem corretos.

## Liberação

- [ ] Preview aprovado.
- [ ] Backup imediatamente anterior ao lançamento confirmado.
- [ ] Produção publicada.
- [ ] Health check respondeu `ok` após publicação.
- [ ] Cadastro real controlado passou após publicação.
- [ ] Plano de reversão registrado.
