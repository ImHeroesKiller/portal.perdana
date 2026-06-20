import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../services/i18n';
import {
  buildJobDetailSeo,
  parseSeoLocale,
  resolvePageSeo,
  type SeoConfig,
} from '../lib/seo';

type SeoOverride = SeoConfig | null;

let seoOverride: SeoOverride = null;
const seoListeners = new Set<() => void>();

export function setSeoOverride(config: SeoOverride) {
  seoOverride = config;
  seoListeners.forEach((fn) => fn());
}

function useSeoOverride(): SeoOverride {
  const [override, setOverride] = useState<SeoOverride>(seoOverride);

  useEffect(() => {
    const listener = () => setOverride(seoOverride);
    seoListeners.add(listener);
    return () => {
      seoListeners.delete(listener);
    };
  }, []);

  return override;
}

/** Route-level SEO for public marketing pages (HashRouter). */
export function usePageSeo(): SeoConfig {
  const location = useLocation();
  const { language } = useLanguage();
  const override = useSeoOverride();

  const locale = useMemo(() => {
    const fromQuery = parseSeoLocale(location.search);
    return language === 'en' ? 'en' : fromQuery;
  }, [location.search, language]);

  return useMemo(() => {
    if (override) return override;
    return resolvePageSeo(location.pathname, location.search, locale);
  }, [override, location.pathname, location.search, locale]);
}

export function useJobSeo(job: import('../types').JobVacancy | undefined, locale: 'id' | 'en') {
  useEffect(() => {
    if (job?.isActive) {
      setSeoOverride(buildJobDetailSeo(job, locale));
    } else {
      setSeoOverride(null);
    }
    return () => setSeoOverride(null);
  }, [job, locale]);
}