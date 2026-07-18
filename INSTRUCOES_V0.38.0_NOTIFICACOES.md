# Como instalar o Apex v0.38.0

## 1. Pré-requisito

Este ZIP continua o Apex v0.34.0. Como o SQL de Produtividade já retornou `Success. No rows returned` e o projeto iniciou corretamente, você pode instalar esta migration diretamente.

Não apague nem substitua as queries anteriores do Supabase.

## 2. Executar o novo SQL

1. Abra o mesmo projeto no Supabase.
2. Entre em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo separado `apex-v0.38.0-notificacoes.sql` ou, dentro do ZIP, `supabase/migrations/20260718040000_notifications_foundation.sql`.
5. Confirme que a primeira linha contém **REVISAO SQL 2**.
6. Copie o arquivo inteiro, cole na nova query e clique em **Run query**.
7. O resultado esperado é **Success. No rows returned**.

O editor pode avisar sobre operações potencialmente destrutivas porque a migration recria somente policies e triggers com nomes controlados pelo Apex. Ela não apaga tabelas nem registros funcionais.

## 3. Verificação rápida opcional

Execute em uma nova query:

```sql
select
  to_regclass('public.notification_preferences') as preferences,
  to_regclass('public.notifications') as notifications,
  to_regclass('public.notification_push_subscriptions') as push_subscriptions;

select count(*) as notification_policies
from pg_policies
where schemaname = 'public'
  and tablename in (
    'notification_preferences',
    'notifications',
    'notification_push_subscriptions'
  );
```

As três colunas devem mostrar os nomes das tabelas e `notification_policies` deve retornar **3**.

## 4. Executar o projeto

1. Extraia `apex-v0.38.0-notificacoes.zip`.
2. Copie o seu `.env.local` atual para a nova pasta. O ZIP não inclui esse arquivo.
3. Não coloque `service_role`, Secret Key ou senha do banco no frontend.
4. Abra o terminal na pasta que contém `package.json`.
5. Execute `npm install`.
6. Execute `npm run dev`.
7. Abra `http://localhost:3000` e entre na sua conta.

## 5. Como usar

- O sino no cabeçalho abre a central e mostra a quantidade de avisos não lidos.
- Clique em uma notificação para ir ao Hoje, Treino, Dieta ou Revisão relacionada.
- Use o `X` para dispensar um aviso ou **Marcar como lidas** para limpar o badge.
- Abra **Configurações → Preferências de notificação** para escolher categorias, antecedência e horários.
- Lembretes futuros aparecem quando chegam ao horário. A central sincroniza ao abrir, a cada cinco minutos e depois de alterações nas fontes.

## 6. Limite intencional desta versão

A central dentro do Apex funciona nesta versão. Push do navegador e e-mail estão apenas preparados no banco e aparecem desativados na interface. Ativá-los corretamente exige escolher um provedor, guardar credenciais fora do navegador, obter consentimento e publicar um processo server-side de entrega.

## 7. Validação durante o uso

Você pode começar a usar sem um roteiro formal. Se encontrar algo, envie a tela, a ação feita, o texto exato do erro e se o problema continuou após atualizar a página.
