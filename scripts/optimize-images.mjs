#!/usr/bin/env node
/**
 * Compress hero JPGs into public/assets/hero/ (macOS sips).
 * Skips gracefully on CI/Linux if sips is unavailable — uses committed hero/ assets.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'public', 'assets');
const heroDir = join(assetsDir, 'hero');

function hasSips() {
  try {
    execSync('which sips', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

if (!hasSips()) {
  console.log('optimize-images: sips not found — skipping (use committed public/assets/hero/)');
  process.exit(0);
}

mkdirSync(heroDir, { recursive: true });

const jpgs = ['site_workers.jpg', 'site_scaffolding.jpg', 'site_bricklaying.jpg', 'site_shoveling.jpg'];

for (const name of jpgs) {
  const src = join(assetsDir, name);
  const dest = join(heroDir, name);
  if (!existsSync(src)) continue;
  execSync(
    `sips -s format jpeg -s formatOptions 72 -Z 1400 "${src}" --out "${dest}"`,
    { stdio: 'inherit' }
  );
}

const logoSrc = join(assetsDir, 'logo.png');
const logoDest = join(heroDir, 'logo.png');
if (existsSync(logoSrc)) {
  execSync(`sips -Z 512 "${logoSrc}" --out "${logoDest}"`, { stdio: 'inherit' });
}

console.log('optimize-images: done');