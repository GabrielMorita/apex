# Como testar o Apex v0.26.0

## Instalação

1. Extraia `apex-v0.26.0-evolucao-peso.zip`.
2. Copie seu `.env.local` atual para a pasta extraída.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra `http://localhost:3000/progresso`.
6. Selecione **Visão geral**.

Esta versão não possui SQL novo. A migration v0.10.0 do Perfil deve estar aplicada.

## Dados atuais

1. Confirme o peso atual exibido no Perfil.
2. Confirme o peso-meta ou o estado de manutenção.
3. Compare os registros recentes com alterações anteriores feitas em Dados físicos.

## Novo registro

1. Informe um peso entre 30 e 350 kg no cartão **Peso de hoje**.
2. Clique em **Registrar peso**.
3. Confirme a mensagem de sucesso.
4. Atualize a página e confirme a persistência.
5. Abra o Perfil e confirme que **Peso atual** foi atualizado.
6. Tente salvar novamente o mesmo valor no mesmo dia e confirme que ele não é duplicado pela interface.

## Períodos e tendência

1. Alterne entre **4 semanas**, **8 semanas** e **12 semanas**.
2. Confirme que o histórico e o gráfico respeitam o período.
3. Confirme que dias sem registro não aparecem como peso zero.
4. Se houver peso-meta, confirme a linha correspondente no gráfico.
5. Confira as médias da semana atual e anterior.

## Segurança e erros

1. Entre com uma segunda conta e confirme que ela não vê os pesos da primeira.
2. Teste uma conta sem histórico e confirme o estado vazio.
3. Desconecte temporariamente a internet para conferir a mensagem de conexão.
4. Informe valores inválidos, negativos ou fora do limite e confirme a validação junto ao campo.
