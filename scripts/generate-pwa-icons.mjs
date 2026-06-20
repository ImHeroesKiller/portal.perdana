#!/usr/bin/env node
/**
 * Normalize PWA icons from user uploads in public/icons/ (priority) or public/assets/logo.png.
 * Outputs 192×192 and 512×512 PNGs plus iOS splash screens. Uses macOS sips; skips on Linux/CI
 * if normalized icons already exist.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoSrc = join(root, 'public', 'assets', 'logo.png');
const iconsDir = join(root, 'public', 'icons');
const splashDir = join(iconsDir, 'splash');

const ICON_192 = 'icon-192.png';
const ICON_512 = 'icon-512.png';

/** iOS startup image sizes (width × height). */
const SPLASH_SIZES = [
  { name: 'iphone-se', w: 750, h: 1334 },
  { name: 'iphone-12', w: 1170, h: 2532 },
  { name: 'iphone-12-pro-max', w: 1284, h: 2778 },
  { name: 'ipad-pro', w: 2048, h: 2732 },
];

function hasSips() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function getImageSize(path) {
  try {
    const out = execSync(`sips -g pixelWidth -g pixelHeight "${path}"`, { encoding: 'utf8' });
    const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1] ?? 0);
    const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1] ?? 0);
    return { w, h };
  } catch {
    return { w: 0, h: 0 };
  }
}

/** Prefer user-uploaded icons in public/icons/ over logo.png. */
function resolveSource() {
  const icon512 = join(iconsDir, ICON_512);
  const icon192 = join(iconsDir, ICON_192);
  if (existsSync(icon512)) return { path: icon512, label: 'user icon-512.png' };
  if (existsSync(icon192)) return { path: icon192, label: 'user icon-192.png' };
  if (existsSync(logoSrc)) return { path: logoSrc, label: 'assets/logo.png' };
  return null;
}

/** Square-crop from center, then scale to target px. */
function makeSquareIcon(src, dest, size) {
  const { w, h } = getImageSize(src);
  if (!w || !h) throw new Error(`Cannot read dimensions: ${src}`);
  const side = Math.min(w, h);
  const tmpSquare = join(iconsDir, `.tmp-square-${size}.png`);
  const tmpScaled = join(iconsDir, `.tmp-scaled-${size}.png`);
  run(`sips -c ${side} ${side} "${src}" --out "${tmpSquare}"`);
  run(`sips -z ${size} ${size} "${tmpSquare}" --out "${tmpScaled}"`);
  run(`sips -z ${size} ${size} "${tmpScaled}" --out "${dest}"`);
  try {
    execSync(`rm -f "${tmpSquare}" "${tmpScaled}"`, { stdio: 'ignore' });
  } catch {
    /* ignore */
  }
}

/** Logo fallback: fit inside square with white padding. */
function makeLogoIcon(src, dest, size) {
  const inner = Math.round(size * 0.8);
  const tmpInner = join(iconsDir, `.tmp-inner-${size}.png`);
  const tmpPadded = join(iconsDir, `.tmp-padded-${size}.png`);
  run(`sips -Z ${inner} "${src}" --out "${tmpInner}"`);
  run(`sips -p ${size} ${size} --padColor FFFFFF "${tmpInner}" --out "${tmpPadded}"`);
  run(`cp "${tmpPadded}" "${dest}"`);
  try {
    execSync(`rm -f "${tmpInner}" "${tmpPadded}"`, { stdio: 'ignore' });
  } catch {
    /* ignore */
  }
}

function generateSplashScreens(icon512) {
  mkdirSync(splashDir, { recursive: true });
  for (const { name, w, h } of SPLASH_SIZES) {
    const dest = join(splashDir, `splash-${name}.png`);
    const logoSize = Math.round(Math.min(w, h) * 0.22);
    const tmpLogo = join(splashDir, `.tmp-logo-${name}.png`);
    const tmpCanvas = join(splashDir, `.tmp-canvas-${name}.png`);
    run(`sips -z ${logoSize} ${logoSize} "${icon512}" --out "${tmpLogo}"`);
    run(`sips -c ${h} ${w} --padColor FFFFFF "${tmpLogo}" --out "${tmpCanvas}"`);
    run(`cp "${tmpCanvas}" "${dest}"`);
    try {
      execSync(`rm -f "${tmpLogo}" "${tmpCanvas}"`, { stdio: 'ignore' });
    } catch {
      /* ignore */
    }
  }
}

const source = resolveSource();

if (!source) {
  const missing = [ICON_192, ICON_512].filter((f) => !existsSync(join(iconsDir, f)));
  if (missing.length) {
    console.warn(`generate-pwa-icons: no source found, missing: ${missing.join(', ')}`);
  } else {
    console.log('generate-pwa-icons: using existing public/icons/');
  }
  process.exit(0);
}

if (!hasSips()) {
  const missing = [ICON_192, ICON_512].filter((f) => !existsSync(join(iconsDir, f)));
  if (missing.length) {
    console.warn(`generate-pwa-icons: sips unavailable, missing: ${missing.join(', ')}`);
  } else {
    console.log('generate-pwa-icons: sips not found — using committed public/icons/');
  }
  process.exit(0);
}

mkdirSync(iconsDir, { recursive: true });
console.log(`generate-pwa-icons: source → ${source.label}`);

const fromLogo = source.label === 'assets/logo.png';
const tmpSource = join(iconsDir, '.tmp-source.png');
run(`cp "${source.path}" "${tmpSource}"`);

const out512 = join(iconsDir, ICON_512);
const out192 = join(iconsDir, ICON_192);

if (fromLogo) {
  makeLogoIcon(tmpSource, out512, 512);
  makeLogoIcon(tmpSource, out192, 192);
} else {
  makeSquareIcon(tmpSource, out512, 512);
  makeSquareIcon(tmpSource, out192, 192);
}

try {
  execSync(`rm -f "${tmpSource}"`, { stdio: 'ignore' });
} catch {
  /* ignore */
}

const s512 = getImageSize(out512);
const s192 = getImageSize(out192);
console.log(`generate-pwa-icons: ${ICON_512} → ${s512.w}×${s512.h}`);
console.log(`generate-pwa-icons: ${ICON_192} → ${s192.w}×${s192.h}`);

generateSplashScreens(out512);

const splashCount = readdirSync(splashDir).filter((f) => f.startsWith('splash-') && f.endsWith('.png')).length;
console.log(`generate-pwa-icons: ${splashCount} splash screen(s) in public/icons/splash/`);
console.log('generate-pwa-icons: done');