# Apex 0.8.0 — Etapa 1: base técnica

## Concluído

- Atualização de Next.js 14 para Next.js 16.2.9.
- Atualização de React, React DOM, Framer Motion e Lucide React.
- Build de produção corrigido e validado.
- TypeScript validado com `npm run typecheck`.
- ESLint configurado para Next.js e TypeScript com `npm run lint`.
- Comando agregado `npm run check` adicionado.
- Configuração de build standalone adicionada.
- Headers básicos de segurança adicionados.
- Header identificador do Next.js desativado.
- Componente duplicado da tela Dieta removido da rota; a rota agora reutiliza `DietPlan`.
- Versão do projeto atualizada para 0.8.0.

## Validação executada

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

O build gera todas as rotas com sucesso.

## Pendências conhecidas

- Há avisos de lint legados, sem impedir o build.
- Os dados ainda usam localStorage e dados de demonstração.
- Ainda faltam autenticação, banco de dados, pagamentos, documentos legais e monitoramento.
- O relatório do npm mantém duas ocorrências moderadas relacionadas ao PostCSS interno do Next.js; não foi aplicado downgrade inseguro. Deve ser revisto quando houver atualização oficial compatível.
