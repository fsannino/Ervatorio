# KPIs — Ervatório (Onda 3.3)

Definições operacionais dos indicadores. Fonte primária: GA4 (eventos de e-commerce, Onda 3.2) + tabela `orders` (verdade financeira). Configurar o funil no GA4 ou Looker Studio quando as contas forem criadas.

## Estrela-norte

**Pedidos pagos por semana** (`orders.status = 'paid'`, agrupado por semana). É o indicador que resume se a máquina comercial inteira funciona.

## KPIs primários

| KPI | Definição | Fonte | Meta inicial |
|---|---|---|---|
| **Taxa de conversão** | `purchase / sessões` | GA4 | estabelecer baseline no 1º mês |
| **Ticket médio (AOV)** | `média de total_cents dos pedidos pagos` | `orders` | baseline |
| **Taxa de abandono de checkout** | `1 − (purchase / begin_checkout)` | GA4 | < 80% após guest checkout (Onda 6) |
| **CAC** | `investimento em mídia / novos clientes pagantes` | Ads + `orders` | — (sem mídia até funil medir) |
| **LTV** | `receita média acumulada por cliente em 12m` | `orders` | — (chá é recorrente: acompanhar recompra) |
| **Receita** | `soma de total_cents pagos` | `orders` | — |

## Funil de e-commerce (eventos GA4 — já instrumentados)

1. `view_item` — abertura do detalhe de produto (`openMktDetail`)
2. `add_to_cart` — adição ao carrinho (`addMktCart`)
3. `begin_checkout` — abertura do checkout (`checkout.open`)
4. `purchase` — retorno `?checkout=success` (aproximação client-side; a verdade é `orders.status='paid'` via webhook — reconciliar mensalmente)

## KPIs secundários

- Sessões com busca / taxa de busca sem resultado (após Onda 11)
- % de sessões com consentimento de analytics aceito (viés de medição — reportar junto com qualquer número de conversão)
- Recompra em 90 dias (após Onda 8/10)
- Core Web Vitals (LCP/INP/CLS — CrUX/PageSpeed, baseline antes da Onda 4 e comparação depois)

## Pendências para ativar

1. Criar contas: GTM (preferido), GA4, Clarity, Meta Pixel → preencher `ERVATORIO_CONFIG.ANALYTICS` em `js/config.js`.
2. Validar no GA4 DebugView que os 4 eventos chegam (com consentimento aceito) e que nada dispara sem consentimento.
3. Montar o funil no GA4 (Explorações) ou Looker Studio e linkar aqui.
4. CAPI server-side do Meta (evento purchase deduplic. por `eventID`) — prevista na Onda 3.2, implementar junto com a virada de pagamentos (Onda 6) quando houver purchase real a enviar.
