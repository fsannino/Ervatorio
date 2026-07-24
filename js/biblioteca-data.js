// ============================================================
// ERVATÓRIO — Biblioteca (Onda 2.4 / trilha editorial)
// ============================================================
// Guias imprimíveis ("salvar como PDF" pelo navegador). Páginas
// estáticas geradas pelo prerender, otimizadas para impressão
// (@media print). Compiladas do conteúdo que já existe (Léxico,
// série "Como se faz") + uma tabela de preparo própria.
//
// Cada guia:
//   slug, titulo, subtitulo, desc, tipo ('preparo'|'lexico'|'processos')
//   termos?  — slugs do Léxico (para o guia tipo 'lexico')
//
// Sem alegação terapêutica; dados de preparo são orientações gerais.
// ============================================================

var BIBLIOTECA_GUIAS = [
  {
    slug: 'guia-de-preparo', titulo: 'Guia de Preparo do Chá', subtitulo: 'Temperatura, tempo e proporção por tipo',
    desc: 'Tabela de referência para preparar cada tipo de chá — temperatura da água, tempo de infusão, proporção e reinfusões. Feito para imprimir e deixar na cozinha.',
    tipo: 'preparo',
  },
  {
    slug: 'mini-lexico', titulo: 'Mini-Léxico do Chá', subtitulo: '24 termos essenciais da chazeria',
    desc: 'Os termos que mais aparecem no universo do chá — do gongfu cha ao chimarrão — num guia enxuto para imprimir e consultar.',
    tipo: 'lexico',
    termos: [
      'gongfu-cha', 'chanoyu', 'chimarrao', 'terere', 'cold-brew', 'ocidental',
      'gaiwan', 'yixing', 'chasen', 'chawan', 'cuia', 'bombilha',
      'camellia-sinensis', 'terroir', 'oxidacao', 'fermentacao', 'sapecagem', 'orthodox', 'ctc',
      'umami', 'astringencia', 'body', 'finish', 'hui-gan',
    ],
  },
  {
    slug: 'como-se-faz-resumo', titulo: 'Como se faz o chá — resumo', subtitulo: 'Da colheita à defumação em 7 etapas',
    desc: 'A jornada da folha à xícara resumida em uma folha: as 7 etapas de processamento que definem cada tipo de chá.',
    tipo: 'processos',
  },
];

// Tabela de preparo (orientações gerais; temperaturas e tempos podem
// variar com a folha e o gosto). Base do guia 'preparo'.
var PREPARO_TABELA = [
  { tipo: 'Chá branco', temp: '75–85 °C', tempo: '3–5 min', proporcao: '2–3 g / 200 ml', reinfusoes: '2–3' },
  { tipo: 'Chá verde', temp: '70–80 °C', tempo: '1–3 min', proporcao: '2–3 g / 200 ml', reinfusoes: '2–4' },
  { tipo: 'Chá amarelo', temp: '75–85 °C', tempo: '2–3 min', proporcao: '2–3 g / 200 ml', reinfusoes: '2–3' },
  { tipo: 'Oolong', temp: '85–95 °C', tempo: '3–4 min (ocidental) · 20–40 s (gongfu)', proporcao: '5 g / 100 ml (gongfu)', reinfusoes: '4–6' },
  { tipo: 'Chá preto', temp: '90–100 °C', tempo: '3–5 min', proporcao: '2–3 g / 200 ml', reinfusoes: '1–2' },
  { tipo: 'Pu-erh', temp: '95–100 °C', tempo: 'lavar + 10–30 s por infusão', proporcao: '5 g / 100 ml', reinfusoes: '6+' },
  { tipo: 'Mate (chimarrão)', temp: '~70 °C (nunca ferver)', tempo: 'rodadas contínuas', proporcao: 'cuia cheia', reinfusoes: 'muitas' },
  { tipo: 'Rooibos', temp: '95–100 °C', tempo: '5–7 min', proporcao: '2–3 g / 200 ml', reinfusoes: '1–2' },
  { tipo: 'Herbais & tisanas', temp: '90–100 °C', tempo: '5–10 min', proporcao: '1 col. sopa / 200 ml', reinfusoes: '1–2' },
];

if (typeof window !== 'undefined') { window.BIBLIOTECA_GUIAS = BIBLIOTECA_GUIAS; window.PREPARO_TABELA = PREPARO_TABELA; }
if (typeof module !== 'undefined' && module.exports) { module.exports = { BIBLIOTECA_GUIAS, PREPARO_TABELA }; }
