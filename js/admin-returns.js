// ============================================================
// ADMIN — Devoluções (Onda 8.2)
// ============================================================
// Lista as solicitações de troca/devolução (order_returns) e deixa o
// admin aprovar/recusar/concluir + anotar. Usa a policy RLS
// returns_admin_all (admin lê e atualiza direto pelo cliente).
// Depende de `sb`, `admToast`, `esc` (globais de admin.js).
// Carregado por showSection('returns').
// ============================================================

let allReturns = [];

const RET_STATUS = {
  solicitada: { label: 'Solicitada', cls: 'gold' },
  em_analise: { label: 'Em análise', cls: 'gold' },
  aprovada:   { label: 'Aprovada',   cls: 'green' },
  recusada:   { label: 'Recusada',   cls: 'red' },
  concluida:  { label: 'Concluída',  cls: 'green' },
  cancelada:  { label: 'Cancelada',  cls: 'red' },
};
function retStatusLabel(s) { return (RET_STATUS[s] || {}).label || s; }
function retStatusBadge(s) { return `<span class="adm-badge ${(RET_STATUS[s] || { cls: 'gold' }).cls}">${retStatusLabel(s)}</span>`; }
function fmtRetDate(iso) { try { return new Date(iso).toLocaleDateString('pt-BR'); } catch (_) { return ''; } }

async function loadReturns() {
  const filter = document.getElementById('retStatusFilter')?.value || '';
  let q = sb.from('order_returns')
    .select('id, order_id, user_id, tipo, motivo, status, admin_notes, created_at, orders(order_number)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (filter) q = q.eq('status', filter);
  const { data, error } = await q;
  const body = document.getElementById('returnsBody');
  if (error) {
    admToast('Erro: ' + error.message);
    if (body) body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--adm-red)">${esc(error.message)}</td></tr>`;
    return;
  }
  allReturns = data || [];

  // Nome/e-mail do cliente (admin lê user_profiles via profiles_admin_read).
  const ids = [...new Set(allReturns.map((r) => r.user_id))];
  const byId = new Map();
  if (ids.length) {
    const { data: profs } = await sb.from('user_profiles').select('id, email, display_name').in('id', ids);
    (profs || []).forEach((p) => byId.set(p.id, p));
  }
  allReturns.forEach((r) => {
    const p = byId.get(r.user_id);
    r._cliente = p ? (p.display_name || p.email || r.user_id.slice(0, 8)) : r.user_id.slice(0, 8);
    r._email = p?.email || '';
  });
  renderReturns(allReturns);
}

function renderReturns(list) {
  const body = document.getElementById('returnsBody');
  if (!body) return;
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--adm-muted)">Nenhuma solicitação.</td></tr>`;
    return;
  }
  body.innerHTML = list.map((r) => `
    <tr>
      <td><code>${esc(r.orders?.order_number || r.order_id.slice(0, 8))}</code></td>
      <td>${esc(r._cliente)}${r._email ? `<div style="font-size:.7rem;color:var(--adm-muted)">${esc(r._email)}</div>` : ''}</td>
      <td>${r.tipo === 'troca' ? 'Troca' : 'Devolução'}</td>
      <td>${retStatusBadge(r.status)}</td>
      <td style="font-size:.78rem;color:var(--adm-muted)">${fmtRetDate(r.created_at)}</td>
      <td style="max-width:240px;font-size:.8rem">${esc((r.motivo || '').slice(0, 120))}${(r.motivo || '').length > 120 ? '…' : ''}</td>
      <td><button class="adm-btn" onclick="openReturnDetail('${esc(r.id)}')">Gerenciar</button></td>
    </tr>`).join('');
}

function openReturnDetail(id) {
  const r = allReturns.find((x) => x.id === id);
  if (!r) return;
  const opts = ['solicitada', 'em_analise', 'aprovada', 'recusada', 'concluida', 'cancelada']
    .map((s) => `<option value="${s}"${s === r.status ? ' selected' : ''}>${retStatusLabel(s)}</option>`).join('');
  const ov = document.createElement('div');
  ov.id = 'retDetOverlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.style.cssText = 'position:fixed;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;background:rgba(10,16,13,.85);padding:20px';
  ov.onclick = (e) => { if (e.target === ov) closeReturnDetail(); };
  ov.innerHTML = `
    <div style="max-width:460px;width:100%;background:var(--adm-bg2);border:1px solid var(--adm-faint);border-radius:12px;padding:22px">
      <div style="font-size:1.1rem;color:var(--adm-gold2);margin-bottom:8px">Solicitação — ${r.tipo === 'troca' ? 'Troca' : 'Devolução'}</div>
      <div style="font-size:.82rem;color:var(--adm-muted);margin-bottom:2px">Pedido <code>${esc(r.orders?.order_number || r.order_id.slice(0, 8))}</code> · ${esc(r._cliente)}${r._email ? ' · ' + esc(r._email) : ''}</div>
      <div style="font-size:.85rem;margin:10px 0;padding:10px;background:var(--adm-bg);border-radius:8px">${esc(r.motivo || '')}</div>
      <label class="adm-form-label">Status</label>
      <select id="retDetStatus" class="adm-form-input" style="margin-bottom:10px">${opts}</select>
      <label class="adm-form-label">Notas internas</label>
      <textarea id="retDetNotes" class="adm-form-input" rows="2" placeholder="Ex.: etiqueta enviada, estorno feito no painel MP...">${esc(r.admin_notes || '')}</textarea>
      <div id="retDetMsg" style="min-height:16px;font-size:.75rem;margin:6px 0"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
        <button class="adm-btn" onclick="closeReturnDetail()">Fechar</button>
        <button class="adm-btn primary" onclick="saveReturnDetail('${esc(r.id)}')">Salvar</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
}

function closeReturnDetail() { document.getElementById('retDetOverlay')?.remove(); }

async function saveReturnDetail(id) {
  const status = document.getElementById('retDetStatus').value;
  const admin_notes = document.getElementById('retDetNotes').value.trim() || null;
  const { error } = await sb.from('order_returns').update({ status, admin_notes }).eq('id', id);
  if (error) {
    const m = document.getElementById('retDetMsg');
    if (m) { m.style.color = '#e08080'; m.textContent = error.message; }
    return;
  }
  admToast('Solicitação atualizada');
  closeReturnDetail();
  loadReturns();
}
