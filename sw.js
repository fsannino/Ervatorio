const CACHE_NAME = 'ervatorio-v26';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/js/app.js',
  '/js/config.js',
  '/js/geo-data.js',
  '/js/flavor-wheel.js',
  '/js/ervaria.js',
  '/js/responsive-img.js',
  '/js/ervatorio-data.js',
  '/js/ervatorio-pages.js',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/images/hero/hero-bule.png',
  '/images/hero/hero-maos.png',
  '/images/hero/ervas-colecao.png',
  // Imagens primárias das ervas (mapeadas em HERBS)
  '/images/produtos/camomila.jpg',
  '/images/produtos/valeriana.png',
  '/images/produtos/maracuja.png',
  '/images/produtos/melissa.png',
  '/images/produtos/gengibre.jpg',
  '/images/produtos/matcha.png',
  '/images/produtos/hibisco.jpg',
  '/images/produtos/alecrim.png',
  '/images/produtos/hortela.jpg',
  '/images/produtos/erva-doce.jpg',
  '/images/produtos/canela.png',
  '/images/produtos/curcuma.png',
  '/images/produtos/lavanda.jpg',
  '/images/produtos/boldo-espinheira-santa.png',
  '/images/produtos/capim-limao.png',
  '/images/produtos/hibisco-azul-e-amora.png',
  '/images/produtos/calendula.png',
  '/images/produtos/rooibos.png',
  '/images/produtos/guarana.png',
  '/images/produtos/tomilho.jpg',
  '/images/produtos/alcachofra.png',
  '/images/produtos/guaco.png',
  '/images/produtos/erva-cidreira.png',
  '/images/produtos/carqueja.png',
  '/images/produtos/ginkgo-biloba.png',
  '/images/produtos/ashwagandha.png',
  // 14 ervas brasileiras novas (Fase 42)
  '/images/produtos/aroeira-da-praia.jpg',
  '/images/produtos/assa-peixe.jpg',
  '/images/produtos/barbatimao.jpg',
  '/images/produtos/boldo-baiano.jpg',
  '/images/produtos/boldo-brasileiro.jpg',
  '/images/produtos/chamba.jpg',
  '/images/produtos/chapeu-de-couro.jpg',
  '/images/produtos/copaiba.jpg',
  '/images/produtos/erva-baleeira.jpg',
  '/images/produtos/erva-de-bicho.jpg',
  '/images/produtos/erva-mate.jpg',
  '/images/produtos/guacatonga.jpg',
  '/images/produtos/macela.jpg',
  '/images/produtos/quebra-pedra.jpg'
];

// Google Fonts to cache with stale-while-revalidate
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

// Install: precache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Google Fonts: stale-while-revalidate (cache first, update in background)
  if (FONT_ORIGINS.some(origin => url.href.startsWith(origin))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Skip other external requests (Supabase API, Google auth)
  if (url.origin !== self.location.origin) return;

  // Same-origin: network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback to main page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
