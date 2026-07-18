# Apex v0.9.1 — conexão com Supabase

O projeto já contém um arquivo `.env.local` com a URL e a Publishable Key do projeto Supabase.

## Próximo passo obrigatório

No painel do Supabase:

1. Abra **SQL Editor**.
2. Crie uma nova consulta.
3. Cole todo o conteúdo de:

```text
supabase/migrations/20260717000000_initial_auth_and_user_data.sql
```

4. Clique em **Run** uma única vez.

Depois, configure em **Authentication > URL Configuration**:

```text
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/**
```

Quando o domínio de produção existir, adicione-o também às URLs permitidas.

A Publishable Key é pública por definição. Nunca adicione Secret Key, `service_role` ou senha do banco ao código.
