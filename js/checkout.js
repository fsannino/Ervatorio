// ============================================================
// ERVATÓRIO — Frontend de checkout (Mercado Pago Checkout Pro)
// ============================================================
// Fluxo:
//   1. Usuário clica "Finalizar pedido →" no carrinho
//   2. Abre overlay com formulário de endereço
//   3. Submit chama POST /create-order → recebe order_id
//   4. Chama POST /create-payment-preference → recebe init_point
//   5. window.location = init_point  (vai pro MP)
//   6. MP redireciona de volta com ?checkout=success|failure|pending
//   7. Página exibe confirmação e limpa o carrinho se success
//
// Requisitos:
//   • Usuário autenticado (Supabase session). Caso contrário, abre o modal de login.
//   • window.cart, window.ervaria já carregados.
//   • Edge Functions create-order, create-payment-preference deployadas.
// ============================================================

// Lê o carrinho do localStorage (fonte canônica — app.js sincroniza a cada
// mutação). Evita depender da binding `let cart` que fica em script-scope.
function readCart() {
  try { return JSON.parse(localStorage.getItem('erb_cart') || '[]'); } catch (_) { return []; }
}
function writeCart(arr) {
  try { localStorage.setItem('erb_cart', JSON.stringify(arr)); } catch (_) {}
}

const Checkout = {
  injected: false,

  ensureInjected() {
    if (this.injected) return;
    const overlay = document.createElement('div');
    overlay.id = 'checkoutOverlay';
    overlay.className = 'cart-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) Checkout.close(); };
    overlay.innerHTML = `
      <div class="cart-panel" style="width:min(440px,100vw)">
        <button class="cart-close" onclick="Checkout.close()" aria-label="Fechar">✕</button>
        <div class="cart-title">Finalizar pedido</div>

        <form id="checkoutForm" onsubmit="event.preventDefault();Checkout.submit()">
          <div style="display:grid;gap:10px">
            <div>
              <label class="ck-label">Nome completo *</label>
              <input class="ck-input" id="ckName" required>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div>
                <label class="ck-label">CEP *</label>
                <input class="ck-input" id="ckZip" required maxlength="9" placeholder="00000-000" oninput="Checkout.maskZip(this)" onblur="Checkout.lookupCep()">
              </div>
              <div>
                <label class="ck-label">Telefone</label>
                <input class="ck-input" id="ckPhone" placeholder="(11) 99999-9999">
              </div>
            </div>
            <div>
              <label class="ck-label">Rua *</label>
              <input class="ck-input" id="ckStreet" required>
            </div>
            <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
              <div>
                <label class="ck-label">Número</label>
                <input class="ck-input" id="ckNumber">
              </div>
              <div>
                <label class="ck-label">Complemento</label>
                <input class="ck-input" id="ckComplement" placeholder="Apto, bloco...">
              </div>
            </div>
            <div>
              <label class="ck-label">Bairro</label>
              <input class="ck-input" id="ckNeighborhood">
            </div>
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px">
              <div>
                <label class="ck-label">Cidade *</label>
                <input class="ck-input" id="ckCity" required>
              </div>
              <div>
                <label class="ck-label">UF *</label>
                <input class="ck-input" id="ckState" required maxlength="2" style="text-transform:uppercase">
              </div>
            </div>
            <div>
              <label class="ck-label">Observações</label>
              <input class="ck-input" id="ckNotes" placeholder="Entregar após 18h, p.ex.">
            </div>
          </div>

          <div id="ckSummary" style="margin-top:1.25rem;padding:1rem;background:rgba(200,168,75,.06);border:1px solid rgba(200,168,75,.2);border-radius:8px;font-size:.85rem"></div>

          <div id="ckMsg" style="min-height:20px;margin-top:.75rem;font-size:.78rem;text-align:center"></div>

          <button type="submit" id="ckSubmitBtn" class="checkout-btn" style="margin-top:.5rem;width:100%">
            Pagar com Mercado Pago →
          </button>
          <div style="text-align:center;font-size:.7rem;color:var(--muted);margin-top:.5rem">
            Você será redirecionado para finalizar o pagamento
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    if (!document.getElementById('checkoutStyles')) {
      const s = document.createElement('style');
      s.id = 'checkoutStyles';
      s.textContent = `
        .ck-label{display:block;font-size:.72rem;color:var(--muted);margin-bottom:4px;font-family:'Jost',sans-serif}
        .ck-input{width:100%;padding:8px 10px;background:var(--bg);border:0.5px solid var(--faint);border-radius:6px;color:var(--cream);font-size:.85rem;font-family:'Jost',sans-serif}
        .ck-input:focus{outline:none;border-color:rgba(200,168,75,.5)}
        #ckSubmitBtn:disabled{opacity:.55;cursor:wait}
      `;
      document.head.appendChild(s);
    }
    this.injected = true;
  },

  async open() {
    const cfg = window.ERVATORIO_CONFIG;
    const paymentsBlocked = window.SITE_SETTINGS != null ? !window.SITE_SETTINGS.payments_enabled : (cfg && cfg.PAYMENTS_ENABLED === false);
    if (paymentsBlocked) {
      if (typeof toast === 'function') toast((cfg && cfg.PAYMENTS_DISABLED_MSG) || 'Pagamentos em manutenção');
      return;
    }
    const cart = readCart();
    if (!Array.isArray(cart) || cart.length === 0) {
      if (typeof toast === 'function') toast('Carrinho vazio');
      return;
    }
    // Fonte autoritativa: session do Supabase, não `ervaria.user` (que pode
    // estar dessincronizado se init ainda não rodou ou usuário está em guest).
    let session = null;
    try {
      const res = await window.ervaria?.client?.auth?.getSession();
      session = res?.data?.session;
    } catch (_) { /* offline/falha → trata como sem sessão */ }

    if (!session?.user) {
      if (typeof toast === 'function') toast('Faça login para finalizar a compra');
      window.ervaria?.showAuthModal?.();
      return;
    }
    // Cacheia na instância ervaria para evitar outras rotas falharem por dessincronia.
    if (window.ervaria && !window.ervaria.user) window.ervaria.user = session.user;

    this.ensureInjected();
    this.prefill();
    this.renderSummary();
    document.getElementById('checkoutOverlay').classList.add('on');
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.getElementById('checkoutOverlay')?.classList.remove('on');
    document.body.style.overflow = '';
  },

  // Pré-preenche o que conseguir do perfil já carregado.
  async prefill() {
    try {
      const { data: profile } = await ervaria.client
        .from('user_profiles')
        .select('display_name, phone, city, state')
        .eq('id', ervaria.user.id)
        .maybeSingle();
      if (profile?.display_name) document.getElementById('ckName').value = profile.display_name;
      if (profile?.phone) document.getElementById('ckPhone').value = profile.phone;
      if (profile?.city) document.getElementById('ckCity').value = profile.city;
      if (profile?.state) document.getElementById('ckState').value = (profile.state || '').slice(0, 2).toUpperCase();
    } catch (_) { /* ok */ }
  },

  renderSummary() {
    const cart = readCart();
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const lines = cart
      .map((c) => `<div style="display:flex;justify-content:space-between;color:var(--cream);font-size:.78rem;margin:2px 0">
        <span>${esc(c.name)} × ${c.qty}</span>
        <span>R$ ${(c.price * c.qty).toFixed(2)}</span>
      </div>`)
      .join('');
    document.getElementById('ckSummary').innerHTML = `
      ${lines}
      <div style="border-top:1px solid rgba(200,168,75,.2);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;color:var(--gold2);font-weight:500">
        <span>Total</span>
        <span>R$ ${subtotal.toFixed(2)}</span>
      </div>
      <div style="font-size:.7rem;color:var(--muted);margin-top:4px">Frete calculado depois (atualmente grátis durante o piloto)</div>
    `;
  },

  maskZip(input) {
    let v = input.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    input.value = v;
  },

  async lookupCep() {
    const raw = document.getElementById('ckZip').value.replace(/\D/g, '');
    if (raw.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const d = await r.json();
      if (d.erro) return;
      if (d.logradouro && !document.getElementById('ckStreet').value) document.getElementById('ckStreet').value = d.logradouro;
      if (d.bairro && !document.getElementById('ckNeighborhood').value) document.getElementById('ckNeighborhood').value = d.bairro;
      if (d.localidade && !document.getElementById('ckCity').value) document.getElementById('ckCity').value = d.localidade;
      if (d.uf && !document.getElementById('ckState').value) document.getElementById('ckState').value = d.uf;
    } catch (_) { /* offline */ }
  },

  collectAddress() {
    return {
      name: document.getElementById('ckName').value.trim(),
      phone: document.getElementById('ckPhone').value.trim(),
      zip: document.getElementById('ckZip').value.trim(),
      street: document.getElementById('ckStreet').value.trim(),
      number: document.getElementById('ckNumber').value.trim(),
      complement: document.getElementById('ckComplement').value.trim(),
      neighborhood: document.getElementById('ckNeighborhood').value.trim(),
      city: document.getElementById('ckCity').value.trim(),
      state: document.getElementById('ckState').value.trim().toUpperCase(),
      country: 'Brasil',
    };
  },

  async submit() {
    const msg = document.getElementById('ckMsg');
    const btn = document.getElementById('ckSubmitBtn');
    const addr = this.collectAddress();

    if (!addr.name || !addr.zip || !addr.street || !addr.city || !addr.state) {
      msg.style.color = '#e08080';
      msg.textContent = 'Preencha os campos obrigatórios (*).';
      return;
    }

    btn.disabled = true;
    msg.style.color = 'var(--muted)';
    msg.textContent = 'Criando seu pedido...';

    try {
      const cfg = window.ERVATORIO_CONFIG;
      const { data: { session } } = await ervaria.client.auth.getSession();
      if (!session) throw new Error('Sessão expirada — faça login novamente');

      // Passo 1: criar pedido (servidor recalcula preços)
      const cart = readCart();
      // Só itens com dbId (UUID Supabase) são vendáveis pelo servidor.
      // Produtos do catálogo hardcoded sem match em admin_products ficam
      // de fora — alertamos o usuário se nada sobrar.
      const sellable = cart.filter((c) => typeof c.dbId === 'string' && c.dbId.length === 36);
      if (sellable.length === 0) {
        throw new Error('Nenhum produto do carrinho está no catálogo oficial. Peça ao admin para rodar o seed de produtos.');
      }
      if (sellable.length < cart.length) {
        const dropped = cart.length - sellable.length;
        console.warn(`[checkout] ${dropped} item(ns) do carrinho sem dbId — ignorados.`);
      }
      const orderRes = await fetch(`${cfg.FUNCTIONS_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          items: sellable.map((c) => ({
            product_id: c.dbId,
            qty: c.qty,
          })),
          shipping_address: addr,
          notes: document.getElementById('ckNotes').value.trim() || null,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Falha ao criar pedido');

      msg.textContent = 'Redirecionando para o Mercado Pago...';

      // Passo 2: criar preferência MP
      const prefRes = await fetch(`${cfg.FUNCTIONS_URL}/create-payment-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ order_id: orderData.order_id }),
      });
      const prefData = await prefRes.json();
      if (!prefRes.ok) throw new Error(prefData.error || 'Falha ao iniciar pagamento');

      // Guarda referência local pro retorno
      try {
        sessionStorage.setItem('erb_pending_order', JSON.stringify({
          order_id: orderData.order_id,
          preference_id: prefData.preference_id,
          ts: Date.now(),
        }));
      } catch (_) {}

      // Passo 3: redireciona para checkout MP
      window.location.href = prefData.init_point;
    } catch (e) {
      btn.disabled = false;
      msg.style.color = '#e08080';
      msg.textContent = e.message;
    }
  },

  // Chamado no DOMContentLoaded para tratar retorno do MP
  handleReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('checkout');
    if (!status) return;

    const orderNum = params.get('order');
    let pending = null;
    try { pending = JSON.parse(sessionStorage.getItem('erb_pending_order') || 'null'); } catch (_) {}

    const labels = {
      success: { title: 'Pedido confirmado!', body: 'Recebemos seu pagamento. Você receberá atualizações por email.', color: '#80c890' },
      pending: { title: 'Pagamento pendente', body: 'Estamos aguardando a confirmação do Mercado Pago. Pode levar alguns minutos para PIX e até 2 dias úteis para boleto.', color: '#d4a85a' },
      failure: { title: 'Pagamento não concluído', body: 'O pagamento não foi finalizado. Você pode tentar de novo no carrinho.', color: '#e08080' },
    };
    const info = labels[status] || labels.failure;

    // Limpa carrinho se sucesso (MP confirmou pelo back_url, mas a verdade
    // definitiva vem do webhook). Atualiza UI se as funções existirem.
    if (status === 'success') {
      try { typeof clearCart === 'function' ? clearCart() : writeCart([]); } catch (_) { writeCart([]); }
    }

    setTimeout(() => {
      const o = document.createElement('div');
      o.className = 'cart-overlay on';
      o.onclick = (e) => { if (e.target === o) o.remove(); };
      o.innerHTML = `
        <div class="cart-panel" style="width:min(420px,100vw);text-align:center;padding:2rem">
          <div style="font-size:2.5rem;margin-bottom:.5rem">${status === 'success' ? '✓' : status === 'pending' ? '◷' : '⚠'}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:${info.color};margin-bottom:.5rem">${info.title}</div>
          <div style="color:var(--cream);font-size:.85rem;line-height:1.5;margin-bottom:1.5rem">${info.body}</div>
          ${orderNum ? `<div style="font-size:.78rem;color:var(--muted);margin-bottom:1.5rem">Pedido: <code style="color:var(--gold2)">${esc(orderNum)}</code></div>` : ''}
          <button class="checkout-btn" style="width:100%" onclick="this.closest('.cart-overlay').remove();history.replaceState(null,'',location.pathname)">Continuar</button>
        </div>
      `;
      document.body.appendChild(o);
      try { sessionStorage.removeItem('erb_pending_order'); } catch (_) {}
    }, 400);
  },
};

window.Checkout = Checkout;
window.openCheckout = () => Checkout.open();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Checkout.handleReturn());
} else {
  Checkout.handleReturn();
}

// `esc` é uma função global declarada em ervaria.js; garantimos fallback
// para o caso de checkout.js carregar antes (improvável, mas defensivo).
if (typeof window.esc !== 'function') {
  window.esc = function (s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };
}
