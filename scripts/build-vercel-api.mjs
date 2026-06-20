/**
 * Pre-compile api .ts handlers to matching .js for Vercel serverless.
 * Hand-written .js handlers (tanpa pasangan .ts) tidak disentuh.
 */
import * as esbuild from 'esbuild';
import { readdirSync, statSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { getNodeExternals } from './esbuild-externals.mjs';

const API_ROOT = new URL('../api', import.meta.url).pathname;
const NODE_EXTERNALS = getNodeExternals();

/** .js-only handlers — tidak dikompilasi dan tidak dihapus saat cleanup */
const HANDWRITTEN = new Set([
  'send-telegram.js',
  'ping.js',
  'package.json',
  'firebase-health.js',
  'db/[collection]/index.js',
  'db/[collection]/[id].js',
]);

function isHandwritten(relPath) {
  return HANDWRITTEN.has(relPath) || relPath.startsWith('_helpers/');
}

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
  console.log('build-vercel-api: no api .ts entrypoints');
  process.exit(0);
}

console.log(`build-vercel-api: compiling ${entries.length} handler(s)...`);

for (const entry of entries) {
  const rel = relative(API_ROOT, entry);
  const outRel = rel.replace(/\.ts$/, '.js');
  const outfile = join(API_ROOT, outRel);
  mkdirSync(dirname(outfile), { recursive: true });

  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    external: NODE_EXTERNALS,
    footer: {
      js: 'if (module.exports.default) module.exports = module.exports.default;',
    },
    logLevel: 'warning',
  });

  console.log(`  ✓ api/${outRel}`);
}

function walkJsFiles(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkJsFiles(full);
      continue;
    }
    if (!name.endsWith('.js')) continue;
    const rel = relative(API_ROOT, full);
    if (isHandwritten(rel)) continue;
    const tsSource = join(API_ROOT, rel.replace(/\.js$/, '.ts'));
    if (!existsSync(tsSource)) {
      unlinkSync(full);
      console.log(`  ✗ removed stale api/${rel}`);
    }
  }
}

walkJsFiles(API_ROOT);
console.log('build-vercel-api: done');