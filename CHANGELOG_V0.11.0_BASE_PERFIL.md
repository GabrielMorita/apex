# Apex v0.11.0 — Fechamento da Base técnica e Perfil

## Implementado

- Alteração de senha dentro da área Segurança.
- Encerramento de outras sessões com `scope: others`, mantendo a sessão atual.
- Logout comum alterado para `scope: local`, evitando desconectar todos os dispositivos sem aviso.
- Exportação JSON dos dados reais: conta, Perfil, histórico de peso, estados sincronizados e relação de avatares.
- Exclusão definitiva por Edge Function autenticada.
- Remoção do avatar privado antes da exclusão do usuário.
- Exclusão em cascata dos dados vinculados ao usuário.
- Limpeza do cache local da conta excluída.
- Confirmação textual e confirmação final antes da exclusão.
- Mensagem de conta excluída na tela de login.
- Roadmap mestre em `docs/APEX-ROADMAP.md`.

## Segurança

- A chave `service_role` é usada somente dentro da Edge Function hospedada no Supabase.
- Nenhuma chave privilegiada é enviada ao navegador ou incluída no `.env.example`.
- A função valida o JWT e a confirmação antes de excluir.
- Exportações continuam protegidas pelas políticas RLS do usuário autenticado.

## Dependência operacional

A exclusão de conta só funciona depois que `delete-account` for publicada no Supabase. Os demais recursos desta versão não exigem migration adicional.

## Arquivos principais alterados

- `src/components/auth/AuthProvider.tsx`
- `src/components/profile/ProfileSettings.tsx`
- `src/components/profile/SecurityCard.tsx`
- `src/components/profile/AccountDataCard.tsx`
- `src/lib/account/service.ts`
- `src/app/entrar/page.tsx`
- `supabase/functions/delete-account/index.ts`
- `docs/APEX-ROADMAP.md`
- `package.json`, `package-lock.json` e `tsconfig.json`

## Verificações executadas

- `npm run typecheck`: concluído sem erros.
- `npm run lint`: concluído sem erros; permanecem 29 avisos antigos não relacionados.
- `npm run build`: concluído; 25 páginas geradas.
- `deno check supabase/functions/delete-account/index.ts`: concluído sem erros.

Não foram marcados como testados: publicação e invocação da função, alteração real de senha, revogação em outro dispositivo e exclusão ponta a ponta. Esses fluxos dependem do projeto Supabase e de contas descartáveis.
