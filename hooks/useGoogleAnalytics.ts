import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildGaPagePath, isGaDebugEnabled, isGtagAvailable, trackGaPageView } from '../lib/google-analytics';

/** Track HashRouter navigations in GA4 (send_page_view disabled in index.html). */
export function useGoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const pagePath = buildGaPagePath(location.pathname, location.search);
    trackGaPageView(pagePath);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isGaDebugEnabled()) return;

    const timer = window.setTimeout(() => {
      if (!isGtagAvailable()) {
        console.warn(
          '[GA4] gtag.js tidak terdeteksi setelah 3s. Kemungkinan diblokir extension (uBlock, Privacy Badger) atau firewall.'
        );
      }
    }, 3000);

    return () => window.clearTimeout(timer);
  }, []);
}