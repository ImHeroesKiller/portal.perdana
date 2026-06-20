import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildGaPagePath,
  detectAdBlocker,
  getGaLoadState,
  initGoogleAnalytics,
  isGaDebugEnabled,
  isGtagReady,
  trackGaPageView,
} from '../lib/google-analytics';

/** Track HashRouter navigations in GA4 (send_page_view disabled; manual page_view). */
export function useGoogleAnalytics() {
  const location = useLocation();
  const lastSentRef = useRef('');
  const rafRef = useRef(0);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    void (async () => {
      const [state, adBlockLikely] = await Promise.all([initGoogleAnalytics(), detectAdBlocker()]);

      if (!mountedRef.current) return;

      if (state === 'blocked' || state === 'error' || adBlockLikely) {
        if (isGaDebugEnabled()) {
          console.warn(
            '[GA4] Analytics unavailable. Disable ad blocker for this site or allow googletagmanager.com / google-analytics.com.'
          );
        }
        return;
      }

      if (!isGtagReady() && isGaDebugEnabled()) {
        console.warn(`[GA4] gtag not ready (state: ${getGaLoadState()})`);
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const pagePath = buildGaPagePath(location.pathname, location.search);

    window.cancelAnimationFrame(rafRef.current);
    rafRef.current = window.requestAnimationFrame(() => {
      if (lastSentRef.current === pagePath) return;
      lastSentRef.current = pagePath;
      trackGaPageView(pagePath);
    });

    return () => window.cancelAnimationFrame(rafRef.current);
  }, [location.pathname, location.search, location.key]);
}