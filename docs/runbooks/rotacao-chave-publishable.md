# Runbook — Rotação de chaves (publishable e service_role)

**Quando usar:** suspeita de abuso da chave publishable (ela é pública por design, mas pode ser rotacionada para invalidar integrações antigas), vazamento de `service_role`, saída de pessoa com acesso, ou rotação periódica.

## Chave publishable (`sb_publishable_...` / anon)

A chave publishable é **pública por design** — a segurança vem do RLS, não do sigilo da chave. Rotacione se quiser invalidar clientes antigos ou após incidente.

1. Painel Supabase → **Settings → API Keys** → gere nova publishable key.
2. Atualize o front: a chave vive em `js/config.js` (constante do cliente Supabase). Abra PR com a nova chave.
3. Deploy no Vercel; valide login e loja no preview antes de promover.
4. Revogue a chave antiga no painel (após o deploy estar em produção).
5. Publique também em qualquer outro consumidor (app, scripts).

## Chave service_role (CRÍTICO — nunca deve estar no cliente)

Se houver **qualquer suspeita** de que a `service_role` vazou (commit acidental, log, pessoa desligada):

1. **Rotacione imediatamente**: Painel Supabase → Settings → API Keys → *Rotate* na service_role. Isso invalida a antiga na hora.
2. Atualize os secrets das Edge Functions:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<nova>   # se usada explicitamente
   ```
   (As functions usam a env padrão do projeto; o painel atualiza automaticamente — confirme em **Edge Functions → Secrets**.)
3. Atualize qualquer CI/integração externa que use a chave.
4. Verifique logs (`Database → Logs`, `Edge Functions → Logs`) por uso anômalo da chave antiga antes da rotação: escrituras fora de horário, IPs estranhos, alterações em `is_admin`.
5. Se houve uso malicioso confirmado, acione o runbook de incidente de vazamento de dados.

## Outros segredos rotacionáveis

| Segredo | Onde vive | Como rotacionar |
|---|---|---|
| `MP_ACCESS_TOKEN_*` | Supabase Secrets | Painel Mercado Pago → Credenciais → renovar; `supabase secrets set` |
| `MP_WEBHOOK_SECRET` | Supabase Secrets | Painel MP → Webhooks → regenerar secret; `supabase secrets set` |
| `RESEND_API_KEY` (e-mail) | Supabase Secrets | Painel Resend → API Keys |

Registre cada rotação (data, motivo, quem executou) em `docs/security/`.
