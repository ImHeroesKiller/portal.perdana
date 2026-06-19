/**
 * Pre-compile /api/*.ts → /api/*.js for Vercel serverless.
 * Vercel's native TS compilation fails for this Vite + ESM project;
 * esbuild output matches the working send-telegram.js pattern.
 */
import * as esbuild from 'esbuild';
import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { join, relative } from 'path';

const API_ROOT = new URL('../api', import.meta.url).pathname;
const HANDWRITTEN = new Set(['send-telegram.js']);

function walkTsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkTsFiles(full, out);
    } else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

const entries = walkTsFiles(API_ROOT);
if (!entries.length) {
  console.log('build-vercel-api: no api/*.ts entrypoints');
  process.exit(0);
}

console.log(`build-vercel-api: compiling ${entries.length} handler(s)...`);

for (const entry of entries) {
  const rel = relative(API_ROOT, entry);
  const outfile = join(API_ROOT, rel.replace(/\.ts$/, '.js'));

  if (HANDWRITTEN.has(rel.replace(/\.ts$/, '.js'))) continue;

  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    logLevel: 'warning',
  });

  console.log(`  ✓ api/${rel.replace(/\.ts$/, '.js')}`);
}

// Remove stale generated handlers (source .ts was deleted)
function walkJsFiles(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkJsFiles(full);
      continue;
    }
    if (!name.endsWith('.js') || HANDWRITTEN.has(name)) continue;
    const tsSource = full.replace(/\.js$/, '.ts');
    if (!existsSync(tsSource)) {
      unlinkSync(full);
      console.log(`  ✗ removed stale ${relative(API_ROOT, full)}`);
    }
  }
}

walkJsFiles(API_ROOT);
console.log('build-vercel-api: done');