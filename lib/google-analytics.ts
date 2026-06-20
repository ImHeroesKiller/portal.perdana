export const GA_MEASUREMENT_ID = 'G-LB6K5S1D5T';
const GA_SCRIPT_SELECTOR = `script[data-ga4="${GA_MEASUREMENT_ID}"]`;
const LOAD_TIMEOUT_MS = 8000;

export type GaLoadState = 'idle' | 'loading' | 'ready' | 'blocked' | 'error';

type QueuedPageView = { pagePath: string; pageTitle?: string };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __GA_DEBUG__?: boolean;
    __GA_READY__?: boolean;
    __GA_SCRIPT_LOADED__?: boolean;
    __GA_BLOCKED__?: boolean;
    __GA_INIT_STARTED__?: boolean;
  }
}

let loadState: GaLoadState = 'idle';
let loadPromise: Promise<GaLoadState> | null = null;
let lastTrackedPath = '';
const pageViewQueue: QueuedPageView[] = [];

function isLocalhost(): boolean {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

/** Debug only in dev, or explicit opt-in (?ga_debug=1 / localStorage) — never auto-on in production. */
export function isGaDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.__GA_DEBUG__) return true;

    const explicit =
      localStorage.getItem('ga_debug') === '1' ||
      /(?:^|[?&#])ga_debug=1(?:&|$|#)/.test(`${window.location.search}${window.location.hash}`);

    if (import.meta.env.PROD) return explicit;

    return explicit || isLocalhost() || import.meta.env.DEV;
  } catch {
    return false;
  }
}

export function getGaLoadState(): GaLoadState {
  return loadState;
}

export function isGtagReady(): boolean {
  return loadState === 'ready' && typeof window.gtag === 'function' && Boolean(window.__GA_SCRIPT_LOADED__);
}

function logDebug(message: string, detail?: unknown): void {
  if (!isGaDebugEnabled()) return;
  if (detail !== undefined) console.info(`[GA4] ${message}`, detail);
  else console.info(`[GA4] ${message}`);
}

function logWarn(message: string): void {
  if (!isGaDebugEnabled()) return;
  console.warn(`[GA4] ${message}`);
}

/** Stub queues calls until gtag.js replaces it — prevents internal errors from early config calls. */
function installGtagStub(): void {
  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag === 'function') return;

  window.gtag = (...args: unknown[]) => {
    try {
      window.dataLayer!.push(args);
    } catch {
      /* ignore queue errors */
    }
  };
}

function safeGtag(...args: unknown[]): boolean {
  if (typeof window.gtag !== 'function') return false;
  try {
    window.gtag(...args);
    return true;
  } catch (err) {
    logWarn(`gtag call failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    return false;
  }
}

function configureGtag(): void {
  const debug = isGaDebugEnabled();
  window.__GA_DEBUG__ = debug;

  if (debug) logDebug('debug_mode enabled — events appear in GA4 DebugView');

  safeGtag('js', new Date());
  safeGtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    debug_mode: debug,
    allow_google_signals: !import.meta.env.PROD,
    allow_ad_personalization_signals: false,
    transport_type: 'beacon',
    cookie_flags: 'SameSite=None;Secure',
  });

  window.__GA_READY__ = true;
}

function flushPageViewQueue(): void {
  if (!isGtagReady()) return;

  while (pageViewQueue.length > 0) {
    const item = pageViewQueue.shift()!;
    sendPageView(item.pagePath, item.pageTitle);
  }
}

function sendPageView(pagePath: string, pageTitle?: string): boolean {
  const ok = safeGtag('event', 'page_view', {
    send_to: GA_MEASUREMENT_ID,
    page_path: pagePath,
    page_location: window.location.href,
    page_title: pageTitle ?? document.title,
  });

  if (ok) logDebug('page_view', { page_path: pagePath, page_location: window.location.href });
  return ok;
}

/** HashRouter-safe page path (pathname + query). */
export function buildGaPagePath(pathname: string, search: string): string {
  const path = pathname || '/';
  return search ? `${path}${search}` : path;
}

export function trackGaPageView(pagePath: string, pageTitle?: string): void {
  if (!pagePath) return;

  if (!isGtagReady()) {
    const lastQueued = pageViewQueue[pageViewQueue.length - 1];
    if (!lastQueued || lastQueued.pagePath !== pagePath) {
      pageViewQueue.push({ pagePath, pageTitle });
    }
    void initGoogleAnalytics();
    return;
  }

  if (lastTrackedPath === pagePath) return;
  lastTrackedPath = pagePath;
  sendPageView(pagePath, pageTitle);
}

/** Probe whether analytics endpoints are likely blocked (ad blocker / network policy). */
export async function detectAdBlocker(): Promise<boolean> {
  if (window.__GA_BLOCKED__) return true;
  if (window.__GA_SCRIPT_LOADED__) return false;

  try {
    await fetch(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
    return false;
  } catch {
    return true;
  }
}

function markBlocked(): GaLoadState {
  loadState = 'blocked';
  window.__GA_BLOCKED__ = true;
  pageViewQueue.length = 0;
  logWarn('gtag.js blocked — likely ad blocker, privacy extension, or network policy');
  return loadState;
}

function settleScriptLoad(finish: (state: GaLoadState) => void): void {
  window.__GA_SCRIPT_LOADED__ = true;
  configureGtag();
  flushPageViewQueue();
  finish('ready');
}

/** Load gtag.js exactly once; resolves when ready, blocked, or errored. */
export function initGoogleAnalytics(): Promise<GaLoadState> {
  if (typeof window === 'undefined') return Promise.resolve('idle');
  if (loadPromise) return loadPromise;

  installGtagStub();

  if (isGtagReady()) {
    loadState = 'ready';
    return Promise.resolve('ready');
  }

  window.__GA_INIT_STARTED__ = true;
  loadState = 'loading';
  configureGtag();

  loadPromise = new Promise<GaLoadState>((resolve) => {
    let settled = false;
    const finish = (state: GaLoadState) => {
      if (settled) return;
      settled = true;
      loadState = state;
      resolve(state);
    };

    const timeoutId = window.setTimeout(() => {
      if (!window.__GA_SCRIPT_LOADED__) finish(markBlocked());
    }, LOAD_TIMEOUT_MS);

    const onReady = () => {
      window.clearTimeout(timeoutId);
      settleScriptLoad(finish);
    };

    const onFailed = () => {
      window.clearTimeout(timeoutId);
      finish(markBlocked());
    };

    const existing = document.querySelector<HTMLScriptElement>(GA_SCRIPT_SELECTOR);
    if (existing) {
      if (window.__GA_SCRIPT_LOADED__ || existing.getAttribute('data-loaded') === '1') {
        onReady();
        return;
      }
      existing.addEventListener('load', () => {
        existing.setAttribute('data-loaded', '1');
        onReady();
      }, { once: true });
      existing.addEventListener('error', onFailed, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    script.dataset.ga4 = GA_MEASUREMENT_ID;

    script.onload = () => {
      script.setAttribute('data-loaded', '1');
      onReady();
    };
    script.onerror = onFailed;

    document.head.appendChild(script);
  });

  return loadPromise;
}