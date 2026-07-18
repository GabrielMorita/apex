# Apex v0.26.0 — Evolução de peso no Progresso

## Implementado

- Nova seção **Evolução de peso** no início de **Progresso → Visão geral**.
- Peso atual carregado do Perfil.
- Peso-meta e objetivo carregados do Perfil.
- Períodos selecionáveis de **4, 8 ou 12 semanas**.
- Gráfico temporal com registros reais de `weight_history`.
- Linha de peso-meta quando ela estiver configurada.
- Variação entre o primeiro e o último registro do período.
- Média do peso registrado na semana atual.
- Comparação entre as médias da semana atual e anterior.
- Histórico dos oito registros diários mais recentes do período.
- Registro de peso diretamente pelo Progresso com origem `progress`.

## Regras dos dados

- A leitura utiliza somente `weight_history` e o Perfil autenticado.
- Quando há mais de um registro no mesmo dia, o gráfico usa o último registro daquele dia.
- Semanas e dias sem registro não são tratados como peso zero.
- O novo registro usa a função `record_weight`, que também atualiza `profiles.weight_kg`.
- Um mesmo valor já registrado no dia não é enviado novamente pelo formulário.
- O gráfico descreve registros passados e não projeta peso futuro.
- Nenhuma interpretação clínica foi adicionada.

## Estados da interface

- Carregamento e troca de período.
- Sessão indisponível.
- Falha de conexão com Supabase.
- Estrutura v0.10.0 ausente.
- Histórico vazio.
- Semana atual ou anterior sem registros suficientes.
- Salvando, sucesso, validação e erro no novo registro.

## Banco e segurança

- Nenhuma migration nova é necessária.
- RLS existente restringe o histórico a `auth.uid()`.
- A função `record_weight` usa `security invoker`.
- Nenhum dado de peso foi colocado em `localStorage`.
- A antiga área **Corpo** não foi recriada.

## Arquivos principais

- `src/components/profile/WeightProgress.tsx`
- `src/components/workspaces/ProgressOverview.tsx`
- `src/lib/profile/weightAnalytics.ts`
- `src/lib/profile/service.ts`
- `src/lib/profile/types.ts`
- `docs/APEX-ROADMAP.md`

## Validação local

- TypeScript (`npm run typecheck`): aprovado.
- ESLint (`npm run lint`): 0 erros e 28 avisos antigos fora do escopo.
- Build de produção (`npm run build`): consultar o resultado final da entrega.

## Teste pendente em Supabase real

- Registrar o peso pelo Progresso e confirmar atualização no Perfil.
- Confirmar persistência após atualizar a página.
- Testar dois valores diferentes no mesmo dia.
- Testar períodos e semanas sem registro.
- Confirmar isolamento com duas contas.
