# Apex v0.10.0 — Perfil persistente

## Implementado

- Três novos cartões recolhíveis no início da página: **Conta**, **Dados físicos** e **Objetivo**.
- Carregamento e persistência dos novos dados diretamente no Supabase, sem `localStorage` para o Perfil.
- Nome, data de nascimento, idade calculada e alteração de e-mail pelo fluxo oficial de confirmação do Supabase.
- Estado explícito de confirmação pendente, mantendo o e-mail atual até a confirmação.
- Avatar em bucket privado, com recorte, enquadramento, zoom, redimensionamento para WebP, troca, remoção e iniciais como fallback.
- Validação de tipo e limite de 8 MB antes do processamento do avatar.
- Sexo biológico, altura, peso e percentual de gordura com validações de faixa e mensagens junto aos campos.
- Atualização atômica dos dados físicos e criação de histórico somente quando o peso muda.
- `record_weight` reutilizável para futuras origens `dashboard`, `progress` e `integration`.
- Objetivos emagrecer, manter peso e ganhar massa, com comportamento e validação do peso-meta.
- Avaliação simples de atividade e armazenamento separado de respostas, nível sugerido e nível escolhido.
- Ritmo conservador, moderado ou acelerado, com sugestão inicial moderada e edição manual.
- Indicador de completude do Perfil, lista de pendências e uso do aplicativo sem bloqueio.
- Aviso de personalização limitada nas áreas Treino e Dieta.
- Confirmação antes de descartar mudanças e proteção ao sair da página com alterações pendentes.
- Estados de carregamento, sem alterações, salvando, sucesso, erro de conexão, erro de sessão e erro de upload.
- Migration idempotente com colunas, índices, histórico de peso, funções, RLS e políticas do Storage.

## Compatibilidade preservada

- Navegação principal permanece: Planejar · Progresso · Hoje · Treino · Dieta.
- Perfil e Configurações continuam acessíveis apenas pelo ícone superior.
- Foram preservados os cartões reais encontrados no ZIP: Configurações da conta, Histórico de Energia & Check-ins, Histórico de Foco, Histórico de Leitura e Backup dos Dados.
- O ZIP recebido não continha cartões chamados Fotos de progresso, Histórico de treinos, Histórico de hábitos, Preferências de notificação, Segurança, Privacidade ou Assinatura; nenhuma seção existente foi removida e nenhuma seção fictícia foi criada.

## Verificações executadas

- `npm ci`: concluído.
- `npm run typecheck`: concluído, sem erros.
- `npm run lint`: concluído, sem erros e com 29 avisos antigos não relacionados.
- `npm run build`: concluído, compilação e geração das 25 páginas bem-sucedidas.

Os avisos antigos concentram-se em usos de `any`, imports/variáveis não utilizados, dependências de hooks e uma chamada de `Date.now()` durante renderização. Eles foram mantidos para evitar alterações fora do escopo.
