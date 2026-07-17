# Decisão estratégica: marketplace multi-seller vs. loja curada

**Onda 13 · backlog #100 — documento de decisão, não implementação.**

Status: **aberto** — a decisão exige dados reais de operação (Ondas 3–8 rodando). Este documento fixa o framework, os critérios e os dois desenhos técnicos para a decisão ser rápida quando os dados existirem. Dono da decisão: fundador.

## O diagnóstico (auditoria 16/07/2026)

Hoje o Ervatório é uma **loja única com diretório de fornecedores**: o campo `seller` dos produtos é um rótulo textual, não um lojista. Não há dashboard de vendedor, comissão, split de pagamento, onboarding nem catálogo/estoque por vendedor. "Marketplace" no posicionamento cria uma expectativa que a arquitetura não cumpre.

## Critérios de decisão (preencher com dados reais)

| Critério | Fonte | Limiar sugerido p/ marketplace | Valor real (preencher) |
|---|---|---|---|
| GMV mensal | `orders` pagos | > R$ 50k/mês sustentado por 3 meses | — |
| Fornecedores ativos pedindo autonomia | conversas comerciais | ≥ 5 com catálogo próprio e operação de envio | — |
| Margem média da loja curada | `orders` × custo | Se margem própria < comissão viável (10–20%), marketplace ganha apelo | — |
| Carga operacional de fulfillment | horas/semana do time | Gargalo logístico crônico favorece repassar envio ao seller | — |
| Conversão e AOV | GA4/KPIs (Onda 3) | Funil saudável primeiro; marketplace multiplica SKUs, não conversão | — |

**Regra de bolso:** marketplace resolve problema de **oferta** (catálogo/estoque limitados). Se o gargalo atual é **demanda** (tráfego/conversão — como a auditoria indica), virar marketplace antecipa custo e complexidade sem atacar o problema.

## Opção A — Loja curada premium (default recomendado hoje)

- **Posicionamento:** remover "marketplace" da comunicação; assumir "curadoria botânica" (já é a força da marca). `seller` vira "produtor/origem" — storytelling, não entidade.
- **Custo técnico:** ~zero (é o que existe). Toda a energia vai para conversão/retenção (Ondas 7–10).
- **Risco:** teto de catálogo limitado pela operação própria; mitigável com dropshipping curado caso a caso.

## Opção B — Marketplace multi-seller (se os limiares baterem)

Mudanças mínimas necessárias, em ordem:

1. **Identidade de seller:** tabela `sellers` (razão social, CNPJ, contato, conta MP) + `admin_products.seller_id` (FK, substituindo o rótulo textual); RLS por seller (cada lojista só edita o próprio catálogo — mesmo padrão is_admin/WITH CHECK das Ondas 1).
2. **Split de pagamento:** migrar de Checkout Pro simples para **Mercado Pago Marketplace** (OAuth por seller + `marketplace_fee` na preferência). O recálculo de preço no servidor permanece.
3. **Dashboard do seller:** subconjunto do admin atual (produtos próprios, pedidos próprios, estoque) — o painel admin vira back-office da plataforma.
4. **Split de pedido:** um carrinho com N sellers = N sub-pedidos/fretes (impacto em `orders`, frete e NF-e — cada seller emite a sua).
5. **Comissão e repasse:** definição comercial (% por categoria) + conciliação.

**Esforço estimado:** 6–10 semanas de desenvolvimento focado + operação de onboarding. **Riscos:** complexidade fiscal (NF-e por seller), qualidade/curadoria diluída (contradiz a marca), suporte multi-parte.

## Caminho faseado (se B)

1. Fase 0: 1 seller piloto convidado, split manual (transferência), sem dashboard — validar demanda real.
2. Fase 1: MP Marketplace + dashboard mínimo para 3–5 sellers.
3. Fase 2: onboarding self-service, comissão automatizada, SLA.

## Recomendação atual

**Opção A** até os limiares da tabela baterem. Ação imediata independente da decisão: ajustar a palavra "marketplace" nas comunicações públicas para não gerar expectativa falsa (auditoria, Etapa 11).

## Revisão

Reavaliar quando: (a) 3 meses de dados de vendas pós-ativação de pagamentos, ou (b) ≥5 fornecedores pedindo autonomia — o que vier primeiro.
