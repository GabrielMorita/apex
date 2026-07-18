# Apex v0.60.0 — Candidato a beta

Data: 18/07/2026

## Resultado

O Apex está preparado como candidato técnico a um beta privado. Esta entrega fecha uma primeira camada de testes automatizados, proteção de APIs sensíveis, recuperação de erros, verificação operacional e empacotamento para Vercel ou Docker.

Ela não publica o aplicativo em uma conta externa e não substitui os testes no Supabase real, a revisão jurídica ou a configuração de monitoramento e backups.

## Implementado

- Next.js atualizado para a revisão estável `16.2.10`.
- Testes unitários de Perfil, estimativa nutricional, gerador de dieta, treino e documentos de privacidade.
- Testes E2E públicos com Playwright para health check, cadastro, documentos jurídicos e suporte.
- Pipeline de CI para instalação limpa, testes, TypeScript, lint, build, auditoria de release e smoke E2E.
- Endpoint público mínimo `GET /api/health`, sem dados secretos.
- Páginas de erro local, erro global e rota não encontrada.
- Cabeçalhos de segurança, CSP estática, HSTS em produção e proteção específica do service worker.
- Rate limiting transacional server-side para criação de Checkout e Portal de cobrança.
- Cobrança mantida desativada por padrão.
- Página pública `/suporte` com canal configurável por e-mail.
- Imagem Docker multi-stage, saída standalone do Next.js e health check.
- Configuração básica para Vercel.
- Bloqueio de indexação para o beta privado.
- Auditoria automática de versão, variáveis obrigatórias, cobrança desativada e possíveis segredos.

## Banco de dados

A migration `20260718070000_launch_readiness.sql` cria apenas:

- `api_rate_limits`, tabela privada sem acesso de `anon` ou `authenticated`;
- `consume_api_rate_limit`, função executável somente com `service_role` no servidor.

A migration é adicional, idempotente e não destrutiva.

## Limites conhecidos

- O suporte é operacional por e-mail, sem painel administrativo ou SLA automatizado.
- O E2E de autenticação e o isolamento RLS ainda precisam de duas contas reais no Supabase.
- A exclusão de conta depende da Edge Function já prevista no projeto.
- O CSP estático permite scripts e estilos inline necessários ao modelo atual do Next.js. Um CSP estrito com nonce pode ser adotado depois, com o custo de renderização dinâmica.
- A auditoria de dependências ainda reporta avisos moderados herdados do PostCSS empacotado pelo Next.js; não há correção estável sem regressão de versão e o Apex não gera CSS a partir de entrada do usuário.
- Monitoramento externo, backups, domínio, SMTP e configuração final do Supabase dependem das contas de produção.
- Pagamentos, Apple Pay e teste grátis continuam preparados, mas não ativados.

## Validação executada nesta entrega

- 6 arquivos de teste unitário, com 13 testes aprovados.
- TypeScript sem erros.
- ESLint sem erros ou avisos.
- Build de produção aprovado com 33 páginas/rotas.
- Smoke HTTP aprovado para health check, Termos, Privacidade e Suporte, incluindo CSP.
- Migration analisada sintaticamente, executada duas vezes e validada com limite transacional e RLS.
- 6 cenários Playwright listados e compilados; a execução visual local ficou pendente porque o ambiente não disponibilizou Chromium e bloqueou seu download.
- Auditoria de produção sem vulnerabilidades altas ou críticas; permanecem 2 avisos moderados no PostCSS empacotado pelo Next.js.
- A imagem Docker não foi construída neste ambiente porque o executável Docker não está instalado.
