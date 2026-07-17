## Objetivo

<!-- O que este PR resolve e por quê. Referencie o item do backlog/onda (ex.: Onda 1.1 / backlog #1). -->

## O que muda

<!-- Lista objetiva de mudanças (código, migrations, config). -->

## Como testar

<!-- Passo a passo reproduzível: URLs de preview, comandos, contas de teste, SQL de verificação. -->

## Impacto em segurança/dados

<!-- Toca RLS/policies/grants? Migration destrutiva? Novo dado pessoal coletado? Segredo novo? Se sim, descreva e confirme teste em staging. Se não, escreva "nenhum". -->

## Plano de rollback

<!-- Como desfazer: revert do PR? feature flag? migration reversa? Descreva o caminho concreto. -->

## Checklist

- [ ] CI verde (secret-scan, build-check, edge-functions)
- [ ] Preview Vercel validado manualmente
- [ ] Migration testada em staging (se houver migration)
- [ ] Critérios de aceite do prompt/onda atendidos
- [ ] Não quebra checkout, login nem webhook de pagamento
