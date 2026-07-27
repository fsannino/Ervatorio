#!/usr/bin/env node
// ============================================================
// Exporta o conteúdo editorial do Supabase para supabase/seed.sql
// ============================================================
// Motivo: as fichas de erva, produtos, blends e vetores existem
// APENAS dentro do banco. Não há migration que os crie. Se o
// projeto Supabase for perdido — como o anterior foi — o catálogo
// inteiro vai junto, sem cópia no repositório.
//
// Este script fecha essa lacuna. Roda na sua máquina, lê via
// PostgREST com a chave publicável e escreve um seed versionado.
//
//   node scripts/dump-content.mjs
//
// O arquivo gerado (supabase/seed.sql) serve a dois propósitos:
//   1. Cópia do catálogo dentro do Git, revisável em diff.
//   2. Semente automática de branches do Supabase — o CLI roda
//      seed.sql depois das migrations, então um staging nasce com
//      o conteúdo completo em vez de tabelas vazias.
//
// ── Como os dados são inseridos ──
// Via jsonb_populate_recordset, e não INSERT com valores
// literais. A diferença importa: o Postgres faz a conversão de
// tipo usando a definição da própria tabela, então text[], jsonb,
// timestamptz e numeric caem certos sem o script precisar
// adivinhar o tipo de cada coluna. Menos código, menos chance de
// corromper um valor na ida.
//
// ── O que NÃO é exportado ──
// Nada de dado pessoal. A lista de tabelas abaixo é uma allowlist
// explícita: user_profiles, orders, order_items, newsletter_
// subscribers, product_reviews e afins ficam de fora por
// construção, não por filtro. Seed vai para o Git, e Git não é
// lugar de PII.
//
// chazerias e admin_suppliers também ficam de fora — já existem em
// migrations versionadas. Incluí-las aqui duplicaria as linhas num
// banco novo (a migration insere, o seed insere de novo).
//
// ── Limite conhecido ──
// A leitura usa a chave publicável, então enxerga só o que as
// policies de leitura pública liberam: fichas com active=true e
// status='published', produtos/blends/vetores com active=true.
// Hoje isso é 100% das linhas (verificado: 110 de 110 fichas, 41
// de 41 produtos). Se um dia houver rascunho não publicado, ele
// NÃO entra no seed — e o script avisa comparando o total.
// Para exportar tudo, incluindo rascunhos, exporte a chave secreta
// antes de rodar:
//     set SUPABASE_SECRET_KEY=sb_secret_...      (Windows CMD)
//     export SUPABASE_SECRET_KEY=sb_secret_...   (bash)
// A chave é lida do ambiente e nunca escrita no arquivo de saída.
// ============================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'supabase/seed.sql');

// Allowlist. Só conteúdo editorial — ver comentário no topo.
const TABLES = [
  'admin_herb_fichas',
  'admin_products',
  'admin_blends',
  'admin_recommendation_vectors',
  'admin_herbs',
  'admin_news',
  'site_settings',
];

// ── Configuração: reaproveita js/config.js para não duplicar a URL
function loadConfig() {
  const src = readFileSync(resolve(ROOT, 'js/config.js'), 'utf8');
  const url = src.match(/SUPABASE_URL:\s*'([^']+)'/)?.[1];
  const key = src.match(/SUPABASE_PUBLISHABLE_KEY:\s*'([^']+)'/)?.[1];
  if (!url || !key) {
    throw new Error('Não consegui ler SUPABASE_URL/KEY de js/config.js');
  }
  return { url, key: process.env.SUPABASE_SECRET_KEY || key };
}

// ── Busca paginada. PostgREST limita a resposta; 1000 por vez cobre
// as tabelas atuais com folga e continua correto se crescerem.
async function fetchAll(base, key, table) {
  const PAGE = 1000;
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = `${base}/rest/v1/${table}?select=*&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      throw new Error(`${table}: HTTP ${res.status} — ${await res.text()}`);
    }
    const page = await res.json();
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows;
}

// Conta o total sem trazer as linhas, para detectar o que a RLS escondeu.
async function countAll(base, key, table) {
  const res = await fetch(`${base}/rest/v1/${table}?select=id`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  });
  const cr = res.headers.get('content-range'); // ex.: "0-0/110"
  return cr ? Number(cr.split('/')[1]) : null;
}

// Escolhe uma tag de dollar-quoting que não apareça no conteúdo.
function safeTag(payload) {
  for (const tag of ['seed', 'seed1', 'seed2', 'ervatorio', 'erv0']) {
    if (!payload.includes(`$${tag}$`)) return tag;
  }
  throw new Error('Não achei tag de dollar-quoting livre — conteúdo inesperado');
}

function block(table, rows) {
  if (!rows.length) {
    return `-- ${table}: 0 linhas na origem, nada a semear.\n`;
  }
  const json = JSON.stringify(rows);
  const tag = safeTag(json);
  // Guarda de tabela vazia: reaplicar não duplica nem sobrescreve
  // edição feita depois pelo admin.
  return `-- ${table}: ${rows.length} linhas
DO $do$
BEGIN
IF (SELECT count(*) FROM public.${table}) > 0 THEN
  RAISE NOTICE '${table} já populada — seed ignorado';
ELSE
  INSERT INTO public.${table}
  SELECT * FROM jsonb_populate_recordset(
    NULL::public.${table},
    $${tag}$${json}$${tag}$::jsonb
  );
  RAISE NOTICE '${table}: % linhas semeadas', ${rows.length};
END IF;
END $do$;
`;
}

const { url, key } = loadConfig();
const usandoSecret = Boolean(process.env.SUPABASE_SECRET_KEY);

console.log(`Origem: ${url}`);
console.log(`Chave:  ${usandoSecret ? 'secreta (enxerga rascunhos)' : 'publicável (só conteúdo publicado)'}\n`);

const partes = [];
let totalLinhas = 0;
let houveOmissao = false;

for (const table of TABLES) {
  const rows = await fetchAll(url, key, table);
  const total = await countAll(url, key, table);
  totalLinhas += rows.length;

  let nota = '';
  if (total !== null && total > rows.length) {
    nota = `  ⚠  ${total - rows.length} linha(s) não vieram (RLS)`;
    houveOmissao = true;
  }
  console.log(`  ${table.padEnd(30)} ${String(rows.length).padStart(4)} linhas${nota}`);
  partes.push(block(table, rows));
}

const cabecalho = `-- ============================================================
-- Seed de conteúdo editorial — Ervatório
-- ============================================================
-- GERADO POR scripts/dump-content.mjs. Não edite à mão: rode o
-- script de novo para atualizar.
--
-- Serve a dois propósitos:
--   1. Cópia do catálogo dentro do Git. Sem este arquivo, as
--      fichas, produtos, blends e vetores existiriam só dentro do
--      banco, sem como reconstruir se o projeto for perdido.
--   2. Semente de branches do Supabase — o CLI roda seed.sql
--      depois das migrations, então um staging nasce com o
--      conteúdo completo.
--
-- Cada bloco só insere se a tabela estiver vazia, então reaplicar
-- é seguro e não sobrescreve edição feita pelo admin.
--
-- Sem dado pessoal: a allowlist do script cobre só conteúdo
-- editorial. user_profiles, orders, newsletter_subscribers e
-- product_reviews ficam de fora por construção.
--
-- chazerias e admin_suppliers não estão aqui — já vivem em
-- migrations versionadas.
-- ============================================================

`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, cabecalho + partes.join('\n'), 'utf8');

console.log(`\n${totalLinhas} linhas → supabase/seed.sql`);
if (houveOmissao) {
  console.log('\n⚠  Alguma linha ficou de fora por RLS (rascunho ou inativa).');
  console.log('   Para exportar tudo, defina SUPABASE_SECRET_KEY e rode de novo.');
  process.exitCode = 1;
}
