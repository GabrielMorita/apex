# Apex v0.21.0 — Atualização e teste

## 1. Banco de dados

Esta versão **não exige SQL novo**. As migrations até a v0.20.0 já foram aplicadas e validadas.

## 2. Atualizar o projeto local

1. Extraia `apex-v0.21.0-edicao-plano.zip` em uma pasta nova.
2. Copie o `.env.local` da v0.20.0 para a raiz da nova pasta.
3. Execute:

```bash
npm install
npm run dev
```

4. Abra `http://localhost:3000`.

## 3. Testar a edição da refeição

1. Entre em **Dieta** e abra um dia do plano.
2. Em uma refeição desbloqueada, clique em **Editar**.
3. Altere a quantidade de um item e observe os totais.
4. Remova um item.
5. Clique em **Adicionar receita ou alimento**.
6. Use o filtro **Receitas**, escolha uma preparação e salve no plano.
7. Confirme a mensagem de sucesso e os novos totais da refeição e do dia.
8. Atualize a página e confirme que a edição permaneceu salva.

## 4. Testar integrações

1. Confira se a lista de compras mudou conforme os itens e quantidades.
2. Se foi adicionada uma receita, confirme que a lista mostra os ingredientes dela.
3. Faça outra edição e use **Desfazer**.
4. Bloqueie uma refeição e confirme que o botão **Editar** fica desativado.
5. Em uma refeição já consumida, abra o editor e confirme o aviso de que o consumo real será preservado.

