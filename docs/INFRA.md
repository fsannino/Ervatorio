# Infraestrutura — Ervatório

Arquitetura operacional alvo (Onda 0 do plano de execução). Referência: `docs/plano-execucao-prompts.html` e auditoria em `docs/auditoria-ervatorio.html`.

## Stack

- **Front**: HTML/CSS/JS estático (sem build, por ora) servido pelo **Vercel**.
- **Backend**: **Supabase** (Postgres + Auth + Edge Functions Deno/TS + Storage). Projeto: `ejarqinmjlgbqzurctsf`.
- **Pagamentos**: Mercado Pago Checkout Pro (redirect) + webhook `mp-webhook`.
- **E-mail transacional**: Resend (via Edge Function).

## Ambientes

| Ambiente | Front | Banco / Functions | Uso |
|---|---|---|---|
| **dev** | local (`npx serve` ou similar) | Supabase branch de dev ou staging | desenvolvimento diário |
| **staging** | Vercel Preview (todo PR gera um) | **Supabase branch de staging** | validar migrations e features antes do merge |
| **produção** | Vercel Production (branch `main`) | projeto Supabase principal | usuários reais |

### Regras

1. **Nenhuma migration é aplicada direto em produção.** Fluxo: migration em `supabase/migrations/` → aplicar no branch de staging → testar (inclusive o abuso que a migration previne) → merge do PR → aplicar em produção.
2. **Todo PR** gera Vercel Preview; o preview é validado manualmente antes do merge (checklist do PR template).
3. Segredos por ambiente: Vercel Environment Variables (front/edge) e Supabase Secrets (functions). Nunca no repositório.

## Supabase Branching (staging de banco)

```bash
supabase login
supabase link --project-ref ejarqinmjlgbqzurctsf
supabase branches create staging          # cria branch gerenciado
supabase branches list                    # obter ref/connection string do branch
supabase db push --db-url <staging-url>  # aplica migrations pendentes no staging
```

Sem plano com Branching, alternativa: segundo projeto Supabase gratuito como staging, mantido em sincronia aplicando as mesmas migrations em ordem.

Teste de migration de segurança no staging (exemplo C-1):

```sql
-- como usuário comum autenticado (via supabase-js com a publishable key):
update user_profiles set is_admin = true where id = auth.uid();  -- deve FALHAR
update user_profiles set display_name = 'x' where id = auth.uid(); -- deve passar
```

## Cópia do conteúdo editorial

As fichas de erva, produtos, blends e vetores **não são criados por migration** — vieram de carga direta no banco. Sem cópia versionada, perder o projeto Supabase significa perder o catálogo inteiro, sem como reconstruir. Já aconteceu uma vez com o projeto anterior.

`scripts/dump-content.mjs` fecha a lacuna:

```bash
node scripts/dump-content.mjs      # gera supabase/seed.sql
git add supabase/seed.sql && git commit -m "chore(seed): atualiza conteúdo"
```

O arquivo gerado serve a dois propósitos: cópia do catálogo no Git, revisável em diff, e semente automática de branches — o CLI roda `seed.sql` depois das migrations, então um staging nasce com o conteúdo completo em vez de tabelas vazias.

Detalhes:

- **Sem dado pessoal.** A allowlist do script cobre só conteúdo editorial; `user_profiles`, `orders`, `newsletter_subscribers` e `product_reviews` ficam de fora por construção.
- **`chazerias` e `admin_suppliers` não entram** — já vivem em migrations versionadas, e incluí-las duplicaria as linhas num banco novo.
- **Inserção via `jsonb_populate_recordset`**, para o Postgres converter os tipos a partir da definição da própria tabela. Round-trip verificado como idêntico nas 203 linhas de conteúdo, incluindo a coluna `jsonb` de 414 kB e os arrays `text[]`.
- **Leitura com a chave publicável** enxerga só o que as policies de leitura pública liberam. Hoje é 100% das linhas; o script avisa se algo ficar de fora. Para incluir rascunhos, defina `SUPABASE_SECRET_KEY` no ambiente antes de rodar.

Rode de novo sempre que houver carga grande de conteúdo pelo painel.

## CI/CD

- **GitHub Actions** (`.github/workflows/ci.yml`): varredura de segredos (gitleaks, bloqueante), validação de JSON/arquivos essenciais (bloqueante), lint HTML/JS (informativo, por ora), `deno check` das Edge Functions.
- **Vercel**: deploy automático — Preview em PRs, Production no push à `main`.
- Deploy de Edge Functions: `supabase functions deploy <nome>` (manual por ora; automatizar em onda futura).

## Política de deploy

1. PR pequeno, com template preenchido (objetivo, teste, impacto em segurança/dados, rollback).
2. Merge somente com CI verde + preview validado + review.
3. Mudança de risco atrás de feature flag (ex.: `PAYMENTS_ENABLED`).
4. Rollback: ver `docs/runbooks/rollback-deploy-vercel.md`.

## Checklist manual (painéis — não automatizável via código)

Estas configurações precisam ser habilitadas manualmente, uma vez, pelo dono do projeto:

- [ ] **GitHub → Settings → Branches → Branch protection em `main`**: exigir PR, 1 aprovação, status checks (`secret-scan`, `build-check`, `edge-functions`) verdes, proibir force-push.
- [ ] **Supabase → Database → Backups**: confirmar backup diário ativo; habilitar **PITR** se o plano permitir.
- [ ] **Supabase → Branching**: criar branch `staging` (ou segundo projeto como staging).
- [ ] **Vercel → Project → Git**: confirmar Production Branch = `main` e previews por PR habilitados.
- [ ] **Supabase → Auth**: revisar redirect URLs permitidas (produção + previews).
- [ ] Agendar teste trimestral de restore (runbook `restore-backup-supabase.md`).

## Observabilidade (alvo — Onda 12)

- Sentry (front + Edge Functions), uptime check (Better Uptime/UptimeRobot), alertas de erro de function. Por ora: Supabase Logs + Vercel Logs.
