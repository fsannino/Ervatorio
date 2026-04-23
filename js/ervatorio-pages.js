// js/ervatorio-pages.js
// Rendering functions for Ervatorio v1.1 pages
// Depends on: ErvatorioData (ervatorio-data.js), esc() (app.js)

(function() {
  // Reusable HTML helpers (same patterns as renderFichaModal in app.js)
  function safeEsc(s) { return typeof esc === 'function' ? esc(s) : String(s || ''); }
  function listMaybe(v) { return Array.isArray(v) ? v.map(function(x) { return '<li>' + safeEsc(x) + '</li>'; }).join('') : (v ? '<li>' + safeEsc(v) + '</li>' : ''); }
  function paragraphs(v) { return Array.isArray(v) ? v.map(function(x) { return '<p>' + safeEsc(x) + '</p>'; }).join('') : (v ? '<p>' + safeEsc(v) + '</p>' : ''); }
  function dlList(arr, keyA, keyB) {
    keyA = keyA || 'label'; keyB = keyB || 'texto';
    return Array.isArray(arr) ? arr.map(function(x) { return '<div class="ficha-kv"><dt>' + safeEsc(x[keyA]) + '</dt><dd>' + safeEsc(x[keyB]) + '</dd></div>'; }).join('') : '';
  }

  // ================================================================
  // #ervatorio — Indice do catalogo v1.1
  // ================================================================
  window.renderIndiceCatalogo = async function() {
    var el = document.getElementById('ervatorioGrid');
    if (!el) return;
    el.innerHTML = '<div class="ev-loading">Carregando catalogo...</div>';
    try {
      var fichas = await ErvatorioData.getAllFichas();
      if (!fichas || !fichas.length) {
        el.innerHTML = '<p class="ev-empty">Nenhuma ficha disponivel.</p>';
        return;
      }
      el.innerHTML = fichas.map(function(row) {
        var f = row.ficha || {};
        var slug = row.slug || '';
        var nome = f.nome_popular || slug;
        var cientifico = f.nome_cientifico || row.herb_latin_name || '';
        var tagline = f.tagline || '';
        var eixo = (f.regulacao && f.regulacao.eixo_botanico_tpc) || '';
        return '<div class="herb-card ev-ficha-card" onclick="goPage(\'ficha\',null,\'' + safeEsc(slug) + '\')">' +
          '<div class="ev-card-nome">' + safeEsc(nome) + '</div>' +
          '<div class="ev-card-latin"><em>' + safeEsc(cientifico) + '</em></div>' +
          (tagline ? '<div class="ev-card-tagline">' + safeEsc(tagline) + '</div>' : '') +
          (eixo ? '<div class="ev-card-eixo">' + safeEsc(eixo) + '</div>' : '') +
          '</div>';
      }).join('');
    } catch (e) {
      el.innerHTML = '<p class="ev-error">Erro ao carregar catalogo.</p>';
      console.error('[Ervatorio] Indice:', e);
    }
  };

  // ================================================================
  // #ficha/:slug — Ficha individual (full page)
  // ================================================================
  window.renderFichaPage = async function(slug) {
    var container = document.getElementById('fichaPageContent');
    if (!container) return;
    container.innerHTML = '<div class="ev-loading">Carregando ficha...</div>';
    try {
      var results = await Promise.all([
        ErvatorioData.getFichaBySlug(slug),
        ErvatorioData.getProdutosByFichaSlug(slug),
        ErvatorioData.getBlendsByFichaSlug(slug)
      ]);
      var fichaData = results[0];
      var produtos = results[1] || [];
      var blends = results[2] || [];

      if (!fichaData || !fichaData.ficha) {
        container.innerHTML = '<p class="ev-error">Ficha "' + safeEsc(slug) + '" nao encontrada.</p>';
        return;
      }
      var f = fichaData.ficha;
      container.innerHTML = buildFichaHTML(f, produtos, blends, slug);
    } catch (e) {
      container.innerHTML = '<p class="ev-error">Erro ao carregar ficha.</p>';
      console.error('[Ervatorio] Ficha:', e);
    }
  };

  function buildFichaHTML(f, produtos, blends, slug) {
    var id = f.identificacao || {};
    var car = f.caracterizacao || {};
    var pr = f.preparo || {};
    var ps = f.perfil_sensorial || {};
    var ac = f.acoes_e_seguranca || {};
    var cu = f.cultura || {};
    var rg = f.regulacao || {};
    var mk = f.marketplace || {};
    var gustativo = Array.isArray(ps.gustativo) ? ps.gustativo : [];
    var trig = Array.isArray(ps.trigeminal) ? ps.trigeminal : [];
    var evid = Array.isArray(ac.evidencia) ? ac.evidencia : [];

    var html = '<article class="ficha-page-article">';

    // Header
    html += '<header class="ficha-hero">' +
      '<h1 class="ficha-title">' + safeEsc(f.nome_popular || '') + '</h1>' +
      '<div class="ficha-latin">' + safeEsc(f.nome_cientifico || '') + '</div>' +
      (f.tagline ? '<blockquote class="ficha-tagline">' + safeEsc(f.tagline) + '</blockquote>' : '') +
      (Array.isArray(f.destaques) && f.destaques.length ?
        '<ul class="ficha-destaques">' + f.destaques.map(function(d) { return '<li><strong>' + safeEsc(d.label) + '</strong> ' + safeEsc(d.texto) + '</li>'; }).join('') + '</ul>' : '') +
      '</header>';

    // Alerta critico
    if (ac.alerta_critico) {
      html += '<section class="ficha-alert" role="alert">' +
        '<div class="ficha-alert-title">' + safeEsc(ac.alerta_critico.titulo || 'Alerta critico') + '</div>' +
        (ac.alerta_critico.titulo2 ? '<div class="ficha-alert-sub">' + safeEsc(ac.alerta_critico.titulo2) + '</div>' : '') +
        '<div class="ficha-alert-body">' + safeEsc(ac.alerta_critico.corpo || '') + '</div>' +
        '</section>';
    }

    // Identificacao
    html += '<section class="ficha-section"><h2>Identificacao</h2><dl class="ficha-dl">' +
      (id.nome_cientifico ? '<div class="ficha-kv"><dt>Nome cientifico</dt><dd><em>' + safeEsc(id.nome_cientifico) + '</em></dd></div>' : '') +
      (id.familia_botanica ? '<div class="ficha-kv"><dt>Familia</dt><dd>' + safeEsc(id.familia_botanica) + '</dd></div>' : '') +
      (id.tipo_botanico ? '<div class="ficha-kv"><dt>Tipo</dt><dd>' + safeEsc(id.tipo_botanico) + '</dd></div>' : '') +
      (id.parte_usada ? '<div class="ficha-kv"><dt>Parte usada</dt><dd>' + safeEsc(id.parte_usada) + '</dd></div>' : '') +
      '</dl>' +
      (Array.isArray(id.sinonimos) && id.sinonimos.length ? '<div class="ficha-sub">Sinonimos</div><ul class="ficha-bullets">' + listMaybe(id.sinonimos) + '</ul>' : '') +
      '</section>';

    // Caracterizacao
    html += '<section class="ficha-section"><h2>Caracterizacao</h2><dl class="ficha-dl">' +
      (car.sabor_dominante ? '<div class="ficha-kv"><dt>Sabor</dt><dd>' + safeEsc(car.sabor_dominante) + '</dd></div>' : '') +
      (car.aroma ? '<div class="ficha-kv"><dt>Aroma</dt><dd>' + safeEsc(car.aroma) + '</dd></div>' : '') +
      (car.cor_da_infusao ? '<div class="ficha-kv"><dt>Cor da infusao</dt><dd>' + safeEsc(car.cor_da_infusao) + '</dd></div>' : '') +
      (car.intensidade ? '<div class="ficha-kv"><dt>Intensidade</dt><dd>' + safeEsc(car.intensidade) + '</dd></div>' : '') +
      (car.notas ? '<div class="ficha-kv"><dt>Notas</dt><dd>' + safeEsc(car.notas) + '</dd></div>' : '') +
      (car.bioma_de_origem ? '<div class="ficha-kv"><dt>Bioma</dt><dd>' + safeEsc(car.bioma_de_origem) + '</dd></div>' : '') +
      '</dl>' +
      (Array.isArray(car.distribuicao_geografica) && car.distribuicao_geografica.length ? '<div class="ficha-sub">Distribuicao geografica</div><ul class="ficha-bullets">' + listMaybe(car.distribuicao_geografica) + '</ul>' : '') +
      '</section>';

    // Preparo
    html += '<section class="ficha-section"><h2>Preparo</h2><dl class="ficha-dl">' +
      (pr.temperatura_ideal ? '<div class="ficha-kv"><dt>Temperatura</dt><dd>' + safeEsc(pr.temperatura_ideal) + '</dd></div>' : '') +
      (pr.tempo_de_infusao ? '<div class="ficha-kv"><dt>Tempo de infusao</dt><dd>' + safeEsc(pr.tempo_de_infusao) + '</dd></div>' : '') +
      (pr.quantidade ? '<div class="ficha-kv"><dt>Quantidade</dt><dd>' + safeEsc(pr.quantidade) + '</dd></div>' : '') +
      (pr.metodo ? '<div class="ficha-kv"><dt>Metodo</dt><dd>' + safeEsc(pr.metodo) + '</dd></div>' : '') +
      (pr.reinfusoes ? '<div class="ficha-kv"><dt>Reinfusoes</dt><dd>' + safeEsc(pr.reinfusoes) + '</dd></div>' : '') +
      (pr.melhor_momento ? '<div class="ficha-kv"><dt>Melhor momento</dt><dd>' + safeEsc(pr.melhor_momento) + '</dd></div>' : '') +
      (pr.combina_com ? '<div class="ficha-kv"><dt>Combina com</dt><dd>' + safeEsc(pr.combina_com) + '</dd></div>' : '') +
      '</dl>' +
      (f.preparo_ritual ? '<div class="ficha-sub">' + safeEsc(f.preparo_ritual.titulo || 'Preparo cerimonial') + '</div><p>' + safeEsc(f.preparo_ritual.texto || '') + '</p>' : '') +
      '</section>';

    // Usos topicos
    if (f.usos_topicos) {
      html += '<section class="ficha-section"><h2>Usos topicos</h2>' +
        (f.usos_topicos.evidencia ? '<p><strong>Evidencia:</strong> ' + safeEsc(f.usos_topicos.evidencia) + '</p>' : '') +
        (Array.isArray(f.usos_topicos.aplicacoes) ? f.usos_topicos.aplicacoes.map(function(a) { return '<div class="ficha-sub">' + safeEsc(a.titulo || '') + '</div><p>' + safeEsc(a.texto || '') + '</p>'; }).join('') : '') +
        (f.usos_topicos.contraindicacoes ? '<p class="ficha-warn-inline">' + safeEsc(f.usos_topicos.contraindicacoes) + '</p>' : '') +
        '</section>';
    }

    // Acoes e seguranca
    html += '<section class="ficha-section"><h2>Acoes e seguranca</h2>' +
      (Array.isArray(ac.acoes_principais) && ac.acoes_principais.length ? '<div class="ficha-sub">Acoes principais</div><ul class="ficha-bullets">' + listMaybe(ac.acoes_principais) + '</ul>' : '') +
      (Array.isArray(ac.componentes_ativos) && ac.componentes_ativos.length ? '<div class="ficha-sub">Componentes ativos</div><dl class="ficha-dl">' + dlList(ac.componentes_ativos) + '</dl>' : '') +
      (evid.length ? '<div class="ficha-sub">Indicacoes com evidencia</div><table class="ficha-table"><caption>Evidencia clinica e populacional</caption><thead><tr><th>Indicacao</th><th>Evidencia</th><th>Populacao</th></tr></thead><tbody>' + evid.map(function(e) { return '<tr><td>' + safeEsc(e.indicacao) + '</td><td>' + safeEsc(e.evidencia) + '</td><td>' + safeEsc(e.populacao) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
      (Array.isArray(ac.contraindicacoes) && ac.contraindicacoes.length ? '<div class="ficha-sub">Contraindicacoes</div><ul class="ficha-bullets">' + listMaybe(ac.contraindicacoes) + '</ul>' : '') +
      (Array.isArray(ac.interacoes) && ac.interacoes.length ? '<div class="ficha-sub">Interacoes</div><dl class="ficha-dl">' + dlList(ac.interacoes) + '</dl>' : '') +
      (ac.efeitos_adversos ? '<div class="ficha-sub">Efeitos adversos</div><p>' + safeEsc(ac.efeitos_adversos) + '</p>' : '') +
      (ac.dose_maxima ? '<div class="ficha-sub">Dose maxima</div><p>' + safeEsc(ac.dose_maxima) + '</p>' : '') +
      (Array.isArray(ac.fontes) && ac.fontes.length ? '<div class="ficha-sub">Fontes</div><ul class="ficha-bullets ficha-sources">' + listMaybe(ac.fontes) + '</ul>' : '') +
      '</section>';

    // Perfil sensorial
    html += '<section class="ficha-section"><h2>Perfil sensorial</h2>' +
      (gustativo.length ? '<table class="ficha-table"><caption>Perfil gustativo</caption><thead><tr><th>Dimensao</th><th>Intensidade</th><th>Observacao</th></tr></thead><tbody>' + gustativo.map(function(g) { return '<tr><td>' + safeEsc(g.dimensao) + '</td><td>' + safeEsc(g.intensidade) + '</td><td>' + safeEsc(g.observacao) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
      (ps.olfativo_familia ? '<div class="ficha-sub">Olfativo — ' + safeEsc(ps.olfativo_familia) + '</div>' : '') +
      (Array.isArray(ps.olfativo_descritores) && ps.olfativo_descritores.length ? '<ul class="ficha-bullets">' + listMaybe(ps.olfativo_descritores) + '</ul>' : '') +
      (trig.length ? '<table class="ficha-table"><caption>Perfil trigeminal</caption><thead><tr><th>Receptor</th><th>Ativacao</th><th>Molecula</th></tr></thead><tbody>' + trig.map(function(t) { return '<tr><td>' + safeEsc(t.receptor) + '</td><td>' + safeEsc(t.ativacao) + '</td><td>' + safeEsc(t.molecula) + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
      (ps.tatil ? '<div class="ficha-sub">Tatil</div><p>' + safeEsc(ps.tatil) + '</p>' : '') +
      (ps.descricao_integrada ? '<blockquote class="ficha-pullquote">' + safeEsc(ps.descricao_integrada) + '</blockquote>' : '') +
      '</section>';

    // Cultura
    html += '<section class="ficha-section"><h2>Cultura</h2>' +
      (cu.historia ? '<div class="ficha-sub">Historia</div>' + paragraphs(cu.historia) : '') +
      (cu.cerimonial ? '<div class="ficha-sub">Cerimonial</div><p>' + safeEsc(cu.cerimonial) + '</p>' : '') +
      (cu.brasil ? '<div class="ficha-sub">No Brasil</div>' + paragraphs(cu.brasil) : '') +
      (cu.curiosidade ? '<blockquote class="ficha-pullquote">' + safeEsc(cu.curiosidade) + '</blockquote>' : '') +
      '</section>';

    // Regulacao
    html += '<section class="ficha-section"><h2>Regulacao e origem</h2><dl class="ficha-dl">' +
      (rg.eixo_botanico_tpc ? '<div class="ficha-kv"><dt>Eixo botanico</dt><dd>' + safeEsc(rg.eixo_botanico_tpc) + '</dd></div>' : '') +
      (rg.status_anvisa ? '<div class="ficha-kv"><dt>ANVISA</dt><dd>' + (Array.isArray(rg.status_anvisa) ? rg.status_anvisa.map(safeEsc).join(' ') : safeEsc(rg.status_anvisa)) + '</dd></div>' : '') +
      (rg.status_ema ? '<div class="ficha-kv"><dt>EMA</dt><dd>' + safeEsc(rg.status_ema) + '</dd></div>' : '') +
      (rg.status_fda ? '<div class="ficha-kv"><dt>FDA</dt><dd>' + safeEsc(rg.status_fda) + '</dd></div>' : '') +
      (rg.certificacao_organica ? '<div class="ficha-kv"><dt>Certificacao organica</dt><dd>' + (Array.isArray(rg.certificacao_organica) ? rg.certificacao_organica.map(safeEsc).join(' ') : safeEsc(rg.certificacao_organica)) + '</dd></div>' : '') +
      (rg.sazonalidade ? '<div class="ficha-kv"><dt>Sazonalidade</dt><dd>' + (Array.isArray(rg.sazonalidade) ? rg.sazonalidade.map(safeEsc).join(' ') : safeEsc(rg.sazonalidade)) + '</dd></div>' : '') +
      '</dl></section>';

    // Marketplace (da ficha)
    if (mk && (mk.fornecedores || mk.faixa_de_preco || mk.formatos)) {
      html += '<section class="ficha-section ficha-section-mute"><h2>Marketplace</h2><dl class="ficha-dl">' +
        (mk.disponivel_a_venda ? '<div class="ficha-kv"><dt>Disponivel</dt><dd>' + safeEsc(mk.disponivel_a_venda) + '</dd></div>' : '') +
        (mk.fornecedores ? '<div class="ficha-kv"><dt>Fornecedores</dt><dd>' + safeEsc(mk.fornecedores) + '</dd></div>' : '') +
        (mk.faixa_de_preco ? '<div class="ficha-kv"><dt>Faixa de preco</dt><dd>' + (Array.isArray(mk.faixa_de_preco) ? mk.faixa_de_preco.map(safeEsc).join(' ') : safeEsc(mk.faixa_de_preco)) + '</dd></div>' : '') +
        (mk.formatos ? '<div class="ficha-kv"><dt>Formatos</dt><dd>' + safeEsc(mk.formatos) + '</dd></div>' : '') +
        '</dl></section>';
    }

    // Onde comprar (produtos do Supabase)
    if (produtos.length > 0) {
      html += '<section class="ficha-section"><h2>Onde comprar</h2><div class="ev-produtos-grid">';
      produtos.forEach(function(p) {
        html += '<div class="ev-produto-card">' +
          '<div class="ev-produto-nome">' + safeEsc(p.name || p.nome || '') + '</div>' +
          (p.brand ? '<div class="ev-produto-marca">' + safeEsc(p.brand) + '</div>' : '') +
          (p.certificacoes ? '<div class="ev-produto-cert">' + safeEsc(p.certificacoes) + '</div>' : '') +
          (p.origem_geografica ? '<div class="ev-produto-origem">' + safeEsc(p.origem_geografica) + '</div>' : '') +
          (p.price ? '<div class="ev-produto-preco">R$ ' + safeEsc(String(p.price)) + '</div>' : '') +
          '</div>';
      });
      html += '</div></section>';
    }

    // Em receitas (blends)
    if (blends.length > 0) {
      html += '<section class="ficha-section"><h2>Em receitas</h2><div class="ev-blends-list">';
      blends.forEach(function(b) {
        html += '<div class="ev-blend-link" onclick="goPage(\'blend\',null,\'' + safeEsc(b.slug || '') + '\')">' +
          '<span class="ev-blend-nome">' + safeEsc(b.nome || b.slug) + '</span>' +
          (b.proposito ? '<span class="ev-blend-prop"> — ' + safeEsc(b.proposito) + '</span>' : '') +
          '</div>';
      });
      html += '</div></section>';
    }

    // Footer
    html += '<footer class="ficha-foot"><span>Ervatorio v1.1 · ' + safeEsc(f.nome_popular || '') + '</span></footer>';
    html += '</article>';
    return html;
  }

  // ================================================================
  // #blends — Biblioteca de Blends
  // ================================================================
  window.renderBibliotecaBlends = async function() {
    var el = document.getElementById('blendsGrid');
    if (!el) return;
    el.innerHTML = '<div class="ev-loading">Carregando blends...</div>';
    try {
      var blends = await ErvatorioData.getAllBlends();
      if (!blends || !blends.length) {
        el.innerHTML = '<p class="ev-empty">Nenhum blend disponivel.</p>';
        return;
      }
      el.innerHTML = blends.map(function(b) {
        var slug = b.slug || '';
        var nome = b.nome || slug;
        var proposito = b.proposito || '';
        var ervas = Array.isArray(b.ervas_referenciadas) ? b.ervas_referenciadas : [];
        return '<div class="herb-card ev-blend-card" onclick="goPage(\'blend\',null,\'' + safeEsc(slug) + '\')">' +
          '<div class="ev-card-nome">' + safeEsc(nome) + '</div>' +
          (proposito ? '<div class="ev-card-tagline">' + safeEsc(proposito) + '</div>' : '') +
          (ervas.length ? '<div class="ev-card-ervas">' + ervas.map(function(e) { return '<span class="ev-erva-tag">' + safeEsc(e) + '</span>'; }).join(' ') + '</div>' : '') +
          '</div>';
      }).join('');
    } catch (e) {
      el.innerHTML = '<p class="ev-error">Erro ao carregar blends.</p>';
      console.error('[Ervatorio] Blends:', e);
    }
  };

  // ================================================================
  // #blend/:slug — Blend individual
  // ================================================================
  window.renderBlendPage = async function(slug) {
    var container = document.getElementById('blendPageContent');
    if (!container) return;
    container.innerHTML = '<div class="ev-loading">Carregando blend...</div>';
    try {
      var blend = await ErvatorioData.getBlendBySlug(slug);
      if (!blend) {
        container.innerHTML = '<p class="ev-error">Blend "' + safeEsc(slug) + '" nao encontrado.</p>';
        return;
      }
      var ervas = Array.isArray(blend.ervas_referenciadas) ? blend.ervas_referenciadas : [];
      var html = '<article class="ficha-page-article">';
      html += '<header class="ficha-hero">' +
        '<h1 class="ficha-title">' + safeEsc(blend.nome || slug) + '</h1>' +
        (blend.proposito ? '<blockquote class="ficha-tagline">' + safeEsc(blend.proposito) + '</blockquote>' : '') +
        '</header>';

      // Conteudo markdown (renderizado como texto por enquanto)
      if (blend.conteudo_markdown) {
        html += '<section class="ficha-section"><h2>Receita</h2>' +
          '<div class="ev-blend-content">' + renderSimpleMarkdown(blend.conteudo_markdown) + '</div>' +
          '</section>';
      }

      // Ingredientes/instrucoes JSONB
      if (blend.ingredientes && Array.isArray(blend.ingredientes)) {
        html += '<section class="ficha-section"><h2>Ingredientes</h2><ul class="ficha-bullets">';
        blend.ingredientes.forEach(function(ing) {
          html += '<li>' + safeEsc(typeof ing === 'string' ? ing : (ing.nome || '') + (ing.quantidade ? ' — ' + ing.quantidade : '')) + '</li>';
        });
        html += '</ul></section>';
      }

      if (blend.modo_preparo) {
        html += '<section class="ficha-section"><h2>Modo de preparo</h2>' +
          '<div class="ev-blend-content">' + renderSimpleMarkdown(String(blend.modo_preparo)) + '</div>' +
          '</section>';
      }

      // Ervas referenciadas como links
      if (ervas.length) {
        html += '<section class="ficha-section"><h2>Ervas neste blend</h2><div class="ev-blends-list">';
        ervas.forEach(function(slug_erva) {
          html += '<div class="ev-blend-link" onclick="goPage(\'ficha\',null,\'' + safeEsc(slug_erva) + '\')">' +
            '<span class="ev-blend-nome">' + safeEsc(slug_erva) + '</span>' +
            '<span class="ev-blend-prop"> Ver ficha →</span>' +
            '</div>';
        });
        html += '</div></section>';
      }

      html += '<footer class="ficha-foot"><span>Ervatorio v1.1 · Blend</span></footer>';
      html += '</article>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<p class="ev-error">Erro ao carregar blend.</p>';
      console.error('[Ervatorio] Blend:', e);
    }
  };

  // Simple markdown-like renderer (bold, italic, line breaks, lists)
  function renderSimpleMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  // ================================================================
  // #roda-funcional — Roda dos Chas v1.1 (vetores agrupados por sistema)
  // ================================================================

  // Mapeamento de vetor -> categoria terapêutica. Ordem importa: o
  // primeiro match vence. Vetores sem match caem em 'Outros'.
  var VETOR_CATEGORIAS = [
    { id: 'digestivo',  label: 'Digestivo',          icon: '🫕',
      rx: /^(antidisp|carminat|colagogo|coler[ée]t|hepatoprot|hepatoativ|antiulcer|antiespasm|eup[eé]pt|aperiente|protetor da mucosa)/i },
    { id: 'respiratorio', label: 'Respiratório',     icon: '🌬',
      rx: /^(expector|broncodil|antituss|antiastm|descong|antial[eé]rg)/i },
    { id: 'nervoso',    label: 'Sistema Nervoso',    icon: '🧠',
      rx: /^(ansiol|sedat|hipno|calmant|antidepr|nootr|adaptog|indutor de sono|estimulante do SNC)/i },
    { id: 'cardiovascular', label: 'Cardiovascular', icon: '❤️',
      rx: /^(anti-?hipert|hipolipem|cardiop|vasodil|vasocon|venoton|antiagreg|hipotens)/i },
    { id: 'urinario',   label: 'Urinário & Renal',   icon: '💧',
      rx: /^(diur[eé]t|litol[ií]t|antiss[eé]ptico urin|nefroprot)/i },
    { id: 'topico',     label: 'Pele & Tópico',      icon: '🌿',
      rx: /(t[oó]pico|cicatriz|anti-?hemorr|dermatol[oó]gic|antiss[eé]ptico)/i },
    { id: 'metabolico', label: 'Metabólico',         icon: '🔥',
      rx: /^(termog|hipogli|hipoglicem|lipol[ií]t|redu[cç][aã]o de peso|coadjuvante.*peso|modulador.*glic)/i },
    { id: 'antiinflam', label: 'Anti-inflamatório',  icon: '🩹',
      rx: /^(anti-?inflamat)/i },
    { id: 'imuno',      label: 'Imune & Antimicrobiano', icon: '🛡',
      rx: /^(antimicrob|antif[uú]ng|antiviral|antibacter|imunomodul)/i },
    { id: 'geral',      label: 'Tônico & Antioxidante', icon: '✨',
      rx: /^(antioxidante|t[oô]nico|analg[eé]sico|afrodis|sudor[ií]fero|febr[ií]fugo|hemost)/i },
  ];

  function classificarVetor(v) {
    var s = String(v || '').trim();
    for (var i = 0; i < VETOR_CATEGORIAS.length; i++) {
      if (VETOR_CATEGORIAS[i].rx.test(s)) return VETOR_CATEGORIAS[i].id;
    }
    return 'outros';
  }

  function agruparVetores(vetores) {
    var grupos = {};
    VETOR_CATEGORIAS.forEach(function(c) { grupos[c.id] = []; });
    grupos.outros = [];
    vetores.forEach(function(v) { grupos[classificarVetor(v)].push(v); });
    return grupos;
  }

  // Toggle collapse/expand de uma subdivisão.
  window.toggleRodaFuncCat = function(id) {
    var el = document.getElementById('rfcat-' + id);
    if (!el) return;
    el.classList.toggle('collapsed');
  };

  window.renderRodaFuncional = async function() {
    var form = document.getElementById('rodaFuncForm');
    var results = document.getElementById('rodaFuncResults');
    if (!form || !results) return;

    form.innerHTML = '<div class="ev-loading">Carregando vetores...</div>';
    try {
      var vetores = await ErvatorioData.getVetoresDisponiveis();
      var grupos = agruparVetores(vetores);
      var html = '<div class="ev-roda-vetores">' +
        '<div class="ficha-sub" style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<span>Selecione os vetores desejados</span>' +
          '<span id="rfCount" class="rf-count">0 selecionados</span>' +
        '</div>';

      // Renderiza cada categoria que tem pelo menos 1 vetor.
      VETOR_CATEGORIAS.concat([{ id: 'outros', label: 'Outros', icon: '🌱' }]).forEach(function(c) {
        var arr = grupos[c.id];
        if (!arr || !arr.length) return;
        html += '<div class="rf-cat" id="rfcat-' + c.id + '">' +
          '<button type="button" class="rf-cat-head" onclick="toggleRodaFuncCat(\'' + c.id + '\')">' +
            '<span class="rf-cat-icon">' + c.icon + '</span>' +
            '<span class="rf-cat-label">' + safeEsc(c.label) + '</span>' +
            '<span class="rf-cat-count">' + arr.length + '</span>' +
            '<span class="rf-cat-chevron">▾</span>' +
          '</button>' +
          '<div class="rf-cat-body ev-checkbox-grid">';
        arr.forEach(function(v) {
          html += '<label class="ev-checkbox">' +
            '<input type="checkbox" name="vetor" value="' + safeEsc(v) + '" onchange="atualizarContagemVetores()"> ' +
            safeEsc(v) +
          '</label>';
        });
        html += '</div></div>';
      });
      html += '</div>';

      html += '<div class="ev-roda-restricoes"><div class="ficha-sub">Restrições</div><div class="ev-checkbox-grid">' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfGestante"> Gestante</label>' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfLactante"> Lactante</label>' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfCrianca"> Criança (&lt; 12 anos)</label>' +
        '<label class="ev-checkbox"><input type="checkbox" id="rfAlerta"> Evitar alertas críticos</label>' +
        '</div></div>';

      html += '<button class="ev-roda-btn" onclick="executarRecomendacao()">Recomendar</button>';
      form.innerHTML = html;
      results.innerHTML = '<p class="ev-muted">Selecione vetores e clique em Recomendar.</p>';
    } catch (e) {
      form.innerHTML = '<p class="ev-error">Erro ao carregar vetores.</p>';
      console.error('[Ervatorio] Roda funcional:', e);
    }
  };

  // Atualiza o contador global de vetores selecionados no cabeçalho.
  window.atualizarContagemVetores = function() {
    var el = document.getElementById('rfCount');
    if (!el) return;
    var n = document.querySelectorAll('#rodaFuncForm input[name="vetor"]:checked').length;
    el.textContent = n + (n === 1 ? ' selecionado' : ' selecionados');
  };

  // Aliases esperados pelo diagnóstico de produção e pelo hash handler.
  // Os nomes canônicos (renderIndiceCatalogo / renderBibliotecaBlends) permanecem
  // para compatibilidade com goPage() em app.js.
  window.renderErvatorio = window.renderIndiceCatalogo;
  window.renderBlends = window.renderBibliotecaBlends;

  window.executarRecomendacao = async function() {
    var results = document.getElementById('rodaFuncResults');
    if (!results) return;

    var checked = document.querySelectorAll('#rodaFuncForm input[name="vetor"]:checked');
    var vetores = [];
    checked.forEach(function(cb) { vetores.push(cb.value); });
    if (!vetores.length) {
      results.innerHTML = '<p class="ev-muted">Selecione pelo menos um vetor.</p>';
      return;
    }

    var restricoes = {
      gestante: document.getElementById('rfGestante') && document.getElementById('rfGestante').checked,
      lactante: document.getElementById('rfLactante') && document.getElementById('rfLactante').checked,
      crianca: document.getElementById('rfCrianca') && document.getElementById('rfCrianca').checked,
      evitar_alertas: document.getElementById('rfAlerta') && document.getElementById('rfAlerta').checked,
      limite: 5
    };

    results.innerHTML = '<div class="ev-loading">Calculando recomendacoes...</div>';
    try {
      var recs = await ErvatorioData.recomendar(vetores, restricoes);
      if (!recs || !recs.length) {
        results.innerHTML = '<p class="ev-empty">Nenhuma recomendacao encontrada para esses criterios.</p>';
        return;
      }
      var html = '<div class="ficha-sub">Top ' + recs.length + ' recomendacoes</div><div class="ev-roda-results">';
      recs.forEach(function(r, i) {
        var hasAlerta = r.tem_alerta_critico || r.alerta_critico;
        html += '<div class="ev-rec-card' + (hasAlerta ? ' ev-rec-alerta' : '') + '" onclick="goPage(\'ficha\',null,\'' + safeEsc(r.slug || '') + '\')">' +
          '<div class="ev-rec-rank">' + (i + 1) + '</div>' +
          '<div class="ev-rec-info">' +
          '<div class="ev-rec-nome">' + safeEsc(r.nome_popular || r.slug || '') + '</div>' +
          (r.tagline ? '<div class="ev-rec-tagline">' + safeEsc(r.tagline) + '</div>' : '') +
          (r.score !== undefined ? '<div class="ev-rec-score">Score: ' + Number(r.score).toFixed(1) + '</div>' : '') +
          (hasAlerta ? '<div class="ev-rec-alert-badge">Alerta critico</div>' : '') +
          '</div>' +
          '</div>';
      });
      html += '</div>';
      results.innerHTML = html;
    } catch (e) {
      results.innerHTML = '<p class="ev-error">Erro na recomendacao.</p>';
      console.error('[Ervatorio] Recomendacao:', e);
    }
  };
})();
