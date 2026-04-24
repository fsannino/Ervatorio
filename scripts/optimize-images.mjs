#!/usr/bin/env node
// ============================================================
// ERVATÓRIO — Otimizador de imagens em lote
// ============================================================
// Gera WebP responsivo (320w, 640w, 1024w, 1600w) para todas as
// imagens em images/produtos/ e images/hero/. Mantém originais
// intactas (fallback) e escreve em images/optimized/ com a mesma
// estrutura de diretórios.
//
// Além disso, gera images/manifest.json com as larguras disponíveis
// por arquivo — consumido em runtime por js/responsive-img.js.
//
// Uso:
//   npm run images:optimize           # gera WebP + manifest
//   npm run images:dry-run            # só lista o que faria
//   npm run images:manifest           # regenera só o manifest
// ============================================================
import { readdir, mkdir, stat, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, parse, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_DIRS = ['images/produtos', 'images/hero'];
const OUT_ROOT = join(ROOT, 'images/optimized');
const MANIFEST_PATH = join(ROOT, 'images/manifest.json');
const WIDTHS = [320, 640, 1024, 1600];
const QUALITY = 80;
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const MANIFEST_ONLY = args.has('--manifest-only');

async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch (e) {
    console.error('\n✗ sharp não está instalado. Rode:\n\n  npm install\n');
    console.error('Erro original:', e.message);
    process.exit(1);
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

async function processOne(sharp, srcPath) {
  const rel = relative(ROOT, srcPath);
  const { name, ext, dir } = parse(rel);
  if (!EXTS.has(ext.toLowerCase())) return null;

  const outDir = join(OUT_ROOT, relative('images', dir));
  await mkdir(outDir, { recursive: true });

  const meta = await sharp(srcPath).metadata();
  const originalWidth = meta.width ?? Infinity;
  const effectiveWidths = WIDTHS.filter((w) => w <= originalWidth);
  if (effectiveWidths.length === 0) effectiveWidths.push(originalWidth);

  const variants = [];
  for (const w of effectiveWidths) {
    const outName = `${name}-${w}w.webp`;
    const outPath = join(outDir, outName);
    if (!DRY_RUN) {
      await sharp(srcPath)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(outPath);
    }
    variants.push({ width: w, path: `images/optimized/${relative('images', dir)}/${outName}`.replace(/\\/g, '/') });
  }

  // Também gera uma WebP full-size (sem resize) para casos 1:1
  const fullName = `${name}.webp`;
  const fullPath = join(outDir, fullName);
  if (!DRY_RUN) {
    await sharp(srcPath)
      .webp({ quality: QUALITY, effort: 5 })
      .toFile(fullPath);
  }

  return {
    source: rel.replace(/\\/g, '/'),
    full: `images/optimized/${relative('images', dir)}/${fullName}`.replace(/\\/g, '/'),
    variants,
    originalWidth,
    originalHeight: meta.height,
  };
}

async function main() {
  console.log('Ervatório — otimizador de imagens');
  console.log('----------------------------------');
  if (DRY_RUN) console.log('(dry-run: nada será escrito)');

  let manifest = {};
  if (MANIFEST_ONLY && existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  }

  if (!MANIFEST_ONLY) {
    const sharp = await loadSharp();
    for (const rel of SOURCE_DIRS) {
      const abs = join(ROOT, rel);
      if (!existsSync(abs)) {
        console.warn(`  ↷ pulando (inexistente): ${rel}`);
        continue;
      }
      const files = await walk(abs);
      console.log(`\n${rel}: ${files.length} arquivo(s)`);
      for (const f of files) {
        const result = await processOne(sharp, f);
        if (!result) continue;
        manifest[result.source] = {
          full: result.full,
          variants: result.variants,
          width: result.originalWidth,
          height: result.originalHeight,
        };
        const sizeBefore = (await stat(f)).size;
        const firstVariant = result.variants[0];
        let sizeAfter = null;
        if (!DRY_RUN && firstVariant) {
          try { sizeAfter = (await stat(join(ROOT, firstVariant.path))).size; } catch {}
        }
        const saving = sizeAfter ? ` (${(sizeBefore / 1024).toFixed(0)}kb → ${(sizeAfter / 1024).toFixed(0)}kb @ ${firstVariant.width}w)` : '';
        console.log(`  ✓ ${relative(ROOT, f)}${saving}`);
      }
    }
  }

  if (!DRY_RUN) {
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\n✓ Manifest escrito em ${relative(ROOT, MANIFEST_PATH)} (${Object.keys(manifest).length} imagens)`);
  }

  console.log('\nPróximo passo: inclua <script src="/js/responsive-img.js"></script>');
  console.log('e troque <img src="images/produtos/foo.png"> por <img data-responsive="images/produtos/foo.png">.');
}

main().catch((e) => {
  console.error('\n✗ Falhou:', e);
  process.exit(1);
});
