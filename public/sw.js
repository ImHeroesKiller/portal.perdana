/**
 * ePortal — service worker
 * Precache shell + build assets (injected at build) + stale-while-revalidate for static files.
 */
const CACHE_VERSION = 'eportal-v2';
const RUNTIME_CACHE = 'eportal-runtime-v2';

const SHELL_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/splash/splash-iphone-se.png',
  '/icons/splash/splash-iphone-12.png',
  '/icons/splash/splash-iphone-12-pro-max.png',
  '/icons/splash/splash-ipad-pro.png',
];

/** Replaced by scripts/inject-pwa-precache.mjs after vite build. */
const BUILD_PRECACHE = /*__BUILD_PRECACHE__*/[];

const ALL_PRECACHE = [...new Set([...SHELL_PRECACHE, ...BUILD_PRECACHE])];

const IMMUTABLE_PATTERN = /\.[a-f0-9]{8,}\.(js|css|woff2?)$/i;
const STATIC_ASSET_PATTERN = /\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        Promise.allSettled(ALL_PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
}

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    STATIC_ASSET_PATTERN.test(pathname)
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response?.status === 200) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response?.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }

  const response = await networkPromise;
  if (response) return response;
  return new Response('Offline', { status: 503, statusText: 'Offline' });
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response?.status === 200) {
      cache.put('/index.html', response.clone());
    }
    return response;
  } catch {
    const cached =
      (await caches.match('/index.html')) ||
      (await caches.match('/')) ||
      (await caches.match(request));
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Never intercept analytics / tag manager (cross-origin; must reach network)
  const url = new URL(request.url);
  if (
    url.hostname.endsWith('googletagmanager.com') ||
    url.hostname.endsWith('google-analytics.com') ||
    url.hostname.endsWith('analytics.google.com')
  ) {
    return;
  }

  if (!isSameOrigin(request)) return;

  const { pathname } = new URL(request.url);

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (!isStaticAsset(pathname)) return;

  if (IMMUTABLE_PATTERN.test(pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});