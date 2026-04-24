// ============================================================
// Ervatório — upgrade runtime de <img> para WebP responsivo
// ============================================================
// Lê /images/manifest.json (gerado por scripts/optimize-images.mjs)
// e reescreve qualquer <img data-responsive="images/produtos/foo.png">
// para usar srcset WebP, mantendo o PNG/JPG original como fallback
// em navegadores sem suporte.
//
// Também observa DOM via MutationObserver para upgradar imagens
// adicionadas dinamicamente (galeria, carrinho, etc.).
//
// Uso:
//   <img data-responsive="images/produtos/camomila.png"
//        alt="Camomila" width="640" height="480" loading="lazy">
// ============================================================
(function () {
  const MANIFEST_URL = '/images/manifest.json';
  const SIZES_DEFAULT = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';
  let manifestPromise = null;

  async function getManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}));
    }
    return manifestPromise;
  }

  function buildSrcset(variants) {
    return variants.map((v) => `/${v.path} ${v.width}w`).join(', ');
  }

  async function upgrade(img) {
    if (img.dataset.responsiveUpgraded === '1') return;
    const key = img.dataset.responsive;
    if (!key) return;
    img.dataset.responsiveUpgraded = '1';

    const manifest = await getManifest();
    const entry = manifest[key];
    if (!entry) {
      // Sem entry no manifest → usa o arquivo original como fallback.
      img.src = '/' + key;
      return;
    }

    // Prefere <picture> para servir WebP + fallback ao original.
    const picture = document.createElement('picture');

    const source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = buildSrcset(entry.variants);
    source.sizes = img.getAttribute('sizes') || SIZES_DEFAULT;
    picture.appendChild(source);

    img.src = '/' + key;
    img.removeAttribute('data-responsive');
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
    if (!img.hasAttribute('width') && entry.width) img.width = entry.width;
    if (!img.hasAttribute('height') && entry.height) img.height = entry.height;

    img.parentNode.insertBefore(picture, img);
    picture.appendChild(img);
  }

  function scan(root) {
    const nodes = (root || document).querySelectorAll('img[data-responsive]');
    nodes.forEach(upgrade);
  }

  function observe() {
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.matches?.('img[data-responsive]')) upgrade(n);
          else if (n.querySelectorAll) scan(n);
        });
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { scan(); observe(); });
  } else {
    scan(); observe();
  }
})();
