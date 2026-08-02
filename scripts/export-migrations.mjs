#!/usr/bin/env node
// ============================================================
// Exporta o histórico REAL de migrations do banco para o repositório
// ============================================================
// Contexto: em 02/08/2026 descobrimos que `supabase/migrations/` não
// correspondia ao que produção tinha rodado. Nenhum dos 25 arquivos
// batia com nenhuma das 21 migrations aplicadas — nem os de nome
// idêntico. As `base_*`/`sec_*`, que consolidaram os .sql soltos da
// raiz, nunca foram commitadas.
//
// Consequência: o repositório não reconstruía o banco, e a regra do
// CLAUDE.md ("teste a migration em um Supabase branch") não tinha como
// ser cumprida — todo branch novo morria em `base_03`.
//
// Este script fecha esse buraco de forma repetível: lê
// `supabase_migrations.schema_migrations` e grava um arquivo por
// migration. Rode sempre que suspeitar de divergência.
//
// USO
//   export SUPABASE_DB_URL='postgresql://postgres:SENHA@db.<ref>.supabase.co:5432/postgres'
//   node scripts/export-migrations.mjs            # grava os arquivos
//   node scripts/export-migrations.mjs --check    # só compara, não grava
//
// A connection string está em Supabase → Project Settings → Database.
// Ela contém segredo: use variável de ambiente, nunca commite.
//
// `--check` sai com código 1 se houver divergência — serve para o CI
// travar PR que mexa em migration sem sincronizar.
// ============================================================

import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const DIR = 'supabase/migrations';
const CHECK_ONLY = process.argv.includes('--check');
const DB_URL = process.env.SUPABASE_DB_URL;

if (!DB_URL) {
  console.error('SUPABASE_DB_URL não definida. Veja o cabeçalho deste arquivo.');
  process.exit(2);
}

// Normaliza para comparar conteúdo ignorando espaços e o `;` final —
// o CLI grava os statements sem o ponto-e-vírgula terminal.
const norm = (s) =>
  createHash('md5').update(s.replace(/\s+/g, '').replace(/;+$/, '')).digest('hex');

function query(sql) {
  const out = execFileSync('psql', [DB_URL, '-At', '-c', sql], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  return out;
}

// SQL tem quebras de linha, então NÃO dá para parsear por linha — a
// primeira versão deste script fazia isso e truncava toda migration com
// mais de um statement, silenciosamente. Pior: o --check comparava
// truncado com truncado e reportava "idêntico".
//
// Por isso: um único campo, registros separados por \x1e e campos por
// \x1f — bytes de controle que não aparecem em SQL.
const raw = query(`
  select string_agg(
           version || chr(31) || name || chr(31) ||
             array_to_string(statements, E';\\n\\n'),
           chr(30) order by version)
  from supabase_migrations.schema_migrations
`);

const migrations = raw
  .split('\x1e')
  .map((rec) => rec.trim())
  .filter((rec) => rec.includes('\x1f'))
  .map((rec) => {
    const [version, name, ...rest] = rec.split('\x1f');
    return { version, name, sql: rest.join('\x1f') };
  });

if (migrations.length === 0) {
  console.error('Nenhuma migration encontrada — a query devolveu vazio.');
  process.exit(2);
}

mkdirSync(DIR, { recursive: true });

const noDisco = new Map(
  readdirSync(DIR)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => [f, readFileSync(join(DIR, f), 'utf8')])
);

let divergencias = 0;
const esperados = new Set();

for (const m of migrations) {
  const arquivo = `${m.version}_${m.name}.sql`;
  esperados.add(arquivo);
  const atual = noDisco.get(arquivo);

  if (atual !== undefined && norm(atual) === norm(m.sql)) continue;

  divergencias++;
  const motivo = atual === undefined ? 'ausente' : 'conteúdo diferente';
  console.log(`${CHECK_ONLY ? 'DIVERGE' : 'grava  '}  ${arquivo}  (${motivo})`);
  if (!CHECK_ONLY) writeFileSync(join(DIR, arquivo), m.sql.endsWith('\n') ? m.sql : m.sql + '\n');
}

// Arquivo no repositório que o banco não conhece: ou nunca foi aplicado,
// ou foi substituído por uma migration consolidada.
for (const f of noDisco.keys()) {
  if (!esperados.has(f)) {
    divergencias++;
    console.log(`ÓRFÃO    ${f}  (não existe no histórico do banco)`);
  }
}

if (divergencias === 0) {
  console.log(`OK — ${migrations.length} migrations, repositório e banco idênticos.`);
  process.exit(0);
}

console.log(
  `\n${divergencias} divergência(s) entre ${DIR} e o histórico do banco.` +
    (CHECK_ONLY ? '\nRode sem --check para sincronizar.' : '\nArquivos gravados; revise o diff antes de commitar.')
);
process.exit(CHECK_ONLY ? 1 : 0);
