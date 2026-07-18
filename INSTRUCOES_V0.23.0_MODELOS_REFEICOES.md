# Apex v0.23.0 — Atualização e teste

## 1. Executar o SQL

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor** e crie uma **New query**.
3. Cole somente o conteúdo de `apex-v0.23.0-modelos-refeicoes-supabase.sql`.
4. Clique em **Run query**.
5. O resultado esperado é `Success. No rows returned`.

Não apague nem repita migrations anteriores.

## 2. Atualizar o projeto local

1. Extraia `apex-v0.23.0-modelos-refeicoes.zip` em uma pasta nova.
2. Copie o `.env.local` da versão anterior para a raiz.
3. Execute:

```bash
npm install
npm run dev
```

## 3. Criar um modelo

1. Entre em **Dieta** e abra **Editar** em uma refeição desbloqueada.
2. Ajuste os itens e quantidades como desejar.
3. Clique em **Salvar como modelo**.
4. Informe um nome e confirme.
5. Feche o editor e confirme que o modelo aparece no cartão **Modelos de refeições**.
6. Atualize a página para confirmar a persistência.

## 4. Aplicar o modelo

1. Abra **Editar** em outra refeição.
2. Clique em **Aplicar modelo**.
3. Escolha o modelo salvo e confirme os itens e totais no editor.
4. Clique em **Salvar no plano**.
5. Confirme a atualização do plano e da lista de compras.
6. Use **Desfazer** para testar a restauração.

## 5. Segurança e gerenciamento

1. Arquive um modelo pelo cartão e confirme que ele desaparece do editor.
2. Entre com uma segunda conta e confirme que ela não vê os modelos da primeira.
3. Tente criar dois modelos ativos com o mesmo nome e confirme a mensagem amigável.

