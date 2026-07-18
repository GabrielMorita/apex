# Como instalar o Apex v0.34.0

## 1. Pré-requisito

Este ZIP continua o Apex v0.30.0. A migration de Treino `20260718020000_training_system.sql` deve estar executada, pois metas podem ser vinculadas às fichas de treino.

Não apague nem substitua as queries anteriores do Supabase.

## 2. Executar o novo SQL

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo separado `apex-v0.34.0-produtividade.sql` ou, dentro do ZIP, `supabase/migrations/20260718030000_productivity_foundation.sql`.
5. Confirme que a primeira linha contém **REVISAO SQL 2**.
6. Copie o arquivo inteiro, cole na query e clique em **Run query**.
7. O resultado esperado é **Success. No rows returned**.

O aviso de operação potencialmente destrutiva pode aparecer porque a migration substitui apenas policies e triggers com nomes controlados pelo Apex. Ela não apaga tabelas nem registros.

## 3. Verificação rápida opcional

Execute em uma nova query:

```sql
select
  to_regclass('public.productivity_habits') as habits,
  to_regclass('public.productivity_tasks') as tasks,
  to_regclass('public.productivity_goals') as goals,
  to_regclass('public.productivity_daily_checkins') as checkins,
  to_regclass('public.productivity_focus_sessions') as focus_sessions,
  to_regclass('public.reading_projects') as reading_projects;

select count(*) as productivity_policies
from pg_policies
where schemaname = 'public'
  and (tablename like 'productivity_%' or tablename like 'reading_%');
```

As seis colunas devem mostrar os nomes das tabelas. `productivity_policies` deve retornar **16**.

## 4. Executar o projeto

1. Extraia `apex-v0.34.0-produtividade.zip`.
2. Copie o seu `.env.local` atual para a nova pasta. O ZIP não inclui esse arquivo.
3. Mantenha apenas a URL e a Publishable/Anon Key do Supabase no frontend; nunca use `service_role` ou Secret Key.
4. Abra o terminal na pasta que contém `package.json`.
5. Execute `npm install`.
6. Execute `npm run dev`.
7. Abra `http://localhost:3000` e entre na sua conta.

## 5. Como começar a usar

- Em **Planejamento → Crie novos hábitos**, cadastre sua rotina real.
- Em **Planejamento → Organize sua rotina**, personalize os dias e crie tarefas.
- Em **Planejamento → Metas de longo prazo**, crie metas e faça os vínculos desejados.
- Em **Planejamento → Biblioteca de leitura**, cadastre livros e ciclos.
- Use **Hoje** para concluir hábitos, tarefas, leitura, foco e check-in.
- Use **Progresso** para acompanhar consistência, metas, alimentação e revisão semanal.
- Use **Capturar** para registrar rapidamente uma tarefa ou ideia.

## 6. Validação contínua escolhida

Não é necessário executar um roteiro completo antes de começar. Use o aplicativo normalmente e registre qualquer erro, comportamento confuso ou melhoria desejada. Para facilitar uma correção futura, envie:

- a tela e a ação realizada;
- o texto exato do erro;
- um print, se houver;
- se o problema permaneceu após atualizar a página;
- se ocorreu em uma ou mais contas.

## 7. O que ainda depende do ambiente real

- Execução do SQL no Supabase de produção/desenvolvimento do usuário.
- Persistência após logout e novo login.
- Isolamento com duas contas reais.
- Comportamento com conexão instável.
- Revisão visual em diferentes tamanhos de tela durante o uso cotidiano.
