# Scripts — Ervatório

Utilitários de build que não são servidos ao cliente.

## `optimize-images.mjs` — WebP + srcset

Converte PNG/JPG de `images/produtos/` e `images/hero/` para WebP em 4 larguras responsivas (320, 640, 1024, 1600). Gera `images/manifest.json` com o mapeamento usado em runtime.

### Setup (uma vez)

```bash
npm install
```

### Rodar

```bash
npm run images:optimize       # reconstrói tudo
npm run images:dry-run        # lista o que faria, não escreve
npm run images:manifest       # regenera só o manifest (útil após renomear arquivos)
```

Saída: `images/optimized/<subpasta>/<nome>-<largura>w.webp` + `images/optimized/<subpasta>/<nome>.webp` (full size).

### Usar no HTML

Inclua `/js/responsive-img.js` uma vez (antes de `</body>`):

```html
<script src="/js/responsive-img.js"></script>
```

Depois troque qualquer `<img src="images/produtos/camomila.png">` por:

```html
<img data-responsive="images/produtos/camomila.png"
     alt="Camomila" loading="lazy">
```

O script reescreve para um `<picture>` com `<source type="image/webp" srcset="...">` + fallback ao PNG original. Funciona também para imagens adicionadas dinamicamente (MutationObserver).

### Ganho esperado

- Total de `images/produtos/` hoje: ~76MB
- WebP @80% qualidade: ~60-70% redução → ~23-30MB no total
- Mobile carrega só a variante 320w ou 640w → dezenas de KB por imagem em vez de MB

### Integração com o service worker

O `sw.js` atual faz cache estático. Depois da primeira otimização, adicione `/images/manifest.json` e `/images/optimized/*` à lista de precache se quiser oferecer a galeria otimizada offline. Cuidado: a pasta `optimized/` pode crescer; considere cache-first com limite de tamanho via `caches.match` + LRU manual.
