const CACHE_NAME = 'ervatorio-v10';
const OFFLINE_URL = '/';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/js/app.js',
  '/js/geo-data.js',
  '/js/flavor-wheel.js',
  '/js/ervaria.js',
  '/js/ervatorio-data.js',
  '/js/ervatorio-pages.js',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/images/hero/hero-bule.png',
  '/images/hero/hero-maos.png',
  '/images/hero/ervas-colecao.png',
  '/images/produtos/camomila.png',
  '/images/produtos/hibisco.png',
  '/images/produtos/alecrim.png',
  '/images/produtos/hortela-seca.png',
  '/images/produtos/hortela-fresca.png',
  '/images/produtos/erva-doce.png',
  '/images/produtos/lavanda.png',
  '/images/produtos/capim-limao.png',
  '/images/produtos/matcha.png',
  '/images/produtos/funcho.png'
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
