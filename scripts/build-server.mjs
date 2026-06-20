/**
 * Bundle server.ts for local/production Node (Express + Vite static).
 * Uses explicit dependency externals — avoids esbuild CLI error:
 * "The entry point server.ts cannot be marked as external"
 */
import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';
import { getNodeExternals } from './esbuild-externals.mjs';

mkdirSync('dist', { recursive: true });

await esbuild.build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/server.cjs',
  sourcemap: true,
  external: getNodeExternals(),
  logLevel: 'info',
});

console.log('build-server: done → dist/server.cjs');