# Apex v0.22.0 — Atualização e teste

## 1. Banco de dados

Esta versão **não exige SQL novo**. Mantenha as migrations já aplicadas.

## 2. Atualizar o projeto local

1. Extraia `apex-v0.22.0-copia-refeicoes.zip` em uma pasta nova.
2. Copie o `.env.local` da versão anterior para a raiz.
3. Execute:

```bash
npm install
npm run dev
```

## 3. Testar a cópia

1. Entre em **Dieta** e escolha uma refeição do plano.
2. Clique em **Copiar**.
3. Selecione dois dias de destino.
4. Confirme que destinos bloqueados não podem ser selecionados.
5. Clique em **Copiar para 2 dias**.
6. Abra os dias escolhidos e confirme os mesmos itens e quantidades.
7. Confirme que nome e horário de cada refeição foram preservados.
8. Atualize a página e verifique a persistência.

## 4. Testar proteções e integrações

1. Copie uma refeição para um destino que já tenha consumo registrado e confirme que o histórico consumido não mudou.
2. Confira o recálculo dos totais dos dias.
3. Confira a atualização da lista de compras.
4. Use **Desfazer** e confirme a restauração dos destinos.
5. Bloqueie uma refeição de destino e confirme que ela permanece protegida em uma nova cópia.

