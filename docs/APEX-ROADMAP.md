# Apex — Roadmap mestre

Última atualização: 18/07/2026  
Versão atual: **v0.60.0 — Candidato a beta privado**

## Decisões permanentes

- Áreas principais: Hoje, Planejamento, Progresso, Treino e Dieta.
- Navegação mobile: Planejar · Progresso · Hoje · Treino · Dieta.
- Perfil e Configurações ficam somente no ícone superior.
- A antiga área Corpo não deve voltar.
- Dados reais pertencem ao Supabase; estado local pode ser usado apenas como cache ou estado temporário.
- Dados privados exigem RLS. Chaves secretas nunca entram no frontend ou no ZIP.
- Migrations devem ser idempotentes e não destrutivas.
- Desenvolvimento e entrega ocorrem uma etapa por vez.
- Dieta atende inicialmente apenas adultos saudáveis e exige revisão profissional e jurídica antes da comercialização.

## Etapas

| Etapa | Status | Observação |
| --- | --- | --- |
| 1. Base técnica e Perfil | Em validação final | v0.10.0 aplicada; v0.11.0 fecha segurança e gestão da conta |
| 2. Progresso | Base integrada | Peso, alimentação, treino, hábitos, metas, check-ins e revisão usam fontes reais |
| 3. Treinos | Pronto para validação real | v0.27.0–v0.30.0 consolidadas: biblioteca, fichas, calendário, execução, histórico, ciclos e substituições |
| 4. Hábitos | Pronto para uso real | v0.31.0–v0.34.0: cadastro, execução, histórico, metas e RLS no Supabase |
| 5. Dieta | Em andamento | v0.24.0 permite consultar o histórico e preparar semanas futuras |
| 6. Dashboard Hoje | Base integrada | Hábitos, tarefas, check-in, foco, leitura, treino e dieta usam dados reais |
| 7. Planejamento | Pronto para uso real | Agenda, hábitos, tarefas, metas e biblioteca sem sistema paralelo |
| 8. Notificações | Pronta para instalação | Central in-app e lembretes reais; fundação separada para push e e-mail |
| 9. Assinatura e pagamentos | Base pronta; cobrança desativada | Checkout compatível com Apple Pay e teste único de 7 dias; faltam preço, conta e teste externo |
| 10. Privacidade e LGPD | Base pronta para revisão | Documentos, escolhas versionadas, direitos, retenção e exportação 3.0; faltam identidade e revisão jurídica |
| 11. Administração e suporte | Parcial e adiada | Suporte inicial por e-mail; painel administrativo fica para depois |
| 12. Testes completos | Base automatizada pronta | Unitários e smoke E2E públicos; autenticação/RLS real ainda exigem validação |
| 13. Performance, segurança e observabilidade | Base pronta | Headers, CSP, rate limit, health check e CI; monitor externo depende do deploy |
| 14. Deploy e lançamento | Candidato pronto | Vercel e Docker preparados; falta publicar Preview e executar checklist real |
| 15. Pós-lançamento | Pendente | Métricas, feedback e correções |

## Versões entregues

- **v0.9.2** — base recebida com autenticação e Supabase integrados.
- **v0.10.0** — Perfil persistente, dados físicos, objetivo, avatar privado, completude e histórico de peso.
- **v0.11.0** — alteração de senha, logout de outras sessões, exportação dos dados, exclusão server-side e roadmap mestre.
- **v0.12.0** — fundação da Dieta: elegibilidade, onboarding em sete etapas, estimativa editável, preferências e metas no Supabase.
- **v0.13.0** — catálogo TACO, regras determinísticas e plano de sete dias com regeneração, bloqueio e desfazer.
- **v0.13.1** — escolha de substituição por ingrediente, recálculo automático e desfazer sempre visível.
- **v0.14.0** — registro de refeições consumidas, retrato histórico e progresso planejado versus consumido.
- **v0.15.0** — edição de quantidades consumidas, remoção de itens e inclusão de alimentos extras.
- **v0.16.0** — resumo nutricional em Hoje e histórico alimentar real de 28 dias em Progresso.
- **v0.17.0** — cadastro, edição, arquivamento e uso de alimentos personalizados com RLS.
- **v0.18.0** — favoritos privados e filtros de alimentos consumidos recentemente.
- **v0.19.0** — lista de compras automática, agrupada, copiável e com marcações privadas persistentes.
- **v0.20.0** — receitas pessoais com ingredientes, rendimento, composição calculada e reutilização nos seletores.
- **v0.21.0** — inclusão, remoção e ajuste de alimentos ou receitas nas refeições do plano, com recálculo e desfazer.
- **v0.22.0** — cópia de refeições para múltiplos dias, preservando horários, bloqueios e consumo histórico.
- **v0.23.0** — modelos privados de refeições, reaplicáveis com a composição atual dos alimentos.
- **v0.24.0** — navegação entre semanas, histórico protegido, geração futura e cópia da semana anterior.
- **v0.24.1** — edição planejada sincronizada com consumo existente e seletor semanal integrado ao plano.
- **v0.24.2** — Dieta reorganizada em Plano, Alimentos, Compras e Ajustes.
- **v0.25.0** — Progresso alimentar com comparação entre semanas, tendência de energia e períodos de 4, 8 ou 12 semanas.
- **v0.26.0** — evolução de peso integrada à Visão geral do Progresso com registros reais, gráfico, médias semanais e peso-meta.
- **v0.27.0** — exercícios de referência e pessoais, fichas privadas e calendário semanal persistente.
- **v0.28.0** — execução de sessões, séries reais, carga, repetições, descanso, conclusão e cancelamento.
- **v0.29.0** — histórico de sessões, frequência, duração, volume e recordes por exercício.
- **v0.30.0** — substituições por sessão, troca nas fichas, ciclos e integração com Hoje, Progresso e exportação.
- **v0.31.0** — hábitos persistentes, frequências, personalização diária e histórico por usuário.
- **v0.32.0** — Planejamento unificado com tarefas, metas, vínculos, leitura e captura rápida.
- **v0.33.0** — execução real no Hoje com check-ins, foco, leitura e sequência persistentes.
- **v0.34.0** — Progresso e revisão reais, históricos, exportação 2.0 e encerramento das rotas locais paralelas.
- **v0.35.0** — Central de notificações in-app com badge, leitura, dispensa e atalhos para a origem.
- **v0.36.0** — Lembretes idempotentes de hábitos, tarefas, treinos, refeições, resumo diário e revisão semanal.
- **v0.37.0** — Preferências por categoria, antecedência, horários, fuso e separação explícita dos canais.
- **v0.38.0** — Base privada de assinaturas push, preparação para e-mail e exportação da conta no esquema 2.1.
- **v0.39.0** — Catálogo Beta/Pro e direitos de acesso persistentes sem retirar recursos atuais.
- **v0.40.0** — Cartão de Assinatura com estado, histórico, preço configurável e acesso ao portal.
- **v0.41.0** — Adaptador Stripe server-side com Checkout hospedado, portal e validação do preço.
- **v0.42.0** — Webhook idempotente, faturas, auditoria privada e exportação da conta no esquema 2.2.
- **v0.42.1** — Apple Pay pelo Checkout hospedado, teste gratuito de 7 dias uma vez por conta e aviso antes do término.
- **v0.43.0** — Termos, Aviso de Privacidade e Consentimento de Dados de Saúde públicos e versionados.
- **v0.44.0** — Aceite, ciência e revogação append-only com registro no cadastro e RLS.
- **v0.45.0** — Central de Privacidade, preferências opcionais e histórico de escolhas.
- **v0.46.0** — Direitos do titular, solicitações autenticadas e exportação da conta no esquema 3.0.
- **v0.47.0** — Política de retenção por categoria e avisos de dados sensíveis em Dieta e Treino.
- **v0.48.0** — Consolidação LGPD, validação idempotente e documentação de lançamento.
- **v0.55.0** — suíte unitária inicial para regras críticas de Perfil, Dieta, Treino e Privacidade.
- **v0.56.0** — cabeçalhos de segurança, CSP e limite transacional das rotas de cobrança.
- **v0.57.0** — atualização estável do Next.js, auditoria de dependências e release audit.
- **v0.58.0** — health check, páginas de erro e canal público de suporte por e-mail.
- **v0.59.0** — CI, smoke E2E público, Docker standalone e configuração Vercel.
- **v0.60.0** — consolidação do candidato a beta privado com pagamentos desativados.

## Migrations aplicadas

- `20260717000000_initial_auth_and_user_data.sql` — informada como aplicada antes da v0.10.0.
- `20260717010000_profile_v010.sql` — aplicada com sucesso em 17/07/2026.
- `20260717020000_diet_foundation.sql` — aplicada e validada em 17/07/2026, incluindo persistência e isolamento com duas contas.
- `20260717030000_diet_weekly_generator.sql` — aplicada e validada em 17/07/2026, incluindo geração, persistência e edição do plano.
- `20260717040000_diet_consumption.sql` — aplicada e validada em 17/07/2026, incluindo registro, remoção e persistência após atualização.
- `20260717050000_custom_foods.sql` — aplicada e validada em 17/07/2026, incluindo cadastro e presença do alimento pessoal no seletor.
- `20260717060000_diet_food_favorites.sql` — aplicada e validada em 17/07/2026, incluindo favoritos e recentes.
- `20260717070000_diet_shopping_checks.sql` — aplicada e validada em 17/07/2026, incluindo plano semanal e lista de compras.
- `20260717080000_diet_recipes.sql` — aplicada e validada em 17/07/2026, incluindo receitas, integração e isolamento.
- **v0.21.0 não exige migration** — reutiliza a persistência segura do plano semanal.
- **v0.22.0 não exige migration** — reutiliza a mesma persistência do plano semanal.
- `20260718000000_diet_meal_templates.sql` — preparada na v0.23.0; aguarda execução e validação no Supabase real.
- **v0.24.0 não exige migration** — usa o suporte existente a um plano por usuário e semana.
- `20260718010000_diet_plan_consumption_sync.sql` — preparada na v0.24.1; aguarda execução e validação no Supabase real.
- **v0.24.2 não exige migration** — reorganiza somente a apresentação dos recursos existentes.
- **v0.25.0 não exige migration** — agrega os registros existentes de consumo sem criar uma fonte paralela de dados.
- **v0.26.0 não exige migration** — reutiliza `weight_history`, `record_weight` e as políticas RLS da v0.10.0.
- `20260718020000_training_system.sql` — preparada na v0.30.0; aguarda execução e validação no Supabase real.
- `20260718030000_productivity_foundation.sql` — aplicada com sucesso no Supabase em 18/07/2026; `npm install` e `npm run dev` também confirmados pelo usuário.
- `20260718040000_notifications_foundation.sql` — preparada na v0.38.0; validada sintaticamente, executada duas vezes em PostgreSQL local e testada com geração idempotente, conclusão de fonte e isolamento RLS; aguarda execução no Supabase real.
- `20260718050000_billing_foundation.sql` — revisão 2 preparada na v0.42.1; configura 7 dias no Apex Pro e mantém a fundação idempotente; aguarda execução no Supabase real.
- `20260718060000_privacy_lgpd_foundation.sql` — preparada na v0.48.0; validada sintaticamente, executada duas vezes em PostgreSQL local e testada com documentos públicos, backfill do cadastro, escolhas append-only, revogação, solicitações, RLS e isolamento; aguarda execução no Supabase real.
- `20260718070000_launch_readiness.sql` — preparada na v0.60.0; adiciona rate limiting privado e server-side às APIs sensíveis; aguarda execução no Supabase real.

## Pendências para concluir a Etapa 1

- Edge Function `delete-account` publicada; falta validar com uma conta descartável.
- Testar exclusão de uma conta descartável.
- Testar exportação, alteração de senha e logout de outras sessões no Supabase real.
- Validar isolamento com duas contas e avatar privado.
- Registrar o resultado desses testes neste arquivo.

## Riscos conhecidos

- Áreas legadas ainda fora da navegação aprovada podem permanecer no código, mas as rotas antigas de produtividade agora encaminham aos fluxos oficiais e não gravam dados funcionais novos no navegador.
- Há suíte unitária e smoke E2E público; autenticação e isolamento RLS ainda exigem validação automatizada ou manual no Supabase real.
- Exclusão de conta depende da publicação da Edge Function.
- Exportação v0.11.0 inclui registros e relação dos arquivos privados, mas não incorpora os bytes das imagens no JSON.
- MFA, monitoramento externo e observabilidade completa dependem das contas de produção; rate limiting server-side já protege Checkout e Portal.
- Cobrança permanece intencionalmente desativada até existirem definição de preço, conta no provedor, credenciais server-side, webhook e teste ponta a ponta em modo de teste.
- Os documentos jurídicos são minutas técnicas. Identidade do controlador, canal de privacidade, operadores, transferências internacionais e bases legais precisam de revisão profissional antes do lançamento.
- Solicitações de privacidade são registradas, mas o fluxo de resposta administrativa será concluído na etapa de Administração e suporte.

## Próxima etapa recomendada

Executar as migrations v0.48.0 e v0.60.0 pendentes, configurar controlador, privacidade e suporte, publicar um Preview privado e concluir `CHECKLIST_LANCAMENTO_BETA.md` antes de convidar usuários.

## Checklist de lançamento

- [ ] Dados fictícios removidos dos fluxos reais
- [ ] Persistência e isolamento validados
- [ ] RLS testado com duas contas
- [ ] Pagamento e cancelamento ponta a ponta
- [ ] Exclusão e exportação validadas
- [ ] Documentos e consentimentos publicados
- [ ] Suporte, logs e monitoramento ativos
- [ ] Backups e restauração configurados
- [ ] Fluxos críticos cobertos por testes
- [ ] Mobile e acessibilidade revisados
- [ ] Sem vulnerabilidade crítica conhecida
- [ ] Regras da Dieta revisadas adequadamente
