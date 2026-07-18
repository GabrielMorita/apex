# Instalação — Apex v0.48.0

## 1. Executar a migration

No Supabase, abra **SQL Editor**, crie uma nova query e execute todo o conteúdo de `apex-v0.48.0-privacidade-lgpd.sql`.

Não apague migrations nem tabelas anteriores. O arquivo é adicional, idempotente e não destrutivo. O resultado normal é:

```text
Success. No rows returned
```

Confira a instalação:

```sql
select document_type, version, title, public_path, is_current
from public.privacy_documents
order by document_type;

select code, data_category, is_active
from public.privacy_retention_rules
order by sort_order;
```

O esperado são três documentos atuais na versão `2026-07-18.1` e seis regras de retenção ativas.

## 2. Configurar a identidade jurídica

No `.env.local`, preencha informações públicas reais:

```env
NEXT_PUBLIC_DATA_CONTROLLER_NAME=Nome ou razão social do controlador
NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL=privacidade@seudominio.com.br
```

Esses valores não são secretos. Não publique o produto com os avisos “não configurado”.

## 3. Instalar e iniciar

```bash
npm install
npm run check
npm run dev
```

## 4. Verificação manual

1. Abra `/termos`, `/privacidade` e `/dados-saude` sem login.
2. Crie uma conta descartável e confirme os três itens obrigatórios.
3. Abra **Configurações > Privacidade e dados pessoais**.
4. Confirme que Termos, Aviso e Dados de Saúde aparecem como atuais.
5. Revogue e aceite novamente o consentimento de saúde.
6. Salve as preferências opcionais e atualize a página.
7. Baixe a exportação e confira `schema_version: "3.0"` e o bloco `privacy`.
8. Registre uma solicitação e confira seu estado como “Recebida”.
9. Entre com outra conta e confirme que ela não vê escolhas ou solicitações da primeira.
10. Confira os avisos de privacidade em Dieta e Treino.

## 5. Antes do lançamento comercial

- Contrate revisão jurídica dos três documentos.
- Defina formalmente o controlador e o encarregado ou canal aplicável.
- Inventarie fornecedores, operadores e transferências internacionais.
- Defina bases legais e prazos de retenção com documentos internos.
- Crie procedimento para solicitações do titular e incidentes de segurança.
- Teste exportação e exclusão com conta descartável no Supabase real.
- Decida como recursos de saúde serão limitados após revogação do consentimento.
- Mantenha registro de incidentes sujeito ao prazo regulatório aplicável.

## Observação

Esta entrega cria controles técnicos e transparência. Ela não é parecer jurídico nem certificação automática de conformidade com a LGPD.
