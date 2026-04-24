# Edge Functions — Ervatório

Operações que **não devem** rodar no navegador (usam `service_role`, agregam dados privilegiados ou precisam validar integridade do preço).

## Funções

| Nome | Método | Papel |
|---|---|---|
| `admin-delete-user` | POST | Deleta usuário de `auth.users` e cascatas. Corrige bug onde o painel antigo só removia o perfil. Requer admin. |
| `admin-metrics` | GET | Retorna contadores + receita agregada em uma chamada. Requer admin. |
| `create-order` | POST | Cria um pedido com preços recalculados no servidor (nunca confiar no cliente). Requer usuário autenticado. |

## Deploy

Pré-requisito: [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e logado.

```bash
# Link do projeto (uma única vez)
supabase link --project-ref lwzrzztzpklzbmxbqcrx

# Deploy individual
supabase functions deploy admin-delete-user
supabase functions deploy admin-metrics
supabase functions deploy create-order

# Ou tudo de uma vez
supabase functions deploy
```

Variáveis de ambiente obrigatórias no projeto Supabase (Settings → Edge Functions → Secrets):

- `SUPABASE_URL` — URL do projeto (já existe por padrão)
- `SUPABASE_SERVICE_ROLE_KEY` — chave secreta; **nunca comite** e **nunca envie ao cliente**

## Chamando do frontend

```js
const { data: { session } } = await ervaria.client.auth.getSession();
const res = await fetch(
  `${window.ERVATORIO_CONFIG.FUNCTIONS_URL}/admin-delete-user`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId: '<uuid>' }),
  }
);
const result = await res.json();
```

## Teste local

```bash
supabase functions serve admin-metrics --env-file .env.local
# .env.local contém SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
```
