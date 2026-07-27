#!/usr/bin/env node
// ============================================================
// Diagnóstico de credencial do Mercado Pago
// ============================================================
//   node scripts/check-mp-credentials.mjs
//
// Fala DIRETO com a API do Mercado Pago, sem passar pelas nossas
// Edge Functions. Serve para responder uma pergunta só: o problema
// está na credencial/conta ou no nosso código?
//
// Se este script reproduzir o mesmo erro que create-payment-
// preference deu, o código está fora de suspeita — a resposta está
// no painel do Mercado Pago.
//
// Lê os tokens de .env.secrets (que o .gitignore cobre). Nunca
// imprime o token: só o prefixo, o tamanho, e a resposta da API.
// ============================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV = resolve(ROOT, '.env.secrets');

if (!existsSync(ENV)) {
  console.error('Não achei .env.secrets nesta pasta.');
  console.error('Ele fica só na sua máquina — se sumiu, recrie com:');
  console.error('  copy .env.example .env.secrets');
  process.exit(1);
}

const env = {};
for (const linha of readFileSync(ENV, 'utf8').split(/\r?\n/)) {
  const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const modo = (env.MP_MODE || 'test').toLowerCase();
const chave = modo === 'production' ? 'MP_ACCESS_TOKEN_PROD' : 'MP_ACCESS_TOKEN_TEST';
const token = env[chave];

console.log('='.repeat(60));
console.log('DIAGNÓSTICO DE CREDENCIAL — MERCADO PAGO');
console.log('='.repeat(60));
console.log(`MP_MODE:     ${modo}`);
console.log(`Usando:      ${chave}`);

if (!token) {
  console.error(`\n${chave} está vazio no .env.secrets. É esse o problema.`);
  process.exit(1);
}

// Só o prefixo — o suficiente para saber se é o tipo certo de token.
const prefixo = token.slice(0, 9);
console.log(`Prefixo:     ${prefixo}…  (${token.length} caracteres)`);

const esperado = modo === 'production' ? 'APP_USR-' : 'TEST-';
const prefixoOk = token.startsWith(esperado);
console.log(`Formato:     ${prefixoOk ? 'OK' : `SUSPEITO — em modo ${modo} o token deveria começar com "${esperado}"`}`);

// ── 1. A quem pertence este token? ──────────────────────────
console.log('\n1. IDENTIDADE DA CREDENCIAL\n');
const meRes = await fetch('https://api.mercadopago.com/users/me', {
  headers: { Authorization: `Bearer ${token}` },
});
const me = await meRes.json();
if (meRes.ok) {
  console.log(`   HTTP ${meRes.status}  — token válido`);
  console.log(`   conta:      ${me.nickname || '(sem apelido)'}  · id ${me.id}`);
  console.log(`   e-mail:     ${me.email || '(não informado)'}`);
  console.log(`   país/site:  ${me.site_id || '?'}`);
  console.log(`   tipo:       ${me.user_type || '?'}`);
  if (Array.isArray(me.tags) && me.tags.length) {
    console.log(`   tags:       ${me.tags.join(', ')}`);
  }
  if (me.status && typeof me.status === 'object') {
    const restricoes = Object.entries(me.status)
      .filter(([, v]) => v === false || (v && typeof v === 'object' && v.allow === false))
      .map(([k]) => k);
    console.log(`   restrições: ${restricoes.length ? restricoes.join(', ') : 'nenhuma reportada'}`);
  }
} else {
  console.log(`   HTTP ${meRes.status}  — ${JSON.stringify(me)}`);
  console.log('\n   O token não foi aceito nem para identificar a conta.');
  console.log('   Copie de novo do painel: Suas integrações > sua aplicação >');
  console.log(`   Credenciais de ${modo === 'production' ? 'produção' : 'teste'} > Access token.`);
  process.exit(1);
}

// ── 2. A preferência mínima possível ────────────────────────
console.log('\n2. CRIAR PREFERÊNCIA (payload mínimo)\n');
const prefRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ title: 'Teste de credencial', quantity: 1, unit_price: 10, currency_id: 'BRL' }],
  }),
});
const pref = await prefRes.json();

if (prefRes.ok) {
  console.log(`   HTTP ${prefRes.status}  — preferência criada: ${pref.id}`);
  console.log('\n' + '='.repeat(60));
  console.log('A credencial FUNCIONA para criar preferência.');
  console.log('Se create-payment-preference ainda falhar, o problema está');
  console.log('no que a nossa function envia a mais — back_urls,');
  console.log('notification_url ou external_reference. Me mande esta saída.');
} else {
  console.log(`   HTTP ${prefRes.status}`);
  console.log(`   ${JSON.stringify(pref, null, 2).split('\n').join('\n   ')}`);
  console.log('\n' + '='.repeat(60));
  console.log('A credencial NÃO cria preferência nem no payload mínimo.');
  console.log('O nosso código está fora de suspeita — é conta ou credencial.');
  console.log('\nO que checar no painel do Mercado Pago:');
  console.log('  • A aplicação tem "Checkout Pro" habilitado?');
  console.log('  • A conta está aprovada, ou há pendência/limitação em aberto?');
  console.log('  • O Access token é o da APLICAÇÃO, e não o de um usuário');
  console.log('    de teste criado em "Contas de teste"?');
  console.log('  • Em modo test, o token começa com TEST-?');
}
console.log('='.repeat(60));
