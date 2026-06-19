/**
 * HTTP cache control for dynamic API responses (Vercel + Express).
 * Prevents stale job/candidate data across browsers and CDN edge.
 */

export const NO_STORE_CACHE_CONTROL =
  'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0';

export const NO_STORE_HEADERS: Record<string, string> = {
  'Cache-Control': NO_STORE_CACHE_CONTROL,
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0',
};

export function applyNoStoreHeaders(res: {
  setHeader?: (key: string, value: string) => void;
  set?: (key: string, value: string) => void;
}): void {
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    if (typeof res.setHeader === 'function') {
      res.setHeader(key, value);
    } else if (typeof res.set === 'function') {
      res.set(key, value);
    }
  }
}

/** Append timestamp query param to bust browser/proxy caches on GET. */
export function withCacheBust(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
}

export const FETCH_NO_STORE_INIT: RequestInit = {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
};