# Apex v0.19.0 — Atualização e teste

## 1. Executar o SQL

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor** e crie uma nova query.
3. Cole somente o conteúdo de `apex-v0.19.0-lista-compras-supabase.sql`.
4. Clique em **Run query**.
5. O resultado esperado é `Success. No rows returned`.

Se a migration `20260717060000_diet_food_favorites.sql` da v0.18.0 ainda não foi executada, aplique-a antes. Não apague nem repita manualmente as queries antigas: as migrations são incrementais.

## 2. Atualizar o projeto local

1. Extraia `apex-v0.19.0-lista-compras.zip` em uma pasta nova.
2. Copie o seu `.env.local` da versão anterior para a raiz da nova pasta. O ZIP não inclui segredos.
3. Abra o terminal nessa raiz e execute:

```bash
npm install
npm run dev
```

4. Abra `http://localhost:3000` e confirme que `node -p "require('./package.json').version"` mostra `0.19.0`.

## 3. Testar a lista de compras

1. Entre em **Dieta** com uma conta que já tenha um plano semanal.
2. Role até **Compras da semana** e confirme que os ingredientes dos sete dias estão agrupados e somados.
3. Marque dois itens, atualize a página e confirme que continuam marcados.
4. Desmarque um item e atualize novamente.
5. Use **Copiar lista** e cole o conteúdo em um bloco de notas.
6. Troque um ingrediente do plano e confirme que nomes e quantidades da lista mudam sem recarregar a página.
7. Use **Limpar marcas** e confirme a ação.
8. Entre com uma segunda conta e verifique que ela não enxerga as marcações da primeira.

## 4. O que depende do Supabase real

- Criação da tabela e funcionamento das políticas RLS.
- Persistência após recarregar e após novo login.
- Isolamento das marcações entre duas contas.
- Uso com alimentos pessoais e com ingredientes trocados no plano.

