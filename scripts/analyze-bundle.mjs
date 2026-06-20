#!/usr/bin/env node
/**
 * Post-build bundle & asset size report for production tuning.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const dist = join(process.cwd(), 'dist');
const assetsDir = join(dist, 'assets');

function fmt(bytes) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function walk(dir, files = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return files;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else files.push({ path: full.replace(dist + '/', ''), size: st.size });
  }
  return files;
}

const jsCss = walk(assetsDir)
  .filter((f) => ['.js', '.css'].includes(extname(f.path)))
  .sort((a, b) => b.size - a.size);

const images = walk(join(dist, 'assets'))
  .filter((f) => /\.(jpe?g|png|webp|svg)$/i.test(f.path))
  .sort((a, b) => b.size - a.size);

const totalJs = jsCss.filter((f) => f.path.endsWith('.js')).reduce((s, f) => s + f.size, 0);
const totalCss = jsCss.filter((f) => f.path.endsWith('.css')).reduce((s, f) => s + f.size, 0);
const totalImg = images.reduce((s, f) => s + f.size, 0);

console.log('\n📦 Bundle analysis (dist/)\n');
console.log(`JS total:  ${fmt(totalJs)}`);
console.log(`CSS total: ${fmt(totalCss)}`);
console.log(`Images:    ${fmt(totalImg)}\n`);

console.log('Top JS/CSS chunks:');
for (const f of jsCss.slice(0, 12)) {
  console.log(`  ${fmt(f.size).padStart(10)}  ${f.path}`);
}

console.log('\nTop images:');
for (const f of images.slice(0, 10)) {
  console.log(`  ${fmt(f.size).padStart(10)}  ${f.path}`);
}

const largeImages = images.filter((f) => f.size > 200_000);
if (largeImages.length) {
  console.log('\n⚠️  Images > 200KB (consider WebP or smaller dimensions):');
  for (const f of largeImages) {
    console.log(`  ${fmt(f.size).padStart(10)}  ${f.path}`);
  }
}

const largeChunks = jsCss.filter((f) => f.path.endsWith('.js') && f.size > 150_000);
if (largeChunks.length) {
  console.log('\n💡 JS chunks > 150KB (candidates for lazy loading):');
  for (const f of largeChunks) {
    console.log(`  ${fmt(f.size).padStart(10)}  ${f.path}`);
  }
}

console.log('');