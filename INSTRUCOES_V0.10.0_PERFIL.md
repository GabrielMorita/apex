# Instalação e teste — Apex v0.10.0

## 1. Executar a migration no Supabase

1. Abra o projeto correto no painel do Supabase.
2. Acesse **SQL Editor** e clique em **New query**.
3. Abra `supabase/migrations/20260717010000_profile_v010.sql` deste projeto.
4. Copie o conteúdo completo, cole no editor e clique em **Run**.
5. Confirme no **Table Editor** a existência de `profiles` com os novos campos e da tabela `weight_history`.
6. Em **Storage**, confirme o bucket privado `avatars`.

A migration é idempotente: pode ser executada novamente sem apagar dados. Execute primeiro a migration inicial caso este seja um banco novo.

## 2. Rodar localmente

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`, faça login e acesse o ícone de Perfil no cabeçalho.

O `.env.local` não acompanha o ZIP. Se necessário, copie `.env.example` para `.env.local` e preencha somente a URL e a Publishable Key do Supabase.

## 3. Roteiro curto de teste

1. Em **Conta**, salve nome e nascimento; recarregue a página e confirme a persistência.
2. Solicite um novo e-mail; confirme que o e-mail antigo continua exibido e que aparece o aviso pendente.
3. Envie uma foto, ajuste zoom e posição, salve, troque e remova.
4. Em **Dados físicos**, salve altura e peso; altere o peso uma vez e confirme um novo registro em `weight_history` com origem `profile`.
5. Clique uma única vez em salvar e confirme que não aparecem registros duplicados.
6. Em **Objetivo**, teste emagrecer e ganhar massa com peso-meta inválido e válido; em manter peso, confirme que o campo some e o banco recebe `null`.
7. Complete a avaliação de atividade, altere manualmente o nível sugerido e recarregue.
8. Deixe campos obrigatórios vazios e confirme o indicador de completude e os avisos não bloqueantes em Treino e Dieta.
9. Faça logout, entre com outra conta e confirme que ela não enxerga perfil, histórico ou avatar da primeira.
10. Volte à primeira conta e confirme os dados após atualizar a página.

## 4. O que exige um Supabase real

- Aplicação efetiva da migration e validação das políticas RLS.
- Confirmação de alteração de e-mail, pois depende das configurações e do envio de e-mail do projeto.
- Upload, URL assinada, troca e remoção do avatar no Storage.
- Teste de isolamento com duas contas autenticadas.
- Persistência do histórico e ausência de duplicação sob cliques/requisições reais.

Nenhuma Secret Key, `service_role` ou senha do banco é necessária no navegador.
