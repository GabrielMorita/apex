# Apex v0.48.0 — Privacidade e LGPD

Data: 18/07/2026

## Resultado

O Apex passa a ter uma fundação técnica de privacidade para dados pessoais comuns e dados sensíveis de saúde. A entrega não substitui revisão jurídica e não afirma conformidade automática apenas pela existência das telas.

## Implementado

- Termos de Uso, Aviso de Privacidade e documento específico de Dados de Saúde.
- Rotas públicas `/termos`, `/privacidade` e `/dados-saude`.
- Cadastro com confirmação de maioridade, aceite dos Termos, ciência do Aviso e consentimento destacado para dados de saúde.
- Documentos versionados no Supabase.
- Eventos append-only de aceite, ciência e revogação.
- Backfill seguro quando o cadastro ocorreu com a nova interface antes da migration.
- Central de Privacidade em Configurações.
- Revogação do consentimento de dados de saúde.
- Preferências opcionais desligadas por padrão para atualizações, análise anônima e pesquisa.
- Exportação JSON atualizada para o esquema 3.0, incluindo registros de privacidade.
- Solicitações autenticadas para os direitos do titular.
- Histórico e estado de solicitações visíveis ao usuário.
- Regras transparentes de retenção por categoria.
- Avisos de dados sensíveis nas áreas Dieta e Treino.
- Variáveis públicas para identidade do controlador e canal de privacidade.

## Banco de dados

A migration cria seis tabelas:

- `privacy_documents`
- `privacy_consent_events`
- `privacy_preferences`
- `privacy_requests`
- `privacy_request_events`
- `privacy_retention_rules`

Escritas de consentimento e solicitações ocorrem por funções autenticadas. Registros jurídicos não podem ser editados diretamente pelo navegador. As tabelas privadas usam `auth.uid()` e RLS.

## Limites e decisões pendentes

- Os textos são minutas técnicas e precisam de revisão jurídica brasileira.
- Nome ou razão social do controlador e e-mail de privacidade não foram inventados; devem ser configurados.
- A lista definitiva de operadores, países, garantias de transferência e prazos legais depende da infraestrutura comercial final.
- O painel administrativo para responder solicitações pertence à próxima etapa.
- A revogação é registrada, mas a estratégia jurídica e operacional para limitar cada funcionalidade de saúde precisa ser validada antes do lançamento.

## Fontes oficiais consideradas

- [Lei nº 13.709/2018 — LGPD](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD — Perguntas frequentes](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes)
- [ANPD — Aviso de Privacidade](https://www.gov.br/anpd/pt-br/acesso-a-informacao/aviso-de-privacidade)
- [ANPD — Comunicação de incidente de segurança](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis)
