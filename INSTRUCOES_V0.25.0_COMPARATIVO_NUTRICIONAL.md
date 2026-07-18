# Como testar o Apex v0.25.0

## Instalação

1. Extraia `apex-v0.25.0-comparativo-nutricional.zip`.
2. Copie o seu `.env.local` atual para a pasta extraída.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra `http://localhost:3000/progresso`.
6. Selecione a aba **Alimentação**.

Esta versão não possui SQL novo. As migrations anteriores do consumo alimentar e da sincronização entre plano e consumo devem continuar aplicadas.

## Períodos e carregamento

1. Selecione **4 semanas** e confira os indicadores.
2. Repita com **8 semanas** e **12 semanas**.
3. Confirme que a quantidade de refeições, dias, médias e histórico muda conforme o período.
4. Confirme que semanas sem registros aparecem sem barra de consumo, e não como média zero.

## Comparativo semanal

1. Na Dieta, marque refeições de pelo menos dois dias como consumidas.
2. Volte a **Progresso → Alimentação**.
3. Confirme a quantidade de dias e refeições da semana atual.
4. Compare energia e macros com as metas exibidas.
5. Se houver registros na semana anterior, confira as diferenças mostradas.
6. Se não houver, confirme a mensagem **sem base anterior**.

## Atualização dos dados

1. Edite uma refeição já consumida na Dieta.
2. Altere uma quantidade ou um ingrediente e salve.
3. Volte ao comparativo e confirme os novos valores.
4. Atualize a página e confirme que os dados permanecem.

## Segurança e estados vazios

1. Entre com uma segunda conta e confirme que ela não vê os registros da primeira.
2. Teste uma conta sem consumo e confirme o estado vazio.
3. Teste uma conta sem Dieta configurada e confirme o direcionamento para configuração.
4. Desconecte temporariamente a internet para confirmar a mensagem de erro de conexão.
