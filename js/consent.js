// ============================================================
// ERVATÓRIO — Consentimento de cookies (LGPD / Consent Mode v2)
// Onda 2.2 · backlog #6
// ============================================================
// Regra do projeto (CLAUDE.md): NENHUM script de tracking dispara
// antes do consentimento. Este módulo:
//   1. Define o estado padrão do Google Consent Mode v2 como
//      "denied" ANTES de qualquer tag (GTM/GA4 — Onda 3).
//   2. Mostra um banner acessível com categorias (necessários /
//      análise / marketing) e persiste a escolha.
//   3. Expõe window.__consent para os módulos de tracking:
//        __consent.allows('analytics') → boolean
//        __consent.onChange(cb)        → callback em mudanças
//        __consent.open()              → reabrir preferências
//   4. Escolha revogável a qualquer momento (link no rodapé).
// Sem dependências. Os cookies "necessários" (sessão, carrinho)
// não dependem de consentimento (LGPD: legítimo interesse /
// execução de contrato).
// ============================================================
(function () {
  'use strict';

  var STORAGE_KEY = 'erv_consent_v1';
  var state = null; // {analytics:bool, marketing:bool, ts:string}
  var listeners = [];

  // ── Consent Mode v2: default denied, antes de qualquer tag ──
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted', // necessários (carrinho, sessão)
    security_storage: 'granted',
    wait_for_update: 500,
  });

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') return null;
      return parsed;
    } catch (_) { return null; }
  }

  function save(analytics, marketing) {
    state = { analytics: !!analytics, marketing: !!marketing, ts: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* ok */ }
    gtag('consent', 'update', {
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: state.marketing ? 'granted' : 'denied',
      ad_user_data: state.marketing ? 'granted' : 'denied',
      ad_personalization: state.marketing ? 'granted' : 'denied',
    });
    listeners.forEach(function (cb) { try { cb(state); } catch (_) { /* ok */ } });
    hide();
  }

  // ── UI ──
  var el = null;
  var lastFocus = null;

  function css() {
    if (document.getElementById('ervConsentCss')) return;
    var s = document.createElement('style');
    s.id = 'ervConsentCss';
    s.textContent = [
      '#ervConsent{position:fixed;left:0;right:0;bottom:0;z-index:9998;background:#12251b;color:#f5ede0;',
      'border-top:2px solid #b8965a;padding:18px 20px;font-family:"Jost",system-ui,sans-serif;font-size:.85rem;line-height:1.55;',
      'box-shadow:0 -6px 30px rgba(0,0,0,.35)}',
      '#ervConsent .cwrap{max-width:1080px;margin:0 auto;display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between}',
      '#ervConsent p{margin:0;flex:1 1 340px}',
      '#ervConsent a{color:#d9b878;text-decoration:underline}',
      '#ervConsent .cbtns{display:flex;flex-wrap:wrap;gap:8px}',
      '#ervConsent button{font-family:inherit;font-size:.8rem;letter-spacing:.04em;border-radius:8px;padding:9px 16px;cursor:pointer;border:1px solid #b8965a}',
      '#ervConsent .acc{background:#b8965a;color:#12251b;font-weight:600}',
      '#ervConsent .rej{background:transparent;color:#f5ede0}',
      '#ervConsent .pref{background:transparent;color:#d9b878;border-color:transparent;text-decoration:underline}',
      '#ervConsent button:focus-visible{outline:2px solid #f5ede0;outline-offset:2px}',
      '#ervConsent .cats{display:none;width:100%;margin-top:6px;gap:16px;flex-wrap:wrap}',
      '#ervConsent.prefs .cats{display:flex}',
      '#ervConsent .cats label{display:flex;align-items:center;gap:7px;cursor:pointer}',
      '#ervConsent .cats input{accent-color:#b8965a;width:16px;height:16px}',
      '@media(max-width:640px){#ervConsent .cwrap{flex-direction:column;align-items:stretch}#ervConsent .cbtns{justify-content:stretch}#ervConsent button{flex:1}}',
    ].join('');
    document.head.appendChild(s);
  }

  function show(prefsMode) {
    css();
    if (!el) {
      el = document.createElement('div');
      el.id = 'ervConsent';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'false'); // banner não bloqueia a página
      el.setAttribute('aria-label', 'Preferências de cookies');
      el.innerHTML =
        '<div class="cwrap">' +
        '<p>Usamos cookies necessários ao funcionamento do site e, <strong>somente com o seu consentimento</strong>, cookies de análise e marketing. Detalhes na <a href="/privacidade.html">Política de Privacidade</a>.</p>' +
        '<div class="cats">' +
        '<label><input type="checkbox" checked disabled> Necessários (sempre ativos)</label>' +
        '<label><input type="checkbox" id="ervCatAnalytics"> Análise (métricas de uso)</label>' +
        '<label><input type="checkbox" id="ervCatMarketing"> Marketing (remarketing/pixels)</label>' +
        '</div>' +
        '<div class="cbtns">' +
        '<button type="button" class="pref" id="ervCPrefs" aria-expanded="false">Preferências</button>' +
        '<button type="button" class="rej" id="ervCReject">Recusar não essenciais</button>' +
        '<button type="button" class="acc" id="ervCAccept">Aceitar todos</button>' +
        '</div></div>';
      document.body.appendChild(el);
      document.getElementById('ervCAccept').addEventListener('click', function () { save(true, true); restoreFocus(); });
      document.getElementById('ervCReject').addEventListener('click', function () { save(false, false); restoreFocus(); });
      document.getElementById('ervCPrefs').addEventListener('click', function () {
        var prefs = el.classList.toggle('prefs');
        this.setAttribute('aria-expanded', String(prefs));
        this.textContent = prefs ? 'Salvar preferências' : 'Preferências';
        if (!prefs) { // segundo clique = salvar
          save(document.getElementById('ervCatAnalytics').checked,
               document.getElementById('ervCatMarketing').checked);
          this.textContent = 'Preferências';
          restoreFocus();
        }
      });
      el.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state) { hide(); restoreFocus(); } });
    }
    if (state) { // reabrindo: reflete escolha atual
      document.getElementById('ervCatAnalytics').checked = state.analytics;
      document.getElementById('ervCatMarketing').checked = state.marketing;
    }
    if (prefsMode) {
      el.classList.add('prefs');
      var pb = document.getElementById('ervCPrefs');
      pb.setAttribute('aria-expanded', 'true');
      pb.textContent = 'Salvar preferências';
    }
    lastFocus = document.activeElement;
    el.style.display = 'block';
    document.getElementById('ervCAccept').focus();
  }

  function hide() { if (el) el.style.display = 'none'; }
  function restoreFocus() { if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (_) {} } }

  // ── API pública ──
  window.__consent = {
    get: function () { return state ? { analytics: state.analytics, marketing: state.marketing } : null; },
    allows: function (cat) {
      if (cat === 'necessary') return true;
      return !!(state && state[cat]);
    },
    onChange: function (cb) { if (typeof cb === 'function') listeners.push(cb); },
    open: function () { show(true); },
  };

  // ── Boot ──
  function boot() {
    state = load();
    if (state) {
      // Reaplica a escolha persistida ao Consent Mode.
      gtag('consent', 'update', {
        analytics_storage: state.analytics ? 'granted' : 'denied',
        ad_storage: state.marketing ? 'granted' : 'denied',
        ad_user_data: state.marketing ? 'granted' : 'denied',
        ad_personalization: state.marketing ? 'granted' : 'denied',
      });
    } else {
      show(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
