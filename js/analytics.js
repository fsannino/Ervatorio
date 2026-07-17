// ============================================================
// ERVATÓRIO — Medição (GTM/GA4 + Clarity + Meta Pixel)
// Onda 3.1/3.2 · backlog #7, #8, #9, #79
// ============================================================
// Regras:
//   • NADA carrega sem consentimento (gancho window.__consent da
//     Onda 2.2 + Consent Mode v2 já com default denied).
//   • IDs nunca hardcoded: vêm de ERVATORIO_CONFIG.ANALYTICS
//     (GTM_ID, GA4_ID, CLARITY_ID, META_PIXEL_ID). Vazio = no-op.
//   • Analytics (GTM/GA4/Clarity) exige consentimento 'analytics';
//     Meta Pixel exige 'marketing'.
//   • API de eventos: ervTrack(nome, params) — usada pelos hooks
//     de e-commerce (view_item, add_to_cart, begin_checkout,
//     purchase) em app.js/checkout.js. Eventos são bufferizados
//     no dataLayer mesmo antes do load; o GTM/GA4 processa ao carregar.
// ============================================================
(function () {
  'use strict';

  // Lido preguiçosamente: não depende da ordem de carga vs config.js.
  function cfg() { return (window.ERVATORIO_CONFIG && window.ERVATORIO_CONFIG.ANALYTICS) || {}; }
  var loaded = { gtm: false, ga4: false, clarity: false, pixel: false };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function injectScript(src, attrs) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    if (attrs) Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
    return s;
  }

  function loadGTM(id) {
    if (loaded.gtm) return;
    loaded.gtm = true;
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    injectScript('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id));
  }

  function loadGA4(id) {
    if (loaded.ga4) return;
    loaded.ga4 = true;
    injectScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }

  function loadClarity(id) {
    if (loaded.clarity) return;
    loaded.clarity = true;
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    injectScript('https://www.clarity.ms/tag/' + encodeURIComponent(id));
  }

  function loadPixel(id) {
    if (loaded.pixel) return;
    loaded.pixel = true;
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    injectScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function sync() {
    var c = window.__consent && window.__consent.get();
    if (!c) return; // sem escolha ainda — nada carrega
    var A = cfg();
    if (c.analytics) {
      if (A.GTM_ID) loadGTM(A.GTM_ID);
      else if (A.GA4_ID) loadGA4(A.GA4_ID);
      if (A.CLARITY_ID) loadClarity(A.CLARITY_ID);
    }
    if (c.marketing && A.META_PIXEL_ID) loadPixel(A.META_PIXEL_ID);
  }

  // Mapeamento GA4 → Meta Pixel para os eventos de e-commerce.
  var FB_MAP = {
    view_item: 'ViewContent',
    add_to_cart: 'AddToCart',
    begin_checkout: 'InitiateCheckout',
    purchase: 'Purchase',
  };

  // API global de eventos. params segue o schema GA4 de e-commerce
  // ({currency, value, items:[{item_id, item_name, price, quantity}]}).
  window.ervTrack = function (name, params) {
    params = params || {};
    try {
      // GA4/GTM: sempre empurra pro dataLayer (buffer inofensivo se
      // nada carregou; Consent Mode governa cookies/hits).
      window.gtag('event', name, params);
      // Meta Pixel: só se carregado (consentimento de marketing).
      if (loaded.pixel && FB_MAP[name] && typeof window.fbq === 'function') {
        window.fbq('track', FB_MAP[name], {
          currency: params.currency || 'BRL',
          value: params.value,
          content_ids: (params.items || []).map(function (i) { return i.item_id; }),
          content_type: 'product',
        }, params.transaction_id ? { eventID: 'purchase-' + params.transaction_id } : undefined);
      }
    } catch (e) { console.warn('[analytics] ervTrack falhou', e); }
  };

  if (window.__consent) {
    window.__consent.onChange(sync);
    sync();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.__consent) { window.__consent.onChange(sync); sync(); }
    });
  }
})();
