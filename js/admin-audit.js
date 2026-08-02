// ============================================================
// AUDITORIA — leitura da trilha de ações do painel
// ============================================================
// Escrita: trigger no banco (migration 20260802030000_admin_audit_log).
// Aqui é só leitura. A RLS já garante que só admin enxerga; esta tela
// não tem nenhuma ação de escrita, de propósito — log que se edita não
// é log.
//
// Requer /js/admin.js carregado antes (usa `sb`, `esc` e `admToast`).

const AUD_PAGE_SIZE = 50;
let audPage = 0;
let audTable = '';

// Rótulos legíveis por tabela. Tabela nova sem rótulo cai no próprio
// nome, então nada some da tela por falta de tradução.
const AUD_TABLE_LABEL = {
  admin_blends: 'Blends',
  admin_herb_fichas: 'Fichas',
  admin_herbs: 'Chás',
  admin_news: 'Notícias',
  admin_products: 'Produtos',
  admin_recommendation_vectors: 'Recomendação',
  admin_suppliers: 'Fornecedores',
  chazerias: 'Chazerias',
  orders: 'Pedidos',
  order_items: 'Itens de pedido',
  order_returns: 'Devoluções',
  order_status_history: 'Status de pedido',
  product_reviews: 'Avaliações',
  site_settings: 'Configurações',
  user_profiles: 'Privilégio de usuário'
};

const AUD_ACTION = {
  INSERT: { label: 'Criou', cls: 'green' },
  UPDATE: { label: 'Alterou', cls: 'blue' },
  DELETE: { label: 'Excluiu', cls: 'red' }
};

async function loadAudit(reset) {
  if (reset) audPage = 0;

  let q = sb
    .from('admin_audit_log')
    .select('*', { count: 'exact' })
    .order('at', { ascending: false })
    .range(audPage * AUD_PAGE_SIZE, audPage * AUD_PAGE_SIZE + AUD_PAGE_SIZE - 1);

  if (audTable) q = q.eq('table_name', audTable);

  const { data, count, error } = await q;
  if (error) {
    document.getElementById('auditBody').innerHTML =
      `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#e08080">Erro ao carregar: ${esc(error.message)}</td></tr>`;
    return;
  }
  renderAudit(data || [], count || 0);
}

function audFilter(table) {
  audTable = table;
  document.querySelectorAll('[data-aud-filter]').forEach((b) => {
    b.classList.toggle('primary', b.dataset.audFilter === table);
  });
  loadAudit(true);
}

function audNav(delta) {
  audPage = Math.max(0, audPage + delta);
  loadAudit(false);
}

// Resume o `before`/`after` numa linha só. O detalhe completo abre no
// modal — a tabela precisa continuar escaneável.
function audSummary(row) {
  const src = row.after || row.before;
  if (!src || typeof src !== 'object') return '—';
  const keys = Object.keys(src);
  if (!keys.length) return '—';
  const shown = keys.slice(0, 3).join(', ');
  return keys.length > 3 ? `${shown} +${keys.length - 3}` : shown;
}

function audWhen(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return '';
  }
}

function renderAudit(list, total) {
  const tbody = document.getElementById('auditBody');

  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum registro para este filtro.</td></tr>';
  } else {
    tbody.innerHTML = list
      .map((r) => {
        const act = AUD_ACTION[r.action] || { label: r.action, cls: 'blue' };
        const tbl = AUD_TABLE_LABEL[r.table_name] || r.table_name;
        return `<tr>
        <td style="font-size:.72rem;color:var(--adm-muted);white-space:nowrap">${audWhen(r.at)}</td>
        <td>${r.actor_name ? esc(r.actor_name) : '<span style="color:var(--adm-muted)">sistema</span>'}</td>
        <td><span class="adm-badge ${act.cls}">${act.label}</span> ${esc(tbl)}</td>
        <td style="font-size:.72rem;color:var(--adm-muted)">${esc(audSummary(r))}</td>
        <td><button type="button" class="adm-btn" onclick="openAuditDetail(${r.id})">Ver</button></td>
      </tr>`;
      })
      .join('');
  }

  const from = total === 0 ? 0 : audPage * AUD_PAGE_SIZE + 1;
  const to = Math.min((audPage + 1) * AUD_PAGE_SIZE, total);
  const info = document.getElementById('auditPageInfo');
  if (info) {
    info.textContent =
      total === 0 ? 'Nenhum registro' : `Mostrando ${from}–${to} de ${total}`;
  }
  const prev = document.getElementById('auditPrev');
  const next = document.getElementById('auditNext');
  if (prev) prev.disabled = audPage === 0;
  if (next) next.disabled = to >= total;

  window.__audRows = list;
}

function openAuditDetail(id) {
  const r = (window.__audRows || []).find((x) => x.id === id);
  if (!r) return;

  const bloco = (titulo, obj) =>
    obj && Object.keys(obj).length
      ? `<div style="margin-top:12px">
           <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--adm-gold);margin-bottom:6px">${titulo}</div>
           <pre style="background:var(--adm-bg3);border:1px solid var(--adm-faint);border-radius:8px;padding:10px;font-size:.72rem;overflow:auto;max-height:220px;margin:0">${esc(JSON.stringify(obj, null, 2))}</pre>
         </div>`
      : '';

  const ov = document.createElement('div');
  ov.id = 'audDetOverlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Detalhe do registro de auditoria');
  ov.style.cssText =
    'position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;background:rgba(10,16,13,.88);padding:20px';
  ov.innerHTML = `
    <div style="background:var(--adm-bg2);border:1px solid var(--adm-faint);border-radius:12px;padding:1.5rem;max-width:640px;width:100%;max-height:85vh;overflow:auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <div style="font-size:1.05rem;color:var(--adm-gold2)">${esc(AUD_ACTION[r.action]?.label || r.action)} · ${esc(AUD_TABLE_LABEL[r.table_name] || r.table_name)}</div>
          <div style="font-size:.72rem;color:var(--adm-muted);margin-top:3px">
            ${audWhen(r.at)} · ${r.actor_name ? esc(r.actor_name) : 'sistema'}${r.row_id ? ` · linha ${esc(String(r.row_id).slice(0, 8))}` : ''}
          </div>
        </div>
        <button type="button" class="adm-btn" onclick="closeAuditDetail()" aria-label="Fechar">Fechar</button>
      </div>
      ${bloco('Antes', r.before)}
      ${bloco('Depois', r.after)}
      <p style="font-size:.68rem;color:var(--adm-muted);margin-top:14px;line-height:1.5">
        Colunas com dado pessoal aparecem como <code>[redigido]</code>: a trilha
        registra o que mudou e quem mudou, não o conteúdo pessoal.
      </p>
    </div>`;
  document.body.appendChild(ov);

  ov.addEventListener('click', (e) => {
    if (e.target === ov) closeAuditDetail();
  });
  document.addEventListener('keydown', audEscHandler);
  ov.querySelector('button')?.focus();
}

function audEscHandler(e) {
  if (e.key === 'Escape') closeAuditDetail();
}

function closeAuditDetail() {
  document.getElementById('audDetOverlay')?.remove();
  document.removeEventListener('keydown', audEscHandler);
}
