// ============================================================
// ERVATÓRIO — Meus Pedidos (histórico do cliente)
// ============================================================
// Renderiza #page-pedidos com a lista de pedidos do usuário
// logado. Consulta orders + order_items via RLS (cada usuário
// vê apenas os próprios).
//
// Disparado por goPage('pedidos'). O container HTML vazio fica
// em index.html e este JS popula em runtime.
// ============================================================

const Pedidos = {
  cache: null,

  async render() {
    const root = document.getElementById('pedidosRoot');
    if (!root) return;

    if (!window.ervaria?.user) {
      root.innerHTML = this._templateLoginRequired();
      return;
    }

    root.innerHTML = this._templateLoading();
    try {
      const orders = await this._load();
      this.cache = orders;
      root.innerHTML = this._templateList(orders);
    } catch (e) {
      console.error('[pedidos] erro ao carregar', e);
      root.innerHTML = this._templateError(e.message || 'Falha desconhecida');
    }
  },

  async _load() {
    const { data: orders, error } = await ervaria.client
      .from('orders')
      .select('id, order_number, status, total_cents, currency, payment_method, payment_external_id, shipping_address, shipping_carrier, shipping_tracking_code, notes, created_at, paid_at, shipped_at, delivered_at')
      .eq('user_id', ervaria.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!orders?.length) return [];

    // Carrega itens em paralelo (1 query por pedido — aceitável pra até 50)
    const ids = orders.map((o) => o.id);
    const { data: items } = await ervaria.client
      .from('order_items')
      .select('order_id, product_id, product_name, product_unit, qty, unit_price_cents, line_total_cents')
      .in('order_id', ids);

    const itemsByOrder = new Map();
    (items || []).forEach((it) => {
      if (!itemsByOrder.has(it.order_id)) itemsByOrder.set(it.order_id, []);
      itemsByOrder.get(it.order_id).push(it);
    });

    // Solicitações de troca/devolução do usuário (RLS: só as próprias).
    // Guarda a mais recente por pedido para mostrar o status.
    const { data: returns } = await ervaria.client
      .from('order_returns')
      .select('id, order_id, tipo, status, created_at')
      .in('order_id', ids)
      .order('created_at', { ascending: false });
    const returnByOrder = new Map();
    (returns || []).forEach((r) => { if (!returnByOrder.has(r.order_id)) returnByOrder.set(r.order_id, r); });

    return orders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
      _return: returnByOrder.get(o.id) || null,
    }));
  },

  toggleExpand(orderId) {
    const el = document.getElementById('ped-' + orderId);
    if (!el) return;
    el.classList.toggle('expanded');
  },

  // Recompra: delega a lógica de carrinho ao app.js (dono de `cart`) e
  // dá feedback. Só re-adiciona itens ainda vendáveis (casados por dbId).
  recomprar(orderId) {
    const o = (this.cache || []).find((x) => x.id === orderId);
    if (!o || !o.items?.length) return;
    const r = typeof window.recomprarPedido === 'function'
      ? window.recomprarPedido(o.items)
      : { added: [], missing: [] };
    if (typeof toast !== 'function') return;
    if (!r.added.length) {
      toast('Estes produtos não estão mais disponíveis para compra.');
    } else if (r.missing.length) {
      toast(`${r.added.length} item(ns) no carrinho. Fora de catálogo: ${r.missing.slice(0, 2).join(', ')}${r.missing.length > 2 ? '…' : ''}`);
    } else {
      toast('Itens adicionados ao carrinho.');
    }
  },

  // Elegível para troca/devolução? Espelha a regra do servidor (que é a
  // autoridade): pago/enviado/entregue, dentro de 7 dias da entrega, e
  // sem solicitação ativa.
  _eligibleForReturn(o) {
    if (!['paid', 'processing', 'shipped', 'delivered'].includes(o.status)) return false;
    if (o.delivered_at && Date.now() > new Date(o.delivered_at).getTime() + 7 * 86400000) return false;
    if (o._return && ['solicitada', 'em_analise', 'aprovada'].includes(o._return.status)) return false;
    return true;
  },

  _templateReturn(o) {
    const r = o._return;
    if (r && ['solicitada', 'em_analise', 'aprovada', 'concluida'].includes(r.status)) {
      const tipo = r.tipo === 'troca' ? 'Troca' : 'Devolução';
      const cancelBtn = ['solicitada', 'em_analise'].includes(r.status)
        ? `<button class="cart-btn" style="width:100%;margin-top:8px;background:none;border:0.5px solid var(--faint);color:var(--muted)" onclick="event.stopPropagation();Pedidos.cancelReturn('${escHtml(r.id)}')">Cancelar solicitação</button>`
        : '';
      return `<div style="margin-top:14px;padding:10px 12px;background:rgba(200,168,75,.06);border:0.5px solid rgba(200,168,75,.2);border-radius:8px">
          <div style="font-size:.8rem;color:var(--cream)">${tipo}: <strong style="color:var(--gold2)">${escHtml(returnStatusLabel(r.status))}</strong></div>
          ${cancelBtn}
        </div>`;
    }
    if (!this._eligibleForReturn(o)) return '';
    const id = escHtml(o.id);
    return `
      <button class="cart-btn" style="width:100%;margin-top:8px;background:none;border:0.5px solid var(--faint);color:var(--muted)" onclick="event.stopPropagation();Pedidos.toggleReturnForm('${id}')">↩ Solicitar troca / devolução</button>
      <div id="ret-form-${id}" style="display:none;margin-top:8px;padding:10px 12px;background:var(--bg);border:0.5px solid var(--faint);border-radius:8px">
        <select id="ret-tipo-${id}" onclick="event.stopPropagation()" style="width:100%;margin-bottom:6px;padding:8px;background:var(--bg2);border:0.5px solid var(--faint);border-radius:6px;color:var(--cream);font-size:.82rem">
          <option value="devolucao">Devolução (reembolso)</option>
          <option value="troca">Troca</option>
        </select>
        <textarea id="ret-motivo-${id}" onclick="event.stopPropagation()" rows="2" placeholder="Motivo (mín. 5 caracteres)" style="width:100%;padding:8px;background:var(--bg2);border:0.5px solid var(--faint);border-radius:6px;color:var(--cream);font-size:.82rem;font-family:inherit"></textarea>
        <div id="ret-msg-${id}" style="font-size:.72rem;min-height:14px;margin:4px 0;color:var(--muted)"></div>
        <button class="cart-btn" style="width:100%" onclick="event.stopPropagation();Pedidos.submitReturn('${id}')">Enviar solicitação</button>
        <div style="font-size:.66rem;color:var(--muted);margin-top:6px">Prazo de 7 dias após a entrega (CDC). Analisaremos e retornaremos.</div>
      </div>`;
  },

  toggleReturnForm(orderId) {
    const el = document.getElementById('ret-form-' + orderId);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  async submitReturn(orderId) {
    const msg = document.getElementById('ret-msg-' + orderId);
    const tipo = document.getElementById('ret-tipo-' + orderId)?.value;
    const motivo = (document.getElementById('ret-motivo-' + orderId)?.value || '').trim();
    if (motivo.length < 5) { if (msg) { msg.style.color = '#e08080'; msg.textContent = 'Descreva o motivo (mín. 5 caracteres).'; } return; }
    if (msg) { msg.style.color = 'var(--muted)'; msg.textContent = 'Enviando...'; }
    try {
      const cfg = window.ERVATORIO_CONFIG;
      const { data: { session } } = await ervaria.client.auth.getSession();
      if (!session) throw new Error('Sessão expirada — faça login novamente.');
      const res = await fetch(`${cfg.FUNCTIONS_URL}/create-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'create', order_id: orderId, tipo, motivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar solicitação.');
      if (typeof toast === 'function') toast('Solicitação enviada. Vamos analisar e retornar.');
      this.render();
    } catch (e) {
      if (msg) { msg.style.color = '#e08080'; msg.textContent = e.message; }
    }
  },

  async cancelReturn(returnId) {
    if (!confirm('Cancelar esta solicitação de troca/devolução?')) return;
    try {
      const cfg = window.ERVATORIO_CONFIG;
      const { data: { session } } = await ervaria.client.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');
      const res = await fetch(`${cfg.FUNCTIONS_URL}/create-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'cancel', return_id: returnId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao cancelar.');
      if (typeof toast === 'function') toast('Solicitação cancelada.');
      this.render();
    } catch (e) {
      if (typeof toast === 'function') toast(e.message);
    }
  },

  // ── Templates ─────────────────────────────────────────────

  _templateLoading() {
    return `<div style="text-align:center;padding:3rem 1rem;color:var(--muted)">
      <div style="font-size:1.5rem;margin-bottom:.5rem">⏳</div>
      Carregando seus pedidos...
    </div>`;
  },

  _templateError(msg) {
    return `<div style="text-align:center;padding:3rem 1rem;color:#e08080">
      <div style="font-size:1.5rem;margin-bottom:.5rem">⚠</div>
      <div>Não foi possível carregar os pedidos.</div>
      <div style="color:var(--muted);font-size:.78rem;margin-top:.5rem">${escHtml(msg)}</div>
      <button class="cart-btn" style="margin-top:1rem" onclick="Pedidos.render()">Tentar novamente</button>
    </div>`;
  },

  _templateLoginRequired() {
    return `<div style="text-align:center;padding:3rem 1rem">
      <div style="font-size:1.5rem;margin-bottom:.5rem">🔐</div>
      <div style="color:var(--cream);margin-bottom:.5rem">Faça login para ver seus pedidos</div>
      <button class="cart-btn" style="margin-top:1rem" onclick="ervaria.showAuthModal()">Entrar</button>
    </div>`;
  },

  _templateEmpty() {
    return `<div style="text-align:center;padding:3rem 1rem">
      <div style="font-size:2rem;margin-bottom:.75rem">📦</div>
      <div style="color:var(--cream);font-size:1.1rem;margin-bottom:.5rem">Nenhum pedido ainda</div>
      <div style="color:var(--muted);font-size:.85rem;margin-bottom:1.5rem">Explore a loja e faça seu primeiro pedido</div>
      <button class="cart-btn" onclick="goPage('shop')">Ir para a Loja</button>
    </div>`;
  },

  _templateList(orders) {
    if (!orders.length) return this._templateEmpty();
    return `
      <div style="display:flex;flex-direction:column;gap:12px">
        ${orders.map((o) => this._templateCard(o)).join('')}
      </div>
    `;
  },

  _templateCard(o) {
    const badge = this._statusBadge(o.status);
    const itemsPreview = o.items.length === 1
      ? escHtml(o.items[0].product_name)
      : `${o.items.length} produtos`;
    const date = formatDate(o.created_at);
    const tracking = o.shipping_tracking_code
      ? `<div style="font-size:.72rem;color:var(--muted);margin-top:4px">Rastreio: <a href="${trackingUrl(o.shipping_tracking_code)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:var(--gold2)">${escHtml(o.shipping_tracking_code)} ↗</a>${o.shipping_carrier ? ' · ' + escHtml(o.shipping_carrier) : ''}</div>`
      : '';

    return `
      <div id="ped-${escHtml(o.id)}" class="pedido-card" style="background:var(--bg2);border:0.5px solid rgba(200,168,75,.15);border-radius:var(--r-md);padding:1rem 1.25rem;cursor:pointer" onclick="Pedidos.toggleExpand('${escHtml(o.id)}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <code style="font-size:.85rem;color:var(--gold2);font-family:inherit">${escHtml(o.order_number || o.id.slice(0, 8))}</code>
              ${badge}
            </div>
            <div style="font-size:.78rem;color:var(--muted);margin-top:4px">${date} · ${escHtml(itemsPreview)}</div>
            ${tracking}
          </div>
          <div style="text-align:right;white-space:nowrap">
            <div style="color:var(--gold2);font-size:1rem;font-weight:500">${formatBRL(o.total_cents)}</div>
            <div style="font-size:.68rem;color:var(--muted);margin-top:2px">▼ detalhes</div>
          </div>
        </div>

        <div class="pedido-details" style="display:none;margin-top:1rem;padding-top:1rem;border-top:0.5px solid var(--faint)">
          ${this._templateItems(o.items)}
          ${this._templateAddress(o.shipping_address)}
          ${this._templatePayment(o)}
          ${o.notes ? `<div style="margin-top:12px;font-size:.78rem;color:var(--muted)">Observações: ${escHtml(o.notes)}</div>` : ''}
          ${o.items.length ? `<button class="cart-btn" style="width:100%;margin-top:14px" onclick="event.stopPropagation();Pedidos.recomprar('${escHtml(o.id)}')">🛒 Comprar de novo</button>` : ''}
          ${this._templateReturn(o)}
        </div>
      </div>
    `;
  },

  _templateItems(items) {
    if (!items.length) return '';
    return `
      <div style="margin-bottom:12px">
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Itens</div>
        ${items.map((it) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:0.5px solid var(--faint);font-size:.85rem">
            <div>
              <div style="color:var(--cream)">${escHtml(it.product_name)}</div>
              <div style="color:var(--muted);font-size:.72rem">${it.qty} × ${escHtml(it.product_unit || '')} · ${formatBRL(it.unit_price_cents)} cada</div>
            </div>
            <div style="color:var(--gold2);white-space:nowrap">${formatBRL(it.line_total_cents)}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  _templateAddress(addr) {
    if (!addr) return '';
    return `
      <div style="margin-bottom:12px">
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Endereço de entrega</div>
        <div style="font-size:.82rem;color:var(--cream);line-height:1.5">
          ${escHtml(addr.name || '')}<br>
          ${escHtml(addr.street || '')}${addr.number ? ', ' + escHtml(addr.number) : ''}${addr.complement ? ' — ' + escHtml(addr.complement) : ''}<br>
          ${addr.neighborhood ? escHtml(addr.neighborhood) + '<br>' : ''}
          ${escHtml(addr.city || '')} - ${escHtml(addr.state || '')} · CEP ${escHtml(addr.zip || '')}
        </div>
      </div>
    `;
  },

  _templatePayment(o) {
    const method = o.payment_method ? mapPayMethod(o.payment_method) : null;
    const ref = o.payment_external_id && !o.payment_external_id.includes('-') ? o.payment_external_id : null;
    if (!method && !ref) return '';
    return `
      <div>
        <div style="font-size:.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Pagamento</div>
        <div style="font-size:.82rem;color:var(--cream)">
          ${method ? method : ''}${ref ? ` · <code style="color:var(--muted);font-size:.72rem">#${escHtml(ref)}</code>` : ''}
        </div>
      </div>
    `;
  },

  _statusBadge(status) {
    const styles = {
      pending:    { bg: 'rgba(212,168,90,.15)', fg: '#d4a85a', label: 'Aguardando pagamento' },
      paid:       { bg: 'rgba(80,180,100,.15)', fg: '#80c890', label: 'Pago' },
      processing: { bg: 'rgba(120,170,230,.15)', fg: '#8ac3ee', label: 'Preparando' },
      shipped:    { bg: 'rgba(120,170,230,.15)', fg: '#8ac3ee', label: 'Enviado' },
      delivered:  { bg: 'rgba(80,180,100,.2)', fg: '#80c890', label: 'Entregue' },
      cancelled:  { bg: 'rgba(220,120,120,.15)', fg: '#e08080', label: 'Cancelado' },
      refunded:   { bg: 'rgba(200,200,200,.15)', fg: '#c0c0c0', label: 'Reembolsado' },
      failed:     { bg: 'rgba(220,120,120,.15)', fg: '#e08080', label: 'Falha no pagamento' },
    };
    const s = styles[status] || styles.pending;
    return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${s.bg};color:${s.fg};font-size:.68rem;text-transform:uppercase;letter-spacing:1px">${s.label}</span>`;
  },
};

// ── Helpers ────────────────────────────────────────────────

// Link de rastreio. Os Correios são um SPA sem deep-link estável por
// código, e a transportadora varia (Correios, Jadlog, Melhor Envio...),
// então resolvemos o código por uma busca — clicável e sem link quebrado.
function trackingUrl(code) {
  return `https://www.google.com/search?q=${encodeURIComponent('rastreamento ' + (code || ''))}`;
}

function returnStatusLabel(status) {
  return {
    solicitada: 'Solicitada', em_analise: 'Em análise', aprovada: 'Aprovada',
    recusada: 'Recusada', concluida: 'Concluída', cancelada: 'Cancelada',
  }[status] || status;
}

function formatBRL(cents) {
  const n = Number(cents || 0) / 100;
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / (1000 * 60 * 60);
  if (diffH < 1) return 'há poucos minutos';
  if (diffH < 24) return `há ${Math.floor(diffH)}h`;
  if (diffH < 48) return 'ontem';
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD} dias`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function mapPayMethod(m) {
  const map = {
    account_money: 'Saldo Mercado Pago',
    credit_card: 'Cartão de crédito',
    debit_card: 'Cartão de débito',
    ticket: 'Boleto',
    bank_transfer: 'PIX',
    pix: 'PIX',
  };
  return map[m] || m;
}

function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Estilos do cartão (expansível) ─────────────────────────
(function () {
  if (document.getElementById('pedidosStyles')) return;
  const s = document.createElement('style');
  s.id = 'pedidosStyles';
  s.textContent = `
    .pedido-card { transition: background .2s }
    .pedido-card:hover { background: rgba(200,168,75,.03) }
    .pedido-card.expanded .pedido-details { display: block !important }
  `;
  document.head.appendChild(s);
})();

window.Pedidos = Pedidos;

// Hook no goPage: quando navegar para 'pedidos', renderiza.
// Usa requestAnimationFrame para esperar o <section> ficar visível
// (classe .on aplicada) antes de rodar a query.
(function () {
  if (typeof window.goPage !== 'function') {
    // goPage ainda não foi definido — envolvemos depois via DOMContentLoaded.
    document.addEventListener('DOMContentLoaded', wrapGoPage);
    return;
  }
  wrapGoPage();

  function wrapGoPage() {
    const orig = window.goPage;
    if (!orig || orig.__pedidosWrapped) return;
    window.goPage = function (id, btn, slug) {
      const r = orig.apply(this, arguments);
      if (id === 'pedidos') {
        requestAnimationFrame(() => Pedidos.render());
      }
      return r;
    };
    window.goPage.__pedidosWrapped = true;
  }
})();
