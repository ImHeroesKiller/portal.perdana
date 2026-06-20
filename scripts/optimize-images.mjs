#!/usr/bin/env node
/**
 * Compress hero images + generate WebP variants for production.
 * Input: public/assets/hero/*.jpg (or legacy public/assets/site_*.jpg).
 * Output: public/assets/hero/*.{jpg,webp}, optimized logo.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'public', 'assets');
const heroDir = join(assetsDir, 'hero');
const HERO_JPGS = [
  'site_workers.jpg',
  'site_scaffolding.jpg',
  'site_bricklaying.jpg',
  'site_shoveling.jpg',
];

mkdirSync(heroDir, { recursive: true });

function hasSips() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch {
    return null;
  }
}

function sipsJpeg(src, dest, maxEdge = 1400, quality = 72) {
  execSync(
    `sips -s format jpeg -s formatOptions ${quality} -Z ${maxEdge} "${src}" --out "${dest}"`,
    { stdio: 'inherit' }
  );
}

function resolveSource(name) {
  const heroSrc = join(heroDir, name);
  if (existsSync(heroSrc)) return heroSrc;
  const legacy = join(assetsDir, name);
  if (existsSync(legacy)) return legacy;
  return null;
}

async function optimizeWithSharp(sharp) {
  for (const name of HERO_JPGS) {
    const src = resolveSource(name);
    if (!src) {
      console.warn(`optimize-images: skip ${name} — source not found`);
      continue;
    }

    const jpgDest = join(heroDir, name);
    const webpDest = join(heroDir, name.replace(/\.jpe?g$/i, '.webp'));
    const tmp = `${jpgDest}.tmp`;

    await sharp(src)
      .rotate()
      .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toFile(tmp);
    renameSync(tmp, jpgDest);

    const webpBuffer = await sharp(jpgDest).webp({ quality: 72, effort: 4 }).toBuffer();
    const jpgSize = statSync(jpgDest).size;
    if (webpBuffer.length < jpgSize) {
      writeFileSync(webpDest, webpBuffer);
      console.log(
        `  ✓ ${name} + ${name.replace(/\.jpe?g$/i, '.webp')} (${Math.round(webpBuffer.length / 1024)}KB webp)`
      );
    } else {
      if (existsSync(webpDest)) unlinkSync(webpDest);
      console.log(`  ✓ ${name} (webp skipped — jpeg smaller)`);
    }
  }

  const logoCandidates = [
    join(assetsDir, 'logo.png'),
    join(heroDir, 'logo.png'),
  ];
  const logoSrc = logoCandidates.find((p) => existsSync(p));
  if (logoSrc) {
    const logoHero = join(heroDir, 'logo.png');
    const logoRoot = join(assetsDir, 'logo.png');
    const logoWebp = join(heroDir, 'logo.webp');
    const logoTmp = join(heroDir, 'logo.tmp.png');

    await sharp(logoSrc)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toFile(logoTmp);
    renameSync(logoTmp, logoHero);
    await sharp(logoHero).webp({ quality: 90 }).toFile(logoWebp);
    await sharp(logoHero).toFile(logoRoot);
    console.log('  ✓ logo.png + logo.webp');
  }
}

function optimizeWithSips() {
  for (const name of HERO_JPGS) {
    const src = resolveSource(name);
    if (!src) continue;
    sipsJpeg(src, join(heroDir, name));
  }
  const logoSrc = join(assetsDir, 'logo.png');
  if (existsSync(logoSrc)) {
    execSync(`sips -Z 512 "${logoSrc}" --out "${join(heroDir, 'logo.png')}"`, { stdio: 'inherit' });
  }
  console.log('optimize-images: WebP skipped (install sharp for WebP)');
}

function pruneLegacyHeroSources() {
  for (const name of HERO_JPGS) {
    const legacy = join(assetsDir, name);
    if (existsSync(legacy)) {
      unlinkSync(legacy);
      console.log(`  ✗ removed deploy bloat: public/assets/${name}`);
    }
  }
}

const sharp = await loadSharp();
if (sharp) {
  console.log('optimize-images: sharp');
  await optimizeWithSharp(sharp);
} else if (hasSips()) {
  console.log('optimize-images: sips fallback');
  optimizeWithSips();
} else {
  console.log('optimize-images: no sharp/sips — using committed public/assets/hero/');
}

pruneLegacyHeroSources();
console.log('optimize-images: done');