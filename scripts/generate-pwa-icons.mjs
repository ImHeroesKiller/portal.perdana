#!/usr/bin/env node
/**
 * Generate square PWA icons (192, 512, maskable) as JPEG from public/assets/logo.png.
 * Uses macOS sips; skips gracefully on Linux/CI if icons already committed.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoSrc = join(root, 'public', 'assets', 'logo.png');
const iconsDir = join(root, 'public', 'icons');
const JPEG_OPTS = '-s format jpeg -s formatOptions 90';

const REQUIRED = [
  'icon-192.jpg',
  'icon-512.jpg',
  'icon-maskable-192.jpg',
  'icon-maskable-512.jpg',
];

function hasSips() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function toJpeg(pngPath, jpgPath) {
  execSync(`sips ${JPEG_OPTS} "${pngPath}" --out "${jpgPath}"`, { stdio: 'inherit' });
}

if (!existsSync(logoSrc)) {
  console.log('generate-pwa-icons: logo not found — skipping');
  process.exit(0);
}

if (!hasSips()) {
  const missing = REQUIRED.filter((f) => !existsSync(join(iconsDir, f)));
  if (missing.length) {
    console.warn(`generate-pwa-icons: sips unavailable, missing: ${missing.join(', ')}`);
  } else {
    console.log('generate-pwa-icons: sips not found — using committed public/icons/');
  }
  process.exit(0);
}

mkdirSync(iconsDir, { recursive: true });

const tmp410 = join(iconsDir, '.tmp-logo-410.png');
const tmp340 = join(iconsDir, '.tmp-logo-340.png');
const tmp512 = join(iconsDir, '.tmp-icon-512.png');
const tmp192 = join(iconsDir, '.tmp-icon-192.png');
const tmpMask512 = join(iconsDir, '.tmp-maskable-512.png');
const tmpMask192 = join(iconsDir, '.tmp-maskable-192.png');

execSync(`sips -Z 410 "${logoSrc}" --out "${tmp410}"`, { stdio: 'inherit' });
execSync(`sips -p 512 512 --padColor FFFFFF "${tmp410}" --out "${tmp512}"`, { stdio: 'inherit' });
execSync(`sips -z 192 192 "${tmp512}" --out "${tmp192}"`, { stdio: 'inherit' });
toJpeg(tmp512, join(iconsDir, 'icon-512.jpg'));
toJpeg(tmp192, join(iconsDir, 'icon-192.jpg'));

execSync(`sips -Z 340 "${logoSrc}" --out "${tmp340}"`, { stdio: 'inherit' });
execSync(`sips -p 512 512 --padColor FFFFFF "${tmp340}" --out "${tmpMask512}"`, { stdio: 'inherit' });
execSync(`sips -z 192 192 "${tmpMask512}" --out "${tmpMask192}"`, { stdio: 'inherit' });
toJpeg(tmpMask512, join(iconsDir, 'icon-maskable-512.jpg'));
toJpeg(tmpMask192, join(iconsDir, 'icon-maskable-192.jpg'));

try {
  execSync(`rm -f "${tmp410}" "${tmp340}" "${tmp512}" "${tmp192}" "${tmpMask512}" "${tmpMask192}"`, {
    stdio: 'ignore',
  });
} catch {
  /* ignore */
}

console.log('generate-pwa-icons: done');