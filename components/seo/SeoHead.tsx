import { useEffect } from 'react';
import {
  buildAlternateUrls,
  type SeoConfig,
  SITE_NAME,
  SITE_URL,
} from '../../lib/seo';

const MANAGED = 'data-seo-managed';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"][${MANAGED}]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute(MANAGED, 'true');
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string, attrs?: Record<string, string>) {
  if (!href) return;
  const selector = `link[rel="${rel}"][${MANAGED}]${attrs?.hreflang ? `[hreflang="${attrs.hreflang}"]` : ''}`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    el.setAttribute(MANAGED, 'true');
    document.head.appendChild(el);
  }
  el.href = href;
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
}

function clearManagedJsonLd() {
  document.querySelectorAll(`script[type="application/ld+json"][${MANAGED}]`).forEach((n) => n.remove());
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  clearManagedJsonLd();
  const items = Array.isArray(data) ? data : [data];
  items.forEach((item, index) => {
    const el = document.createElement('script');
    el.id = `seo-jsonld-${index}`;
    el.type = 'application/ld+json';
    el.setAttribute(MANAGED, 'true');
    el.textContent = JSON.stringify(item);
    document.head.appendChild(el);
  });
}

export function SeoHead({ config }: { config: SeoConfig }) {
  useEffect(() => {
    document.title = config.title;
    const htmlLang =
      typeof document.documentElement.lang === 'string' && document.documentElement.lang.startsWith('zh')
        ? 'zh-Hans'
        : config.locale === 'en'
          ? 'en'
          : 'id';
    document.documentElement.lang = htmlLang;

    upsertMeta('name', 'description', config.description);
    upsertMeta('name', 'keywords', config.keywords);
    upsertMeta('name', 'robots', config.robots || 'index, follow');
    upsertMeta('name', 'author', 'PT Perdana Adi Yuda');
    upsertMeta('name', 'application-name', 'ePortal');

    upsertLink('canonical', config.canonical);

    const alternates = buildAlternateUrls(config.path, '');
    upsertLink('alternate', alternates.id, { hreflang: 'id' });
    upsertLink('alternate', alternates.en, { hreflang: 'en' });
    upsertLink('alternate', alternates.id, { hreflang: 'x-default' });

    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', config.title);
    upsertMeta('property', 'og:description', config.description);
    upsertMeta('property', 'og:url', config.canonical);
    upsertMeta('property', 'og:type', config.ogType || 'website');
    upsertMeta('property', 'og:image', config.ogImage || `${SITE_URL}/icons/icon-512.png`);
    upsertMeta('property', 'og:locale', config.locale === 'en' ? 'en_US' : 'id_ID');
    upsertMeta(
      'property',
      'og:locale:alternate',
      config.locale === 'en' ? 'id_ID' : 'en_US'
    );

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', config.title);
    upsertMeta('name', 'twitter:description', config.description);
    upsertMeta('name', 'twitter:image', config.ogImage || `${SITE_URL}/icons/icon-512.png`);

    if (config.jsonLd) {
      setJsonLd(config.jsonLd);
    } else {
      clearManagedJsonLd();
    }
  }, [config]);

  return null;
}