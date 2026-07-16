# Runbook — Rollback de deploy (Vercel)

**Quando usar:** um deploy em produção quebrou o site (erro visível, checkout inoperante, tela branca, regressão grave).

**Tempo estimado:** < 5 minutos.

## Passo a passo

1. **Confirme o incidente**: abra `https://ervatorio.com.br` em aba anônima. Verifique o console do navegador e o painel Vercel → *Deployments* → deployment atual → *Runtime Logs*.
2. **Identifique o último deployment bom**: no painel Vercel, aba *Deployments*, localize o deployment anterior com status *Ready* que estava em produção antes da regressão (confira o commit associado).
3. **Rollback instantâneo (UI)**: no deployment bom, menu `⋯` → **Promote to Production** (ou **Instant Rollback** no deployment atual, se disponível no plano). Isso troca o alias de produção sem rebuild.
4. **Rollback via CLI (alternativa)**:
   ```bash
   vercel ls ervatorio                # lista deployments
   vercel rollback <deployment-url>   # ou: vercel promote <deployment-url>
   ```
5. **Verifique**: recarregue o site (aba anônima), confirme que a regressão sumiu. Teste login e abertura da loja.
6. **Corrija na origem**: reverta o PR causador na `main` (`git revert -m 1 <merge-commit>`) e abra PR do revert, para que o próximo deploy não reintroduza o problema.
7. **Registre**: anote no PR/issue o que quebrou, horário do rollback e causa raiz.

## Atenção

- Rollback do Vercel **não** desfaz migrations do Supabase. Se o deploy veio acompanhado de migration, avalie também o runbook de restore/rollback de banco.
- Se o problema é só de conteúdo de Edge Function do Supabase (não do front), faça redeploy da versão anterior da function: `supabase functions deploy <nome>` a partir do commit bom.
