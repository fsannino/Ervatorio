#!/usr/bin/env node
// ============================================================
// Pré-render SEO — Onda 5 (backlog #26, #27, #28, #29, #31–#35, #38)
// ============================================================
// Gera, a partir de js/fichas-data.js (97 fichas):
//   • erva/<slug>/index.html — página estática indexável por erva,
//     com conteúdo real no HTML, canonical, OG/Twitter, JSON-LD
//     (Article + BreadcrumbList) e CTA para o app (#ficha/<slug>)
//   • erva/index.html        — hub "Ervopédia" com links para todas
//   • sitemap.xml             — home + legais + hub + 97 ervas
//   • robots.txt              — referencia o sitemap
//
// Estratégia (fase 1 da Onda 5): páginas estáticas convivem com o
// SPA sem tocar no routing hash — o Google indexa /erva/<slug>/ e
// o usuário entra no app pelo CTA. A migração completa do routing
// interno (History API) é a fase 2.
//
// Uso: npm run prerender   (os arquivos gerados são commitados,
// como as imagens otimizadas — deploy estático sem build step)
// ============================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://ervatorio.com.br';
const TODAY = new Date().toISOString().slice(0, 10);

// ── Carrega as fichas (arquivo de browser: expõe var FICHAS_ANCORA)
const fichasSrc = readFileSync('js/fichas-data.js', 'utf8');
const FICHAS = new Function(`${fichasSrc}; return FICHAS_ANCORA;`)();
const slugs = Object.keys(FICHAS);

// ── Léxico da Chazeria (Onda 2.1) — glossário estático indexável
const lexicoSrc = readFileSync('js/lexico-data.js', 'utf8');
const { LEXICO_TERMOS, LEXICO_CATEGORIAS } =
  new Function(`${lexicoSrc}; return { LEXICO_TERMOS, LEXICO_CATEGORIAS };`)();

// Manifest de imagens (Onda 4) para OG image por erva quando existir.
let IMG_MANIFEST = {};
try { IMG_MANIFEST = JSON.parse(readFileSync('images/manifest.json', 'utf8')); } catch { /* ok */ }

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
const has = (v) => v != null && String(v).trim() !== '' && !(Array.isArray(v) && v.length === 0);

function ogImageFor(slug) {
  for (const [key, entry] of Object.entries(IMG_MANIFEST)) {
    if (key.includes(`/produtos/${slug}.`) || key.includes(`/produtos/${slug}-`)) {
      const v = entry.variants?.find((x) => x.width >= 1024) || entry.variants?.at(-1);
      if (v) return `${SITE}/${v.path}`;
    }
  }
  return `${SITE}/images/optimized/hero/ervas-colecao-1024w.webp`;
}

function section(title, inner) {
  return inner ? `<section><h2>${esc(title)}</h2>${inner}</section>` : '';
}
function dl(pairs) {
  const rows = pairs.filter(([, v]) => has(v))
    .map(([k, v]) => `<div class="row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  return rows ? `<dl>${rows}</dl>` : '';
}
function ul(items) {
  const li = (items || []).filter(has).map((i) => `<li>${esc(i)}</li>`).join('');
  return li ? `<ul>${li}</ul>` : '';
}
function labeledList(items) {
  const li = (items || []).filter((i) => has(i?.label) || has(i?.texto))
    .map((i) => `<li><strong>${esc(i.label)}</strong>${has(i.texto) ? ` — ${esc(i.texto)}` : ''}</li>`).join('');
  return li ? `<ul>${li}</ul>` : '';
}

const CSS = `
:root{--verde:#1a3a2a;--verde2:#2d5440;--ouro:#b8965a;--ouro2:#d9b878;--creme:#f5ede0;--ink:#22201a;--panel:#fbf6ea;--line:#e0d5bd}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',serif;background:#f3ecdd;color:var(--ink);line-height:1.7}
header.hero{background:linear-gradient(160deg,var(--verde),var(--verde2));color:var(--creme);padding:40px 20px 34px;border-bottom:3px solid var(--ouro)}
.wrap{max-width:840px;margin:0 auto;padding:0 20px}
header a.back{color:var(--ouro2);text-decoration:none;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase}
h1{font-size:clamp(1.7rem,4.5vw,2.6rem);margin:10px 0 2px;font-weight:600}
.latin{font-style:italic;color:var(--ouro2);font-size:1.02rem}
.tagline{margin-top:12px;max-width:64ch;color:#e6dcc8;font-size:1.02rem}
main{padding:34px 0 56px}
section{margin:26px 0}
h2{font-size:1.22rem;color:var(--verde);border-bottom:1px solid var(--line);padding-bottom:5px;margin-bottom:12px}
dl .row{display:flex;gap:10px;padding:5px 0;border-bottom:1px dashed var(--line)}
dt{flex:0 0 190px;font-weight:700;font-size:.85rem;color:#6b5a2e}
dd{flex:1;font-size:.95rem}
ul{padding-left:22px}li{margin:5px 0;font-size:.95rem}
.cta{display:inline-block;background:var(--verde);color:var(--creme);border:1px solid var(--ouro);border-radius:10px;padding:12px 22px;text-decoration:none;font-size:.95rem;margin:8px 12px 8px 0}
.cta.gold{background:var(--ouro);color:#1c1608;font-weight:700}
.health{background:#f7e2df;border-left:4px solid #a3241c;padding:12px 16px;border-radius:0 8px 8px 0;font-size:.88rem;margin:24px 0}
.related{display:flex;flex-wrap:wrap;gap:8px}
.related a{background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:6px 14px;text-decoration:none;color:var(--verde);font-size:.85rem}
footer{background:var(--verde);color:#c3b89e;padding:22px 20px;font-size:.8rem;text-align:center}
footer a{color:var(--ouro2)}
@media(max-width:560px){dl .row{flex-direction:column;gap:2px}dt{flex:none}}
`.trim();

function fichaPage(slug, f, idx) {
  const nome = f.nome_popular || slug;
  const latin = f.nome_cientifico || '';
  const desc = (f.tagline || `Ficha completa de ${nome}: preparo, ações, segurança e cultura.`).slice(0, 158);
  const url = `${SITE}/erva/${slug}/`;
  const img = ogImageFor(slug);

  // Vizinhas para linkagem interna (anel: 4 anteriores/seguintes).
  const related = [-2, -1, 1, 2].map((d) => slugs[(idx + d + slugs.length) % slugs.length])
    .map((s) => `<a href="/erva/${s}/">${esc(FICHAS[s].nome_popular || s)}</a>`).join('');

  const id = f.identificacao || {}, c = f.caracterizacao || {}, p = f.preparo || {};
  const a = f.acoes_e_seguranca || {}, cu = f.cultura || {}, r = f.regulacao || {};

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: `${nome} (${latin})`.slice(0, 110),
        description: desc,
        image: img,
        inLanguage: 'pt-BR',
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'Ervatório', url: SITE },
        publisher: { '@type': 'Organization', name: 'Ervatório', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/icon-512.png` } },
        about: { '@type': 'Thing', name: nome, alternateName: latin },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Ervopédia', item: `${SITE}/erva/` },
          { '@type': 'ListItem', position: 3, name: nome, item: url },
        ],
      },
    ],
  };

  const body = [
    section('Identificação', dl([
      ['Nome científico', latin],
      ['Família botânica', id.familia_botanica],
      ['Tipo', id.tipo_botanico],
      ['Parte usada', id.parte_usada],
    ]) + ul(id.sinonimos)),
    section('Características', dl([
      ['Sabor', c.sabor_dominante],
      ['Aroma', c.aroma],
      ['Cor da infusão', c.cor_da_infusao],
      ['Intensidade', c.intensidade],
      ['Bioma de origem', c.bioma_de_origem],
    ])),
    section('Como preparar', dl([
      ['Temperatura', p.temperatura_ideal],
      ['Tempo de infusão', p.tempo_de_infusao],
      ['Quantidade', p.quantidade],
      ['Método', p.metodo],
      ['Melhor momento', p.melhor_momento],
      ['Combina com', p.combina_com],
    ])),
    section('Ações principais', ul((a.acoes_principais || []).filter((x) => !/:$/.test(String(x).trim())))),
    section('Componentes ativos', labeledList(a.componentes_ativos)),
    section('Contraindicações e cuidados', ul((a.contraindicacoes || []).filter((x) => !/:$/.test(String(x).trim())))),
    section('Interações', labeledList(a.interacoes)),
    has(cu.historia) || has(cu.brasil)
      ? section('História e cultura', `${has(cu.historia) ? `<p>${esc(cu.historia)}</p>` : ''}${has(cu.brasil) ? `<p>${esc(cu.brasil)}</p>` : ''}`)
      : '',
    section('Status regulatório', dl([
      ['ANVISA (Brasil)', r.status_anvisa],
      ['EMA (Europa)', r.status_ema],
      ['FDA (EUA)', r.status_fda],
      ['Sazonalidade', r.sazonalidade],
    ])),
    section('Fontes', ul(a.fontes)),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(nome)} (${esc(latin)}) — preparo, benefícios e contraindicações | Ervatório</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(nome)} — Ervopédia | Ervatório">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(nome)} — Ervopédia | Ervatório">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/erva/">← Ervopédia</a>
  <h1>${esc(nome)}</h1>
  <div class="latin">${esc(latin)}</div>
  ${has(f.tagline) ? `<p class="tagline">${esc(f.tagline)}</p>` : ''}
</div></header>
<main class="wrap">
  <p>
    <a class="cta gold" href="/#ficha/${esc(slug)}">🌿 Abrir no Ervatório</a>
    <a class="cta" href="/#page=search">Explorar todas as ervas</a>
  </p>
  ${body}
  <div class="health">🌿 <strong>Aviso:</strong> conteúdo exclusivamente educacional — não substitui prescrição, diagnóstico ou aconselhamento médico. Consulte profissional de saúde qualificado antes de usar plantas medicinais, especialmente em gravidez, amamentação, uso de medicamentos ou doenças preexistentes.</div>
  <section><h2>Ervas relacionadas</h2><div class="related">${related}</div></section>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

function hubPage() {
  const links = slugs
    .map((s) => ({ s, n: FICHAS[s].nome_popular || s, l: FICHAS[s].nome_cientifico || '' }))
    .sort((x, y) => x.n.localeCompare(y.n, 'pt'))
    .map(({ s, n, l }) => `<li><a href="/erva/${s}/">${esc(n)}</a> <span class="lat">${esc(l)}</span></li>`)
    .join('\n');
  const url = `${SITE}/erva/`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Ervopédia — enciclopédia de ervas do Ervatório',
    url,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'Ervatório', url: SITE },
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ervopédia — ${slugs.length} ervas com ciência, preparo e cultura | Ervatório</title>
<meta name="description" content="Enciclopédia botânica do Ervatório: ${slugs.length} fichas de ervas com preparo, componentes ativos, contraindicações, status regulatório (ANVISA/EMA/FDA) e cultura.">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Ervopédia | Ervatório">
<meta property="og:description" content="${slugs.length} ervas com ciência, preparo e cultura.">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}
ul.hub{list-style:none;padding:0;columns:2;column-gap:30px}
ul.hub li{break-inside:avoid;border-bottom:1px dashed var(--line);padding:7px 0}
ul.hub a{color:var(--verde);font-weight:700;text-decoration:none}
.lat{font-style:italic;color:#7a6f57;font-size:.82rem;display:block}
@media(max-width:640px){ul.hub{columns:1}}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Ervopédia</h1>
  <p class="tagline">${slugs.length} ervas do Brasil e do mundo — ciência, preparo, segurança e cultura em cada ficha.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/">🌿 Abrir o Ervatório</a> <a class="cta" href="/lexico/">Léxico da Chazeria →</a></p>
  <ul class="hub">
${links}
  </ul>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

// ── Léxico: CSS extra + páginas ─────────────────────────────
const LEXICO_CSS = `
.eyebrow{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--ouro2);font-weight:700;margin-bottom:6px}
.pron{color:#e6dcc8;font-size:.95rem;margin-top:8px}
.pron em{font-style:normal;color:var(--ouro2)}
.rel-terms{display:flex;flex-wrap:wrap;gap:8px}
.rel-terms a{background:var(--panel);border:1px solid var(--line);border-radius:99px;padding:6px 14px;text-decoration:none;color:var(--verde);font-size:.85rem}
ul.lex{list-style:none;padding:0;columns:2;column-gap:30px}
ul.lex li{break-inside:avoid;border-bottom:1px dashed var(--line);padding:7px 0}
ul.lex a{color:var(--verde);font-weight:700;text-decoration:none}
ul.lex .cat{display:block;font-size:.72rem;color:#7a6f57}
.lex-cta{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0}
@media(max-width:640px){ul.lex{columns:1}}`;

const lexBySlug = Object.fromEntries(LEXICO_TERMOS.map((t) => [t.slug, t]));

function lexicoTermPage(term) {
  const cat = LEXICO_CATEGORIAS[term.categoria] || 'Léxico';
  const url = `${SITE}/lexico/${term.slug}/`;
  const desc = String(term.def || '').slice(0, 158);
  const etim = [term.origem, term.trad && `"${term.trad}"`].filter(Boolean).join(' · ');

  const rel = (term.rel || []).filter((s) => lexBySlug[s])
    .map((s) => `<a href="/lexico/${s}/">${esc(lexBySlug[s].termo)}</a>`).join('');
  // Só linka fichas que existem de fato (evita link quebrado).
  const ervas = (term.ervas || []).filter((s) => FICHAS[s])
    .map((s) => `<a href="/erva/${s}/">${esc(FICHAS[s].nome_popular || s)}</a>`).join('');

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm', name: term.termo, description: term.def, inDefinedTermSet: `${SITE}/lexico/`,
        termCode: term.slug, inLanguage: 'pt-BR',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ervatório', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Léxico', item: `${SITE}/lexico/` },
          { '@type': 'ListItem', position: 3, name: term.termo, item: url },
        ],
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(term.termo)} — o que é? | Léxico da Chazeria · Ervatório</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(term.termo)} — Léxico da Chazeria | Ervatório">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(term.termo)} — Léxico | Ervatório">
<meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${LEXICO_CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/lexico/">← Léxico da Chazeria</a>
  <div class="eyebrow" style="margin-top:10px">${esc(cat)}</div>
  <h1>${esc(term.termo)}</h1>
  ${term.pron || etim ? `<p class="pron">${term.pron ? `<em>/${esc(term.pron)}/</em>` : ''}${term.pron && etim ? ' · ' : ''}${esc(etim)}</p>` : ''}
</div></header>
<main class="wrap">
  <section><p style="font-size:1.05rem">${esc(term.def)}</p></section>
  ${rel ? section('Termos relacionados', `<div class="rel-terms">${rel}</div>`) : ''}
  ${ervas ? section('Veja também nas ervas', `<div class="related">${ervas}</div>`) : ''}
  <div class="lex-cta">
    <a class="cta gold" href="/lexico/">Explorar o Léxico</a>
    <a class="cta" href="/erva/">Ir para a Ervopédia</a>
  </div>
  <div class="health">🌿 <strong>Aviso:</strong> conteúdo cultural e educacional sobre a linguagem do chá — não constitui aconselhamento de saúde.</div>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

function lexicoHubPage() {
  const ordered = [...LEXICO_TERMOS].sort((a, b) => a.termo.localeCompare(b.termo, 'pt'));
  const links = ordered.map((t) =>
    `<li><a href="/lexico/${t.slug}/">${esc(t.termo)}</a> <span class="cat">${esc(LEXICO_CATEGORIAS[t.categoria] || '')}</span></li>`).join('\n');
  const url = `${SITE}/lexico/`;
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'DefinedTermSet',
    name: 'Léxico da Chazeria — a linguagem do chá', url, inLanguage: 'pt-BR',
    hasDefinedTerm: ordered.map((t) => ({ '@type': 'DefinedTerm', name: t.termo, url: `${SITE}/lexico/${t.slug}/` })),
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Léxico da Chazeria — ${LEXICO_TERMOS.length} termos do chá explicados | Ervatório</title>
<meta name="description" content="A linguagem do chá em ${LEXICO_TERMOS.length} termos: métodos de preparo, utensílios, botânica, cultura brasileira e global, e vocabulário sensorial. Do gongfu cha ao chimarrão.">
<link rel="canonical" href="${url}">
<link rel="icon" href="/icon-192.png">
<meta property="og:type" content="website">
<meta property="og:title" content="Léxico da Chazeria | Ervatório">
<meta property="og:description" content="${LEXICO_TERMOS.length} termos do universo do chá, do gongfu cha ao chimarrão.">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/optimized/hero/ervas-colecao-1024w.webp">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}${LEXICO_CSS}</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <a class="back" href="/">← Ervatório</a>
  <h1>Léxico da Chazeria</h1>
  <p class="tagline">A linguagem do chá em ${LEXICO_TERMOS.length} termos — métodos, utensílios, botânica e a cultura do Brasil e do mundo.</p>
</div></header>
<main class="wrap">
  <p><a class="cta gold" href="/">🍵 Abrir o Ervatório</a> <a class="cta" href="/erva/">Ervopédia →</a></p>
  <ul class="lex">
${links}
  </ul>
</main>
<footer>
  <p>© 2026 Ervatório · <a href="/">ervatorio.com.br</a> · <a href="/privacidade.html">Privacidade</a> · <a href="/termos.html">Termos</a></p>
</footer>
</body>
</html>`;
}

// ── Geração ─────────────────────────────────────────────────
let count = 0;
for (const [i, slug] of slugs.entries()) {
  const dir = join('erva', slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), fichaPage(slug, FICHAS[slug], i));
  count++;
}
writeFileSync(join('erva', 'index.html'), hubPage());

// Léxico da Chazeria
let lexCount = 0;
for (const term of LEXICO_TERMOS) {
  const dir = join('lexico', term.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), lexicoTermPage(term));
  lexCount++;
}
writeFileSync(join('lexico', 'index.html'), lexicoHubPage());

// sitemap.xml
const staticUrls = [
  { loc: `${SITE}/`, priority: '1.0' },
  { loc: `${SITE}/erva/`, priority: '0.9' },
  { loc: `${SITE}/lexico/`, priority: '0.7' },
  { loc: `${SITE}/privacidade.html`, priority: '0.3' },
  { loc: `${SITE}/termos.html`, priority: '0.3' },
];
const urls = staticUrls
  .concat(slugs.map((s) => ({ loc: `${SITE}/erva/${s}/`, priority: '0.8' })))
  .concat(LEXICO_TERMOS.map((t) => ({ loc: `${SITE}/lexico/${t.slug}/`, priority: '0.6' })));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${TODAY}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync('sitemap.xml', sitemap);

// robots.txt
writeFileSync('robots.txt', `User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${SITE}/sitemap.xml
`);

console.log(`✓ ${count} páginas de erva + hub geradas em /erva/`);
console.log(`✓ ${lexCount} termos do léxico + hub gerados em /lexico/`);
console.log(`✓ sitemap.xml (${urls.length} URLs) e robots.txt escritos`);
if (!existsSync('images/manifest.json')) console.warn('! images/manifest.json ausente — OG images caíram no fallback');
