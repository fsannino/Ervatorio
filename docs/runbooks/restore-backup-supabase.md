# Runbook — Restore de backup do Supabase (PITR / daily backup)

**Quando usar:** perda ou corrupção de dados (migration destrutiva, DELETE errado, incidente de segurança que alterou dados).

**Tempo estimado:** 15–60 minutos, conforme tamanho do banco.

## Antes de tudo

1. **Pare a sangria**: se uma migration/rotina está corrompendo dados, desative-a primeiro (pause a Edge Function, feche o painel admin, ou coloque o site em manutenção via `PAYMENTS_ENABLED=false` / aviso).
2. **Anote o timestamp do último estado bom** (UTC). PITR restaura para um ponto no tempo; quanto mais preciso, menos perda.

## Opção A — Point-in-Time Recovery (PITR, se habilitado)

1. Painel Supabase → projeto → **Database → Backups → Point in Time**.
2. Escolha data/hora do último estado bom.
3. Confirme. O restore é **in-place**: o banco inteiro volta ao ponto escolhido; transações posteriores são perdidas.
4. Depois do restore, reaplique migrations legítimas que vieram depois do ponto (em ordem, de `supabase/migrations/`).

## Opção B — Daily backup (plano sem PITR)

1. Painel Supabase → **Database → Backups**: selecione o backup diário mais recente anterior ao incidente e **Restore**.
2. Alternativa via dump lógico (se você tem dumps próprios):
   ```bash
   supabase db dump --db-url "$STAGING_DB_URL" -f backup.sql   # gerar
   psql "$PROD_DB_URL" -f backup.sql                            # restaurar (cuidado!)
   ```

## Restore parcial (uma tabela só)

Prefira restaurar o backup em um **Supabase branch/staging** e copiar de lá apenas as linhas afetadas (`pg_dump -t tabela` + `INSERT ... ON CONFLICT`), em vez de rebobinar produção inteira.

## Depois do restore

1. Rode a auditoria de RLS (`docs/security/rls-audit.md`) — restores recriam objetos e podem regredir policies aplicadas fora de migration.
2. Verifique login, pedidos e painel admin.
3. Comunique impacto (pedidos/cadastros perdidos no intervalo) e registre o incidente.

## Teste trimestral

A cada trimestre, restaure o backup mais recente em um branch de staging e valide (`SELECT count(*)` nas tabelas principais + login de teste). Backup que nunca foi restaurado não é backup.
