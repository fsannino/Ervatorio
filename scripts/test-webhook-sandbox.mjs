#!/usr/bin/env node
// ============================================================
// Teste do webhook de pagamento — Ervatório (sandbox)
// ============================================================
//   node scripts/test-webhook-sandbox.mjs           (pagamento aprovado)
//   node scripts/test-webhook-sandbox.mjs OTHE      (pagamento recusado)
//
// ── Por que este script existe ──
// test-checkout-sandbox.mjs prova a cadeia até o link de pagamento:
//
//   create-order → create-payment-preference → init_point
//
// O que ele NÃO prova é o elo seguinte, que é o que fecha a venda:
//
//   Mercado Pago → mp-webhook → orders.status muda de pending
//
// Esse elo nunca foi exercitado. Nenhum pedido saiu de `pending` na
// vida deste projeto. Isso significa que estas coisas são hipóteses,
// não fatos verificados:
//
//   • o MP consegue alcançar a URL do webhook
//   • mapPaymentStatus() casa com os status reais que o MP manda
//   • a sanity de valor (mp-webhook/index.ts:139) não rejeita um
//     pagamento legítimo por arredondamento
//   • o e-mail de confirmação dispara
//   • release_stock() é chamado quando o pagamento é recusado
//
// ── Por que pagar pela API e não pelo Checkout Pro no navegador ──
// O Checkout Pro é a via do usuário real, e a tentativa pelo
// navegador travou em `/fatal/` — mistura de conta real com
// preferência de teste. A API de pagamentos contorna isso: o
// cartão de teste é tokenizado direto, sem login em conta nenhuma.
// É um caminho diferente do que o cliente percorre, mas chega no
// MESMO lugar onde a dúvida está — o webhook. E o webhook não sabe
// nem se importa com como o pagamento nasceu: ele recebe um
// payment_id, busca na API e age (mp-webhook/index.ts:105).
//
// ── external_reference é a peça central ──
// mp-webhook encontra o pedido por `payment.external_reference`
// (index.ts:116). Se ele vier vazio, a função responde 200 com um
// warning e NÃO atualiza nada. Então este script põe o order_id ali
// explicitamente, exatamente como create-payment-preference faz.
//
// ── Pré-requisitos ──
//   • .env.secrets com MP_MODE=test e MP_ACCESS_TOKEN_TEST=TEST-...
//   • MP_WEBHOOK_STRICT=false (padrão) — em modo estrito o webhook
//     recusa assinatura inválida com 401. Ver WEBHOOK_SIGNATURE_DEBT.md.
//   • payments_enabled pode continuar DESLIGADO: ele é trava de
//     interface (js/checkout.js:134), e as Edge Functions não o leem.
//     Nenhum visitante vê botão de comprar enquanto isto roda.
//
// Nunca imprime o token: só prefixo e tamanho.
// ============================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── Cartão de teste do Mercado Pago ──────────────────────────
// Em ambiente de teste, o NOME DO TITULAR decide o resultado:
//   APRO = aprovado · OTHE = recusado por erro geral · CONT = pendente
// O número abaixo é o Mastercard de teste público do MP, o mesmo que
// está na documentação. Não é cartão de ninguém.
const CARTAO = {
  card_number: '5031433215406351',
  expiration_month: 11,
  expiration_year: 2030,
  security_code: '123',
  payment_method_id: 'master',
};

// CPF de teste do MP (dígito verificador válido, titular fictício).
const CPF_TESTE = '12345678909';

const RESULTADO = (process.argv[2] || 'APRO').toUpperCase();
if (!['APRO', 'OTHE', 'CONT'].includes(RESULTADO)) {
  console.error(`Resultado "${RESULTADO}" não existe. Use APRO, OTHE ou CONT.`);
  process.exit(1);
}

// Guest dedicado, com o resultado no nome — dá para achar e apagar
// depois sem tocar em pedido de gente real.
const GUEST = `teste-webhook-${RESULTADO.toLowerCase()}@exemplo.invalid`;

const ENDERECO = {
  name: `Teste Webhook ${RESULTADO}`,
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

// ── Configuração ─────────────────────────────────────────────
function lerEnvSecrets() {
  const p = resolve(ROOT, '.env.secrets');
  if (!existsSync(p)) {
    console.error('Não achei .env.secrets nesta pasta.');
    console.error('Ele fica só na sua máquina. Se sumiu:  copy .env.example .env.secrets');
    process.exit(1);
  }
  const env = {};
  for (const linha of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function lerConfigJs() {
  const src = readFileSync(resolve(ROOT, 'js/config.js'), 'utf8');
  const pick = (k) => src.match(new RegExp(`${k}:\\s*'([^']+)'`))?.[1];
  const url = pick('SUPABASE_URL');
  const key = pick('SUPABASE_PUBLISHABLE_KEY');
  const fns = pick('FUNCTIONS_URL');
  if (!url || !key || !fns) throw new Error('Não consegui ler js/config.js');
  return { url, key, fns };
}

const env = lerEnvSecrets();
const { url: SUPA_URL, key: PUB_KEY, fns: FNS } = lerConfigJs();

const modo = (env.MP_MODE || 'test').toLowerCase();
const token = env.MP_ACCESS_TOKEN_TEST;
const publicKeyTeste = env.MP_PUBLIC_KEY_TEST || '';
const notificationUrl = env.MP_NOTIFICATION_URL || '';
const payerEmail = env.MP_TEST_PAYER_EMAIL || 'test_user_ervatorio@testuser.com';

const MP = 'https://api.mercadopago.com';
const H_SUPA = { 'Content-Type': 'application/json', apikey: PUB_KEY, Authorization: `Bearer ${PUB_KEY}` };
const brl = (c) => `R$ ${(c / 100).toFixed(2).replace('.', ',')}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let falhas = 0;
function check(nome, ok, detalhe) {
  console.log(`${ok ? '  OK  ' : ' FALHA'}  ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
  if (!ok) falhas++;
}

console.log('='.repeat(66));
console.log(`TESTE DO WEBHOOK — resultado esperado: ${RESULTADO}`);
console.log('='.repeat(66));

// ── 0. Sanidade das credenciais ──────────────────────────────
// Esta checagem existe porque já perdemos horas com um valor que
// PARECIA um token: MP_ACCESS_TOKEN_TEST estava preenchido com o
// nome de um usuário de teste (TESTUSER315930…), colhido da tela
// "Contas de teste" em vez de "Credenciais de teste".
console.log('\n0. CREDENCIAIS\n');
check('MP_MODE é test', modo === 'test', `valor: ${modo}`);
if (!token) {
  console.error('\nMP_ACCESS_TOKEN_TEST está vazio. É esse o problema.');
  process.exit(1);
}
console.log(`        token: ${token.slice(0, 9)}…  (${token.length} caracteres)`);
check(
  'token de teste começa com TEST-',
  token.startsWith('TEST-'),
  token.startsWith('TEST-') ? '' : 'isto NÃO é um Access token de teste — pegue em Credenciais de teste',
);
check('MP_NOTIFICATION_URL está definida', Boolean(notificationUrl), notificationUrl || 'vazia');
if (falhas > 0) {
  console.error('\nCorrija as credenciais antes de seguir. Nada foi criado.');
  process.exit(1);
}

if ((env.MP_WEBHOOK_STRICT || 'false').toLowerCase() === 'true') {
  console.log('\n  AVISO  MP_WEBHOOK_STRICT=true no .env.secrets. Se o secret de');
  console.log('         assinatura não estiver certo, o webhook responderá 401 e');
  console.log('         o pedido ficará em pending — o que parece falha do teste');
  console.log('         mas é a trava funcionando. Ver WEBHOOK_SIGNATURE_DEBT.md.');
}

// ── 1. Produto e pedido ──────────────────────────────────────
console.log('\n1. PEDIDO\n');

const prodRes = await fetch(
  `${SUPA_URL}/rest/v1/admin_products?select=id,name,price,unit,stock,stock_qty&active=eq.true&stock=neq.out&limit=1`,
  { headers: { apikey: PUB_KEY, Authorization: `Bearer ${PUB_KEY}` } },
);
const [produto] = await prodRes.json();
if (!produto) {
  console.error('Nenhum produto ativo e disponível. Abortando.');
  process.exit(1);
}
console.log(`        produto: ${produto.name} — R$ ${produto.price} / ${produto.unit}`);
console.log(`        stock_qty: ${produto.stock_qty === null ? 'NULL (não controlado)' : produto.stock_qty}`);

const ordRes = await fetch(`${FNS}/create-order`, {
  method: 'POST',
  headers: H_SUPA,
  body: JSON.stringify({
    items: [{ product_id: produto.id, qty: 1 }],
    shipping_address: ENDERECO,
    guest_email: GUEST,
    notes: `Teste de webhook — ${RESULTADO}`,
  }),
});
const ordJson = await ordRes.json().catch(() => ({}));
check('create-order responde 200', ordRes.status === 200, ordJson.error || `HTTP ${ordRes.status}`);
if (ordRes.status !== 200) {
  console.error('\nSem pedido não há o que o webhook atualize. Abortando.');
  process.exit(1);
}

const orderId = ordJson.order_id;
const totalCents = ordJson.total_cents;
const totalReais = Number((totalCents / 100).toFixed(2));
console.log(`        order_id: ${orderId}`);
console.log(`        total:    ${brl(totalCents)}  →  transaction_amount ${totalReais}`);

// O valor tem de casar com o do banco dentro de 1 centavo, senão
// mp-webhook grava "[ALERTA] valor divergente" e responde 400 sem
// mudar o status (mp-webhook/index.ts:139). Um teste que errasse o
// valor aqui reportaria "webhook não funciona" por culpa própria.
check(
  'total do pedido é representável em reais sem perda',
  Math.round(totalReais * 100) === totalCents,
  `${totalCents} centavos → ${totalReais}`,
);

// ── 2. Tokenização do cartão ─────────────────────────────────
// Duas vias. A primeira não exige que ninguém cole chave nenhuma:
// /v1/card_tokens aceita o Access token no header Authorization.
// Se o MP recusar, cai para ?public_key=TEST-... — e aí sim a chave
// pública de TESTE é necessária (a de produção não serve: o par de
// credenciais tem de ser do mesmo ambiente).
console.log('\n2. TOKEN DO CARTÃO\n');

const corpoCartao = JSON.stringify({
  ...CARTAO,
  cardholder: {
    name: RESULTADO,
    identification: { type: 'CPF', number: CPF_TESTE },
  },
});

async function tokenizar() {
  // Via A — Bearer.
  let res = await fetch(`${MP}/v1/card_tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: corpoCartao,
  });
  let json = await res.json().catch(() => ({}));
  if (res.ok && json.id) {
    console.log('        via: Authorization: Bearer (não precisou de Public Key)');
    return json.id;
  }
  const motivoA = json.message || json.error || `HTTP ${res.status}`;
  console.log(`        via Bearer recusada — ${motivoA}`);

  // Via B — public_key na query.
  if (!publicKeyTeste) {
    console.error('\n        Preciso da Public Key DE TESTE para a segunda via.');
    console.error('        Painel do MP > Suas integrações > sua aplicação >');
    console.error('        Credenciais de TESTE > Public Key (começa com TEST-).');
    console.error('        Adicione ao .env.secrets:  MP_PUBLIC_KEY_TEST=TEST-...');
    console.error('        (é pública por natureza — vai no HTML de qualquer loja)');
    return null;
  }
  if (!publicKeyTeste.startsWith('TEST-')) {
    console.error(`\n        MP_PUBLIC_KEY_TEST começa com "${publicKeyTeste.slice(0, 8)}".`);
    console.error('        Em modo test ela tem de começar com TEST-. Uma chave');
    console.error('        APP_USR- é de produção e não conversa com token de teste.');
    return null;
  }
  res = await fetch(`${MP}/v1/card_tokens?public_key=${encodeURIComponent(publicKeyTeste)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corpoCartao,
  });
  json = await res.json().catch(() => ({}));
  if (res.ok && json.id) {
    console.log('        via: ?public_key=TEST-…');
    return json.id;
  }
  console.error(`        via public_key também recusada — ${json.message || `HTTP ${res.status}`}`);
  if (json.cause) console.error(`        cause: ${JSON.stringify(json.cause)}`);
  return null;
}

const cardToken = await tokenizar();
check('cartão de teste tokenizado', Boolean(cardToken));
if (!cardToken) {
  console.error(`\nO pedido ${orderId} ficou criado e em pending.`);
  console.error('Ele segura estoque se o produto for controlado — a limpeza está no fim.');
  imprimeLimpeza();
  process.exit(1);
}

// ── 3. Pagamento ─────────────────────────────────────────────
console.log('\n3. PAGAMENTO NA API DO MERCADO PAGO\n');

const idempotencia = randomUUID();
const payRes = await fetch(`${MP}/v1/payments`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Idempotency-Key': idempotencia,
  },
  body: JSON.stringify({
    transaction_amount: totalReais,
    token: cardToken,
    description: `Ervatório — pedido ${orderId}`,
    installments: 1,
    payment_method_id: CARTAO.payment_method_id,
    // A peça que o webhook usa para achar o pedido.
    external_reference: orderId,
    notification_url: notificationUrl,
    payer: {
      email: payerEmail,
      identification: { type: 'CPF', number: CPF_TESTE },
    },
  }),
});
const pay = await payRes.json().catch(() => ({}));

if (!payRes.ok) {
  check('pagamento criado', false, pay.message || `HTTP ${payRes.status}`);
  if (pay.cause) console.error(`        cause: ${JSON.stringify(pay.cause)}`);
  console.error('\nSe a mensagem citar "de teste", é mistura de ambiente:');
  console.error('token/public key/e-mail do pagador têm de ser todos de teste.');
  imprimeLimpeza();
  process.exit(1);
}

check('pagamento criado', true, `payment_id ${pay.id}`);
console.log(`        status:        ${pay.status}  (${pay.status_detail})`);
console.log(`        valor:         R$ ${pay.transaction_amount}`);
console.log(`        external_ref:  ${pay.external_reference}`);

const esperadoMP = { APRO: 'approved', OTHE: 'rejected', CONT: 'in_process' }[RESULTADO];
check(`MP devolveu ${esperadoMP}`, pay.status === esperadoMP, `veio ${pay.status}`);
check('external_reference chegou ao MP', pay.external_reference === orderId);

// ── 4. O webhook ─────────────────────────────────────────────
// mapPaymentStatus() em _shared/mercadopago.ts traduz o status do MP
// para o nosso. Aqui só esperamos e vemos se o pedido mudou.
console.log('\n4. WEBHOOK → BANCO\n');
console.log('        O MP notifica de forma assíncrona. Aguardando 30s.');
console.log('        Não dá para ler orders com a chave pública (RLS), então');
console.log('        a confirmação final é uma consulta no banco como');
console.log('        service_role — instruções no fim.');
await sleep(30_000);

const nossoEsperado = { APRO: 'paid', OTHE: 'failed', CONT: 'pending' }[RESULTADO];

console.log('\n' + '='.repeat(66));
if (falhas > 0) {
  console.log(`${falhas} verificação(ões) falharam antes do webhook.`);
  process.exitCode = 1;
} else {
  console.log('O pagamento saiu como esperado. Falta confirmar o webhook.');
}
console.log('='.repeat(66));

console.log('\nCONFIRA NO BANCO (SQL Editor do Supabase):\n');
console.log(`select status, payment_external_id, payment_method,`);
console.log(`       payment_payload is not null as tem_payload, admin_notes`);
console.log(`  from public.orders where id = '${orderId}';\n`);
console.log(`Esperado:  status = '${nossoEsperado}'  ·  payment_external_id = '${pay.id}'\n`);
console.log('Se status ainda for pending, veja os logs da função:');
console.log('  Supabase > Edge Functions > mp-webhook > Logs');
console.log('  procure por "[mp-webhook] recebido". Se não houver NENHUMA linha,');
console.log('  o MP não alcançou a URL — o problema é a URL, não o código.\n');
console.log(`Ids para me mandar:  order_id ${orderId}  ·  payment_id ${pay.id}`);

imprimeLimpeza();

function imprimeLimpeza() {
  console.log('\nLIMPEZA (como service_role, depois de conferir):\n');
  console.log(`  select public.release_stock(id) from public.orders`);
  console.log(`   where guest_email = '${GUEST}' and status = 'pending';`);
  console.log(`  delete from public.order_items where order_id in`);
  console.log(`    (select id from public.orders where guest_email = '${GUEST}');`);
  console.log(`  delete from public.orders where guest_email = '${GUEST}';`);
  console.log('\nO release_stock só importa se o produto tiver stock_qty preenchido.');
}
