# Como testar o Apex v0.24.0

## Instalação

1. Extraia `apex-v0.24.0-planejamento-semanas.zip`.
2. Copie o seu `.env.local` atual para a pasta extraída.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra `http://localhost:3000` e entre na mesma conta usada nos testes anteriores.

## Supabase

Esta versão não possui SQL novo. Antes de testar os modelos de refeições, execute a migration separada entregue com a v0.23.0, caso ainda esteja pendente.

## Fluxo principal

1. Abra **Dieta**.
2. Localize o cartão **Semanas**, acima do plano.
3. Use a seta para a direita e entre em uma semana futura.
4. Gere um plano novo ou escolha **Copiar semana anterior**.
5. Atualize a página e confirme que o plano futuro permanece salvo.
6. Volte para **Esta semana**.
7. Entre em uma semana anterior que possua plano e confirme o selo **Somente leitura**.
8. Confirme que editar, trocar, regenerar, bloquear e copiar refeições estão indisponíveis no histórico.
9. Confirme que os registros de consumo histórico continuam visíveis e editáveis.
10. Verifique que a lista de compras muda junto da semana selecionada.

## Teste com duas contas

1. Na conta A, crie um plano para a próxima semana.
2. Saia e entre na conta B.
3. Confirme que a semana criada pela conta A não aparece.
4. Volte à conta A e confirme que o plano reaparece.

