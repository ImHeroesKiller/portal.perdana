import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  GA_MEASUREMENT_ID,
  initGoogleAnalytics,
  trackGaPageView,
} from '../lib/google-analytics';

/** HashRouter-safe path: pathname + search + hash (e.g. `/#/vacancies?q=...`). */
function buildPagePath(pathname: string, search: string, hash: string): string {
  const base = pathname || '/';
  return `${base}${search}${hash}` || '/';
}

/**
 * Track SPA navigations in GA4.
 * gtag.js is loaded once via `initGoogleAnalytics()` (also called from index.tsx).
 */
export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    void initGoogleAnalytics();
  }, []);

  useEffect(() => {
    const pagePath = buildPagePath(location.pathname, location.search, location.hash);
    trackGaPageView(pagePath, document.title);
  }, [location.pathname, location.search, location.hash, location.key]);
};

export { GA_MEASUREMENT_ID };