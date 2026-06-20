#!/usr/bin/env node
/**
 * Generate square PWA icons (192, 512) as PNG from public/assets/logo.png.
 * Uses macOS sips; skips gracefully on Linux/CI if icons already committed.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoSrc = join(root, 'public', 'assets', 'logo.png');
const iconsDir = join(root, 'public', 'icons');

const REQUIRED = ['icon-192.png', 'icon-512.png'];

function hasSips() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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

execSync(`sips -Z 410 "${logoSrc}" --out "${tmp410}"`, { stdio: 'inherit' });
execSync(`sips -p 512 512 --padColor FFFFFF "${tmp410}" --out "${join(iconsDir, 'icon-512.png')}"`, {
  stdio: 'inherit',
});
execSync(`sips -z 192 192 "${join(iconsDir, 'icon-512.png')}" --out "${join(iconsDir, 'icon-192.png')}"`, {
  stdio: 'inherit',
});

try {
  execSync(`rm -f "${tmp410}"`, { stdio: 'ignore' });
} catch {
  /* ignore */
}

console.log('generate-pwa-icons: done');