# Instalação e teste — Apex v0.11.0

## Banco

Não há nova migration SQL nesta versão. A migration v0.10.0 já foi aplicada com sucesso.

## Publicar a função de exclusão

O código está em `supabase/functions/delete-account/index.ts`.

Com a Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy delete-account
```

O Supabase hospedado fornece `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` à função. Não copie a `service_role` para `.env.local` nem para variáveis `NEXT_PUBLIC_*`.

Também é possível criar e publicar a função pelo editor de Edge Functions do painel, copiando o conteúdo de `index.ts`.

## Rodar o aplicativo

```bash
npm ci
npm run dev
```

## Roteiro de teste

1. Abra Perfil → Segurança e altere a senha.
2. Saia e confirme que a nova senha funciona.
3. Conecte a mesma conta em outro navegador e use “Sair dos outros dispositivos”.
4. Confirme que a sessão atual permanece e a outra deixa de renovar a sessão.
5. Use “Baixar meus dados” e confira Perfil, `weight_history` e `module_state` no JSON.
6. Crie uma conta descartável, envie um avatar e preencha alguns dados.
7. Digite `EXCLUIR`, confirme e valide o retorno à tela de login.
8. No Supabase, confirme que o usuário, Perfil, histórico, estado sincronizado e avatar foram removidos.
9. Verifique que outra conta permanece intacta.

## Limitações que exigem teste real

- Publicação e invocação da Edge Function.
- Revogação efetiva das outras sessões.
- Exclusão completa de uma conta descartável.
- Isolamento RLS com duas contas.
- O JSON relaciona avatares, mas não inclui os bytes das imagens.
