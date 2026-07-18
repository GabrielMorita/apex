# Como instalar e testar o Apex v0.30.0

## 1. Executar o SQL no Supabase

1. Abra o projeto correto no Supabase.
2. Entre em **SQL Editor**.
3. Clique em **New query**.
4. Abra `supabase/migrations/20260718020000_training_system.sql` do ZIP. Confirme que a primeira linha contém **REVISAO SQL 2**.
5. Copie o arquivo inteiro, cole na nova query e clique em **Run query**.
6. O resultado esperado é **Success. No rows returned**.

O editor pode mostrar um aviso de operação potencialmente destrutiva porque a migration substitui policies e triggers com os nomes controlados pelo Apex. Ela não contém `drop table`, não remove tabelas existentes e não apaga registros de treino.

Não substitua nem apague as migrations anteriores. Esta é uma nova query adicionada ao esquema atual.

## 2. Verificação opcional do banco

Depois da execução, use uma segunda query:

```sql
select
  to_regclass('public.training_exercises') as exercises,
  to_regclass('public.training_templates') as templates,
  to_regclass('public.training_schedule') as schedule,
  to_regclass('public.training_sessions') as sessions,
  to_regclass('public.training_session_sets') as session_sets;

select count(*) as reference_exercises
from public.training_exercises
where user_id is null and source_type = 'reference';
```

As cinco colunas da primeira consulta devem mostrar os respectivos nomes e `reference_exercises` deve ser pelo menos 18.

## 3. Executar localmente

1. Extraia `apex-v0.30.0-treino-completo-REVISAO-2.zip`.
2. Copie seu `.env.local` atual para a pasta extraída.
3. Não altere a Publishable Key para uma Secret Key ou `service_role`.
4. Execute `npm install`.
5. Execute `npm run dev`.
6. Abra `http://localhost:3000` e entre na sua conta.
7. Abra **Treino** pela navegação principal.

## 4. Biblioteca e ficha

1. Entre em **Treino → Plano / ciclos → Biblioteca**.
2. Pesquise e filtre os exercícios de referência.
3. Crie um exercício pessoal e confirme que ele pode ser editado.
4. Abra **Fichas**, crie uma ficha e adicione exercícios.
5. Ajuste séries, repetições, carga e intervalo.
6. Edite a ficha, troque um exercício e salve.
7. Duplique a ficha e confirme a cópia.

## 5. Semana e execução

1. Abra **Plano / ciclos → Semana**.
2. Adicione a ficha em um dia e horário.
3. Volte para **Treino da semana**.
4. Inicie o treino.
5. Edite repetições e carga, conclua séries e confira o cronômetro de descanso.
6. Em um exercício ainda não iniciado, escolha uma substituição e clique em **Trocar**.
7. Feche a execução, abra novamente e confirme a retomada.
8. Conclua o treino e confirme o estado somente leitura.
9. Faça outro teste cancelando uma execução e confirme que o treino volta a ficar planejado.

## 6. Histórico, Hoje e Progresso

1. Abra **Treino → Histórico**.
2. Confirme sessão, duração, séries, volume e recordes.
3. Alterne entre 4, 8 e 12 semanas.
4. Abra **Hoje** e selecione a data do treino; confira o resumo e o atalho.
5. Abra **Progresso** e confira o total real de treinos da semana.
6. Atualize a página e confirme que os dados permanecem.
7. Saia, entre novamente e repita a conferência.

## 7. Ciclos e isolamento

1. Abra **Plano / ciclos → Ciclos** e crie um ciclo.
2. Associe um treino do calendário ao ciclo.
3. Edite o ciclo e confira a associação.
4. Entre com uma segunda conta e confirme que ela não vê fichas, exercícios pessoais, ciclos, agenda, sessões ou séries da primeira.
5. Confirme que ambas as contas veem apenas o catálogo de exercícios de referência compartilhado.

## 8. Estados de erro

1. Tente criar nomes muito curtos e valores fora dos limites.
2. Tente usar uma URL de vídeo sem `http://` ou `https://`.
3. Desconecte temporariamente a internet e confira a mensagem amigável.
4. Tente substituir um exercício depois de concluir uma série; a troca deve ficar indisponível.
5. Clique várias vezes em iniciar o mesmo treino; deve existir apenas uma sessão ativa para aquele agendamento.
