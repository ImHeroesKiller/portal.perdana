#!/usr/bin/env node
/**
 * Inject Vite build asset URLs into dist/sw.js for install-time precaching.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const swPath = join(distDir, 'sw.js');
const PLACEHOLDER = '/*__BUILD_PRECACHE__*/[]';

const ASSET_EXT = /\.(js|css|woff2?)$/i;
const SKIP = new Set(['sw.js', 'manifest.json']);

function walk(dir, base = '') {
  const urls = [];
  if (!existsSync(dir)) return urls;
  for (const name of readdirSync(dir)) {
    const rel = base ? `${base}/${name}` : name;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      urls.push(...walk(full, rel));
    } else if (ASSET_EXT.test(name) && !SKIP.has(name)) {
      urls.push(`/${rel.replace(/\\/g, '/')}`);
    }
  }
  return urls;
}

if (!existsSync(swPath)) {
  console.log('inject-pwa-precache: dist/sw.js not found — skipping');
  process.exit(0);
}

const assets = walk(distDir).sort();
const sw = readFileSync(swPath, 'utf8');

if (!sw.includes('/*__BUILD_PRECACHE__*/')) {
  console.warn('inject-pwa-precache: placeholder not found in sw.js');
  process.exit(0);
}

const injected = sw.replace(PLACEHOLDER, JSON.stringify(assets));
writeFileSync(swPath, injected);
console.log(`inject-pwa-precache: injected ${assets.length} build asset(s)`);