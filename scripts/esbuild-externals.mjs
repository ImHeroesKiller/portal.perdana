import { readFileSync } from 'fs';

/** Dependency names to keep external when bundling Node entrypoints. */
export function getNodeExternals() {
  const pkgPath = new URL('../package.json', import.meta.url);
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  return [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ];
}