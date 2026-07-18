# Como testar o Apex v0.24.2

## Instalação

1. Extraia `apex-v0.24.2-abas-dieta.zip`.
2. Copie o seu `.env.local` atual para a pasta extraída.
3. Execute `npm install`.
4. Execute `npm run dev`.
5. Abra `http://localhost:3000/dieta`.

Esta versão não possui SQL novo. A migration da v0.24.1 deve estar aplicada para que edições de refeições consumidas sejam sincronizadas.

## Navegação

1. Confirme a ordem **Plano · Alimentos · Compras · Ajustes**.
2. Confirme que Plano abre por padrão.
3. Abra cada seção e atualize a página.
4. Use os botões voltar e avançar do navegador.
5. Confirme que a seção correta permanece selecionada.

## Plano e Compras

1. No Plano, selecione outra semana.
2. Abra Compras e confirme a mesma semana.
3. Marque e desmarque um item.
4. Volte para Plano e confirme que a lista não aparece mais no final da página.
5. Selecione uma semana sem plano em Compras e use **Ir para Plano**.

## Alimentos

1. Alterne entre **Meus alimentos**, **Receitas** e **Modelos**.
2. Abra os formulários de criação e feche sem salvar.
3. Confirme que listas, edição e arquivamento permanecem disponíveis.

## Ajustes

1. Confirme metas e macronutrientes.
2. Teste **Recalcular com o Perfil**.
3. Abra **Editar configuração** e cancele.
4. Confirme as preferências e restrições já salvas.

