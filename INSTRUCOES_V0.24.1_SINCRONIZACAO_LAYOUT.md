# Como aplicar e testar o Apex v0.24.1

## 1. Supabase

1. Abra **SQL Editor**.
2. Crie uma nova query.
3. Cole todo o conteúdo de `apex-v0.24.1-sincronizacao-layout-supabase.sql`.
4. Clique em **Run query**.
5. O resultado esperado é `Success. No rows returned`.

A migration é idempotente e não apaga planos nem registros de consumo.

## 2. Aplicativo

1. Extraia `apex-v0.24.1-sincronizacao-layout.zip`.
2. Copie seu `.env.local` atual para a pasta extraída.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra `http://localhost:3000`.

## 3. Sincronização do consumo

1. Abra **Dieta** e marque uma refeição desbloqueada como consumida.
2. Anote o total exibido em **Progresso consumido**.
3. Clique em **Editar** nessa mesma refeição.
4. Altere uma quantidade, remova um item e adicione um alimento ou receita.
5. Salve o plano.
6. Confirme que **Progresso consumido** muda imediatamente, sem marcar a refeição como pendente.
7. Abra **Progresso** e confirme os mesmos valores.
8. Atualize a página e confirme a persistência.

Se houver um alimento adicionado por **Editar consumido**, confirme também que esse item extra permanece após editar o plano.

## 4. Navegação semanal

1. Confirme que não existe mais um cartão independente **Semanas**.
2. Localize o seletor compacto abaixo dos controles do cabeçalho do plano.
3. Teste as setas para navegar.
4. Teste o seletor para voltar diretamente a uma semana salva.

