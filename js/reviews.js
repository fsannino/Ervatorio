// ============================================================
// ERVATÓRIO — Avaliações de produto (Onda 7.2 · backlog #47/#48)
// ============================================================
// Renderiza média + lista de reviews no detalhe do produto e o
// formulário de avaliação. A REGRA (só quem comprou avalia) é
// imposta pelo RLS (migration 20260717070000) — o cliente apenas
// reflete o erro amigavelmente. Depende de: ervaria.client
// (supabase-js), esc() e toast() globais.
// ============================================================
window.Reviews = {
  _cache: {}, // product dbId -> {avg, count, rows}

  stars(avg) {
    const full = Math.round(avg || 0);
    return '★★★★★'.slice(0, full).padEnd(5, '☆');
  },

  async fetch(dbId) {
    if (!dbId || !window.ervaria?.client) return null;
    if (this._cache[dbId]) return this._cache[dbId];
    try {
      const { data, error } = await ervaria.client
        .from('product_reviews')
        .select('id, rating, title, body, display_name, created_at, user_id')
        .eq('product_id', dbId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      const rows = data || [];
      const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
      const out = { avg, count: rows.length, rows };
      this._cache[dbId] = out;
      return out;
    } catch (_) { return null; }
  },

  // Renderiza no container do detalhe (chamado por openMktDetail).
  async renderInto(containerId, product) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const dbId = product.dbId;
    if (!dbId) { el.innerHTML = ''; return; }
    const data = await this.fetch(dbId);
    if (!data) { el.innerHTML = ''; return; }

    const uid = window.ervaria?.user?.id || null;
    const mine = uid ? data.rows.find((r) => r.user_id === uid) : null;

    let html = `<div style="border-top:0.5px solid var(--faint);margin-top:1.25rem;padding-top:1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:.6rem">
        <div style="font-family:'Jost',sans-serif;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Avaliações</div>
        <div style="font-size:.85rem;color:var(--gold2)">${data.count ? `${this.stars(data.avg)} <span style="color:var(--muted)">${data.avg.toFixed(1)} · ${data.count}</span>` : '<span style="color:var(--muted)">Seja o primeiro a avaliar</span>'}</div>
      </div>`;

    for (const r of data.rows.slice(0, 5)) {
      html += `<div style="padding:.5rem 0;border-bottom:0.5px dashed var(--faint)">
        <div style="font-size:.78rem;color:var(--gold2)">${this.stars(r.rating)} <span style="color:var(--cream2)">${esc(r.title || '')}</span></div>
        ${r.body ? `<div style="font-size:.78rem;color:var(--cream2);line-height:1.5;margin-top:2px">${esc(r.body)}</div>` : ''}
        <div style="font-size:.65rem;color:var(--muted);margin-top:2px">${esc(r.display_name || 'Cliente')} · ${new Date(r.created_at).toLocaleDateString('pt-BR')}</div>
      </div>`;
    }

    if (uid && !mine) {
      html += `<button onclick="Reviews.openForm('${dbId}', ${product.id})" style="margin-top:.7rem;background:none;border:0.5px solid rgba(200,168,75,.4);border-radius:8px;color:var(--gold2);padding:8px 14px;font-size:.75rem;font-family:'Jost',sans-serif;cursor:pointer">✍ Avaliar este produto</button>
        <div style="font-size:.62rem;color:var(--muted);margin-top:4px">Disponível para quem já comprou este produto.</div>`;
    } else if (!uid) {
      html += `<div style="font-size:.68rem;color:var(--muted);margin-top:.6rem">Entre na sua conta para avaliar (compras verificadas).</div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  },

  openForm(dbId, mktId) {
    const old = document.getElementById('rvForm');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'rvForm';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:20px';
    wrap.innerHTML = `
      <div style="background:var(--bg2,#131a16);border:1px solid rgba(200,168,75,.3);border-radius:14px;max-width:420px;width:100%;padding:1.4rem">
        <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:var(--cream);margin-bottom:.8rem">Avaliar produto</div>
        <div id="rvStars" style="font-size:1.6rem;letter-spacing:6px;cursor:pointer;color:var(--gold2);margin-bottom:.7rem" aria-label="Nota de 1 a 5">☆☆☆☆☆</div>
        <input id="rvTitle" maxlength="120" placeholder="Título (opcional)" style="width:100%;padding:8px 10px;background:var(--bg,#0d1210);border:0.5px solid var(--faint,#2a332c);border-radius:6px;color:var(--cream);font-size:.85rem;margin-bottom:.5rem">
        <textarea id="rvBody" maxlength="2000" rows="4" placeholder="Conte como foi sua experiência…" style="width:100%;padding:8px 10px;background:var(--bg,#0d1210);border:0.5px solid var(--faint,#2a332c);border-radius:6px;color:var(--cream);font-size:.85rem;resize:vertical"></textarea>
        <div id="rvMsg" style="min-height:18px;font-size:.72rem;margin-top:6px"></div>
        <div style="display:flex;gap:8px;margin-top:.6rem">
          <button onclick="document.getElementById('rvForm').remove()" style="flex:1;background:none;border:0.5px solid var(--faint,#2a332c);border-radius:8px;color:var(--muted);padding:10px;cursor:pointer">Cancelar</button>
          <button id="rvSubmit" onclick="Reviews.submit('${dbId}', ${mktId})" style="flex:1;background:var(--gold,#c8a84b);border:none;border-radius:8px;color:#1c1608;font-weight:700;padding:10px;cursor:pointer">Publicar</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) wrap.remove(); });
    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') wrap.remove(); });

    this._rating = 0;
    const starsEl = document.getElementById('rvStars');
    const paint = (n) => { starsEl.textContent = '★★★★★'.slice(0, n).padEnd(5, '☆'); };
    starsEl.addEventListener('mousemove', (e) => {
      const rect = starsEl.getBoundingClientRect();
      paint(Math.max(1, Math.min(5, Math.ceil(((e.clientX - rect.left) / rect.width) * 5))));
    });
    starsEl.addEventListener('mouseleave', () => paint(this._rating));
    starsEl.addEventListener('click', (e) => {
      const rect = starsEl.getBoundingClientRect();
      this._rating = Math.max(1, Math.min(5, Math.ceil(((e.clientX - rect.left) / rect.width) * 5)));
      paint(this._rating);
    });
  },

  async submit(dbId, mktId) {
    const msg = document.getElementById('rvMsg');
    if (!this._rating) { msg.style.color = '#e08080'; msg.textContent = 'Toque nas estrelas para dar a nota.'; return; }
    const btn = document.getElementById('rvSubmit');
    btn.disabled = true;
    msg.style.color = 'var(--gold2)'; msg.textContent = 'Publicando...';
    try {
      const name = window.ervaria?.user?.user_metadata?.full_name
        || window.ervaria?.user?.email?.split('@')[0] || 'Cliente';
      const { error } = await ervaria.client.from('product_reviews').insert({
        product_id: dbId,
        user_id: ervaria.user.id,
        rating: this._rating,
        title: document.getElementById('rvTitle').value.trim() || null,
        body: document.getElementById('rvBody').value.trim() || null,
        display_name: name,
      });
      if (error) {
        // 42501 = RLS: não comprou o produto (ou duplicada por UNIQUE).
        const friendly = /row-level security|42501/i.test(error.message)
          ? 'A avaliação é liberada após a compra deste produto ser confirmada.'
          : /duplicate|unique/i.test(error.message)
            ? 'Você já avaliou este produto.'
            : error.message;
        throw new Error(friendly);
      }
      delete this._cache[dbId];
      document.getElementById('rvForm').remove();
      if (typeof toast === 'function') toast('Avaliação publicada — obrigado! 🌿');
      this.renderInto('mktReviews', (typeof MKT_PRODUCTS !== 'undefined' && MKT_PRODUCTS.find((p) => p.id === mktId)) || { dbId });
    } catch (e) {
      btn.disabled = false;
      msg.style.color = '#e08080';
      msg.textContent = e.message;
    }
  },
};
