#!/usr/bin/env node
// ============================================================
// Teste de checkout em sandbox — Ervatório
// ============================================================
//   node scripts/test-checkout-sandbox.mjs
//
// Exercita a cadeia de compra do lado servidor sem tocar em
// nada de produção:
//
//   create-order  →  create-payment-preference  →  init_point
//
// e, quando você pagar com cartão de teste, o Mercado Pago chama
// mp-webhook e o pedido muda de status. Aí a verificação final é
// no banco.
//
// ── Por que isso NÃO expõe o checkout aos visitantes ──
// O botão de compra é controlado por site_settings.payments_enabled,
// que é uma trava de INTERFACE: js/checkout.js:134 e js/app.js:1296
// a consultam antes de abrir o overlay. As Edge Functions não olham
// para ela — verificado: nenhuma referência a payments_enabled ou
// site_settings em supabase/functions/.
//
// Ou seja, dá para testar a cadeia inteira por HTTP com a flag
// desligada. Nenhum visitante vê botão de comprar enquanto isto
// roda. Só ligue payments_enabled quando o teste passar e você
// quiser vender de verdade.
//
// ── Pré-requisitos ──
//   • Secrets configurados (supabase secrets list → 13 variáveis)
//   • MP_MODE=test e MP_ACCESS_TOKEN_TEST preenchido
//   • ALLOWED_ORIGIN não afeta este script (CORS é regra de
//     navegador; curl e Node não são barrados)
// ============================================================

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadConfig() {
  const src = readFileSync(resolve(ROOT, 'js/config.js'), 'utf8');
  const pick = (k) => src.match(new RegExp(`${k}:\\s*'([^']+)'`))?.[1];
  const url = pick('SUPABASE_URL');
  const key = pick('SUPABASE_PUBLISHABLE_KEY');
  const fns = pick('FUNCTIONS_URL');
  if (!url || !key || !fns) throw new Error('Não consegui ler js/config.js');
  return { url, key, fns };
}

const { url, key, fns } = loadConfig();
const H = { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` };

// E-mail de convidado dedicado ao teste, para dar pra achar e apagar depois.
const GUEST = 'teste-checkout@exemplo.invalid';

// Os nomes dos campos são os que o servidor exige em
// create-order/index.ts:94 — name, zip, street, city, state — e os
// mesmos que Checkout.collectAddress() monta em js/checkout.js:326.
// Usar equivalentes em português aqui faz o servidor responder
// "Endereço de entrega incompleto", que foi como este script errou
// na primeira versão.
const ENDERECO = {
  name: 'Teste Sandbox',
  phone: '11999999999',
  zip: '01310-100',
  street: 'Av. Paulista',
  number: '1000',
  complement: '',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  country: 'Brasil',
};

const brl = (c) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
let falhas = 0;

function check(nome, condicao, detalhe) {
  const marca = condicao ? '  OK  ' : ' FALHA';
  console.log(`${marca}  ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!condicao) falhas++;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Quando a chamada não volta 200, o motivo do servidor vale mais do
// que o valor calculado. Sem isso, um payload malformado aparecia
// como "servidor cobrou R$ 0,00" — que lê como falha de preço e
// manda investigar o lugar errado.
function porque(res) {
  if (res.limitado) return 'INCONCLUSIVO — rate limit, não é falha do servidor';
  if (res.status !== 200) return `INCONCLUSIVO — HTTP ${res.status}: ${res.json?.error || 'sem detalhe'}`;
  return null;
}

// create-order limita a 10 chamadas/minuto por IP para convidado
// (create-order/index.ts:86), e a checagem roda ANTES da validação —
// então até chamada recusada com 400 consome cota. Este script faz 7
// chamadas, o que cabe no minuto, desde que espaçadas. Sem a pausa,
// as 7 saem no mesmo segundo e as últimas voltam 429 — que na
// primeira versão eu lia como "preço errado", um falso negativo feio.
const INTERVALO_MS = 7000;
let ultimaChamada = 0;

async function post(fn, body, { tentarDeNovo = true } = {}) {
  const desde = Date.now() - ultimaChamada;
  if (ultimaChamada && desde < INTERVALO_MS) await sleep(INTERVALO_MS - desde);
  ultimaChamada = Date.now();

  const res = await fetch(`${fns}/${fn}`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  let json;
  try { json = await res.json(); } catch { json = { error: await res.text() }; }

  // Cota estourada por execução anterior: espera a janela virar e
  // repete uma vez, em vez de reportar falha que não é do servidor.
  if (res.status === 429 && tentarDeNovo) {
    console.log('        (cota de 10/min atingida — aguardando 60s para a janela virar)');
    await sleep(60_000);
    ultimaChamada = 0;
    return post(fn, body, { tentarDeNovo: false });
  }
  return { status: res.status, json, limitado: res.status === 429 };
}

// ── 0. Escolhe um produto real e ativo ──────────────────────
const prodRes = await fetch(
  `${url}/rest/v1/admin_products?select=id,name,price,unit,stock&active=eq.true&limit=1`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
const [produto] = await prodRes.json();
if (!produto) {
  console.error('Nenhum produto ativo encontrado. Abortando.');
  process.exit(1);
}

console.log('='.repeat(64));
console.log('TESTE DE CHECKOUT EM SANDBOX');
console.log('='.repeat(64));
console.log(`Projeto:  ${url}`);
console.log(`Produto:  ${produto.name} — R$ ${produto.price} / ${produto.unit}`);
console.log(`Convidado: ${GUEST}`);
console.log(`\nAs chamadas saem a cada ${INTERVALO_MS / 1000}s para respeitar o limite de`);
console.log('10 pedidos/minuto por IP. A execução leva cerca de 1 minuto.\n');

// ── 1. Testes negativos: o servidor tem que recusar abuso ────
console.log('1. VALIDAÇÃO DO SERVIDOR\n');

const bogus = await post('create-order', {
  items: [{ product_id: '00000000-0000-4000-8000-000000000000', qty: 1 }],
  shipping_address: ENDERECO,
  guest_email: GUEST,
});
check('produto inexistente é recusado', bogus.status === 400, `HTTP ${bogus.status}`);

const malformado = await post('create-order', {
  items: [{ product_id: 'nao-e-uuid', qty: 1 }],
  shipping_address: ENDERECO,
  guest_email: GUEST,
});
check('id malformado é recusado', malformado.status === 400, `HTTP ${malformado.status}`);

const semEmail = await post('create-order', {
  items: [{ product_id: produto.id, qty: 1 }],
  shipping_address: ENDERECO,
});
check('convidado sem e-mail é recusado', semEmail.status >= 400, `HTTP ${semEmail.status}`);

// O cliente nunca manda preço — mando de propósito, para confirmar
// que o servidor ignora e usa o valor do banco.
const precoDoBanco = Math.round(Number(produto.price) * 100);
const tentaFraude = await post('create-order', {
  items: [{ product_id: produto.id, qty: 2, price: 0.01, unit_price_cents: 1 }],
  shipping_address: ENDERECO,
  guest_email: GUEST,
});
const esperado = precoDoBanco * 2;
check(
  'preço vem do banco, não do cliente',
  tentaFraude.status === 200 && tentaFraude.json.subtotal_cents === esperado,
  porque(tentaFraude)
    ?? `enviei R$ 0,01 · servidor cobrou ${brl(tentaFraude.json.subtotal_cents ?? 0)} (esperado ${brl(esperado)})`,
);

const qtdAbsurda = await post('create-order', {
  items: [{ product_id: produto.id, qty: 99999 }],
  shipping_address: ENDERECO,
  guest_email: GUEST,
});
check(
  'quantidade é limitada a 999',
  qtdAbsurda.status === 200 && qtdAbsurda.json.subtotal_cents === precoDoBanco * 999,
  porque(qtdAbsurda)
    ?? `pedi 99999 · servidor cobrou ${qtdAbsurda.json.subtotal_cents / precoDoBanco} unidades`,
);

const qtdNegativa = await post('create-order', {
  items: [{ product_id: produto.id, qty: -5 }],
  shipping_address: ENDERECO,
  guest_email: GUEST,
});
check(
  'quantidade negativa vira 1',
  qtdNegativa.status === 200 && qtdNegativa.json.subtotal_cents === precoDoBanco,
  porque(qtdNegativa)
    ?? `pedi -5 · servidor cobrou ${brl(qtdNegativa.json.subtotal_cents ?? 0)}`,
);

// ── 2. Pedido de verdade ────────────────────────────────────
console.log('\n2. PEDIDO VÁLIDO\n');

const pedido = await post('create-order', {
  items: [{ product_id: produto.id, qty: 1 }],
  shipping_address: ENDERECO,
  notes: 'Pedido de teste — sandbox',
  guest_email: GUEST,
});
check('create-order responde 200', pedido.status === 200, pedido.json.error || '');
if (pedido.status !== 200) {
  console.error('\nAbortando: sem pedido não dá para seguir.');
  process.exit(1);
}
console.log(`         order_id: ${pedido.json.order_id}`);
console.log(`         subtotal: ${brl(pedido.json.subtotal_cents)}`);
console.log(`         frete:    ${brl(pedido.json.shipping_cents)}`);
console.log(`         total:    ${brl(pedido.json.total_cents)}`);

// ── 3. Preferência de pagamento ─────────────────────────────
console.log('\n3. PREFERÊNCIA NO MERCADO PAGO\n');

const pref = await post('create-payment-preference', {
  order_id: pedido.json.order_id,
  guest_email: GUEST,
});
check('create-payment-preference responde 200', pref.status === 200, pref.json.error || '');

if (pref.status !== 200) {
  console.error('\nSe o erro citar MP_ACCESS_TOKEN, o secret não está configurado ou está errado.');
  process.exit(1);
}

const link = pref.json.init_point || pref.json.sandbox_init_point;
check('veio um link de pagamento', Boolean(link));

// ── Resultado ───────────────────────────────────────────────
console.log('\n' + '='.repeat(64));
if (falhas > 0) {
  console.log(`${falhas} verificação(ões) falharam. Não siga para o pagamento.`);
  process.exitCode = 1;
} else {
  console.log('Todas as verificações de servidor passaram.\n');
  console.log('AGORA, NO NAVEGADOR:\n');
  console.log(link + '\n');
  console.log('Pague com um cartão de teste do Mercado Pago. No painel, em');
  console.log('Suas integrações > sua aplicação > Contas de teste, há a lista');
  console.log('oficial e atualizada — use a de lá, não uma decorada.\n');
  console.log('O nome do titular controla o resultado:');
  console.log('  APRO = aprovado · OTHE = recusado · CONT = pendente\n');
  console.log(`Depois de pagar, me mande este order_id: ${pedido.json.order_id}`);
  console.log('que eu confiro no banco se o webhook chegou e mudou o status.');
}
console.log('='.repeat(64));
console.log(`\nLimpeza depois do teste (rode como service_role):`);
console.log(`  delete from public.order_items where order_id in`);
console.log(`    (select id from public.orders where guest_email = '${GUEST}');`);
console.log(`  delete from public.orders where guest_email = '${GUEST}';`);
