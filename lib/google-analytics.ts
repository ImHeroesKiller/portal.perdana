export const GA_MEASUREMENT_ID = 'G-LB6K5S1D5T';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __GA_DEBUG__?: boolean;
    __GA_READY__?: boolean;
  }
}

/** Enable GA4 DebugView: ?ga_debug=1, #/?ga_debug=1, or localStorage.setItem('ga_debug','1') */
export function isGaDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.__GA_DEBUG__) return true;
    if (localStorage.getItem('ga_debug') === '1') return true;

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return true;

    const probe = `${window.location.search}${window.location.hash}`;
    return /(?:^|[?&#])ga_debug=1(?:&|$|#)/.test(probe);
  } catch {
    return false;
  }
}

export function isGtagAvailable(): boolean {
  return typeof window.gtag === 'function';
}

/** HashRouter-safe page path (pathname + query, no hash fragment). */
export function buildGaPagePath(pathname: string, search: string): string {
  const path = pathname || '/';
  return search ? `${path}${search}` : path;
}

export function trackGaPageView(pagePath: string, pageTitle?: string): void {
  if (!isGtagAvailable()) {
    if (isGaDebugEnabled()) {
      console.warn('[GA4] gtag not loaded — check ad blockers or network');
    }
    return;
  }

  window.gtag!('event', 'page_view', {
    send_to: GA_MEASUREMENT_ID,
    page_path: pagePath,
    page_location: window.location.href,
    page_title: pageTitle ?? document.title,
  });

  if (window.__GA_DEBUG__) {
    console.info('[GA4] page_view', { page_path: pagePath, page_location: window.location.href });
  }
}