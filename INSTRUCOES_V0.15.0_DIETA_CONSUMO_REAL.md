# Apex v0.15.0 — Atualização e teste

## Atualizar

1. Extraia o ZIP em uma pasta nova.
2. Copie o `.env.local` da v0.14.0.
3. Não execute outro SQL: a migration v0.14.0 já aplicada é suficiente.
4. Execute `npm install` e `npm run dev`.
5. Confirme a versão com `node -p "require('./package.json').version"`; o resultado deve ser `0.15.0`.

## Testar

1. Abra **Dieta** e localize uma refeição marcada como consumida.
2. Clique em **Editar consumido**.
3. Altere a quantidade de um alimento e confirme a atualização dos totais no editor.
4. Remova um item que não foi ingerido.
5. Use **Adicionar alimento extra**, pesquise e escolha um alimento.
6. Clique em **Salvar consumo real** e confirme a atualização do progresso diário.
7. Verifique que os itens e porções do planejamento continuam inalterados.
8. Atualize a página e confirme a persistência.

É necessário manter pelo menos um alimento no registro. Para remover a refeição inteira do consumo, use **Marcar como pendente**.
