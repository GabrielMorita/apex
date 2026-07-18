# Apex v0.16.0 — Atualização e teste

## Atualizar

1. Extraia o ZIP em uma pasta nova.
2. Copie o `.env.local` da v0.15.0.
3. Não execute outro SQL: a migration v0.14.0 já aplicada é suficiente.
4. Execute `npm install` e `npm run dev`.
5. Confirme a versão com `node -p "require('./package.json').version"`; o resultado deve ser `0.16.0`.

## Testar a tela Hoje

1. Abra **Hoje** e escolha uma data da semana.
2. Localize o cartão **Dieta**.
3. Confirme que ele mostra apenas as refeições consumidas naquela data.
4. Compare energia e macros com as metas configuradas.
5. Troque a data selecionada e confirme que o resumo acompanha a seleção.

## Testar a tela Progresso

1. Abra **Progresso** e selecione **Alimentação**.
2. Confira o gráfico dos últimos sete dias.
3. Confira as médias e o histórico dos últimos 28 dias.
4. Volte à Dieta, altere um consumo real e salve.
5. Retorne a **Hoje** e **Progresso** e confirme os novos totais.
6. Atualize a página e confirme que os dados continuam presentes.

Para validar o estado vazio, utilize uma conta sem refeições consumidas. Nenhum dia deverá receber dados fictícios.

