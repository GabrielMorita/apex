# Apex v0.20.0 — Atualização e teste

## 1. Executar o SQL

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor** e crie uma **New query**.
3. Cole somente o conteúdo de `apex-v0.20.0-receitas-supabase.sql`.
4. Clique em **Run query**.
5. O resultado esperado é `Success. No rows returned`.

As migrations v0.18.0 e v0.19.0 já foram confirmadas no seu projeto. Não apague tabelas nem execute queries antigas novamente.

## 2. Atualizar o projeto local

1. Extraia `apex-v0.20.0-receitas.zip` em uma pasta nova.
2. Copie o seu `.env.local` da v0.19.0 para a raiz da nova pasta. O ZIP não inclui segredos.
3. Execute na raiz:

```bash
npm install
npm run dev
```

4. Abra `http://localhost:3000` e confirme que `node -p "require('./package.json').version"` mostra `0.20.0`.

## 3. Testar uma receita

1. Entre em **Dieta** e localize **Minhas receitas**, abaixo de **Meus alimentos**.
2. Clique em **Nova receita**.
3. Informe um nome e adicione pelo menos dois ingredientes.
4. Ajuste as quantidades, as porções e o rendimento final.
5. Confirme que os valores por porção mudam imediatamente.
6. Salve e atualize a página; a receita deve continuar listada.
7. Edite a receita, altere uma quantidade e salve novamente.

## 4. Testar a reutilização

1. Em uma refeição do plano, clique em **Escolher** em um ingrediente compatível.
2. Procure a receita pelo nome e confirme o selo **Receita**.
3. Selecione-a e confirme que o plano é recalculado e salvo.
4. Confira a lista de compras: ela deve mostrar os ingredientes da receita, proporcionalmente, e não apenas o nome da preparação.
5. Registre uma refeição como consumida, abra **Editar consumido** e procure a receita em **Adicionar alimento extra**.
6. Favorite a receita e confirme que ela aparece no filtro de favoritos.

## 5. Segurança e persistência

1. Atualize a página e faça novo login para confirmar a persistência.
2. Entre com uma segunda conta e confirme que ela não vê as receitas da primeira.
3. Arquive uma receita e confirme que ela desaparece dos novos seletores, sem alterar registros anteriores.

O cálculo, a persistência, a expansão na lista de compras e o isolamento dependem de validação no Supabase real.

