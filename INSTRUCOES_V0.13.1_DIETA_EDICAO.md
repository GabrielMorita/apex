# Apex v0.13.1 — Atualização e teste

## Atualizar

1. Extraia o ZIP da v0.13.1 em uma pasta nova.
2. Copie o `.env.local` da versão que já está funcionando.
3. Não execute outro SQL: a migration v0.13.0 já aplicada é suficiente.
4. Execute `npm install` e `npm run dev`.
5. Confirme a versão com `node -p "require('./package.json').version"`; o resultado deve ser `0.13.1`.

## Testar

1. Abra **Dieta** e selecione um dia.
2. Em um ingrediente de uma refeição desbloqueada, clique em **Escolher**.
3. Pesquise ou selecione uma alternativa.
4. Confirme que somente o ingrediente mudou e que a refeição e o dia foram recalculados.
5. Use o botão **Desfazer** no aviso flutuante e confirme a restauração.
6. Atualize a página e confirme a persistência.
7. Bloqueie uma refeição e confirme que os botões de troca ficam desativados.

As porções continuam sendo estimativas provisórias para adultos saudáveis, não prescrição clínica.
