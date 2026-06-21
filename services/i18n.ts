import React from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import idCommon from '../locales/id/common.json';
import enCommon from '../locales/en/common.json';
import zhCommon from '../locales/zh/common.json';

export const SUPPORTED_LANGUAGES = ['id', 'en', 'zh'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'portal_lang';

const resources = {
  id: { common: idCommon },
  en: { common: enCommon },
  zh: { common: zhCommon },
};

function normalizeLanguage(lng: string | undefined): AppLanguage {
  if (lng === 'en' || lng === 'zh') return lng;
  return 'id';
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  });

export function appLangToSeoLocale(lang: AppLanguage): 'id' | 'en' {
  return lang === 'en' ? 'en' : 'id';
}

export function pickLocalized<T extends { id: string; en: string; zh?: string }>(
  text: T,
  lang: AppLanguage
): string {
  if (lang === 'zh') return text.zh ?? text.en;
  if (lang === 'en') return text.en;
  return text.id;
}

export type I18nVars = Record<string, string | number | undefined>;

type TFn = (key: string, options?: Record<string, unknown>) => string;

/** Replace leftover {{var}} / {{{var}}} when a locale string was saved with broken braces. */
function applyVarFallback(text: string, vars: I18nVars): string {
  let out = text;
  for (const [name, value] of Object.entries(vars)) {
    if (value === undefined) continue;
    const str = String(value);
    out = out.replaceAll(`{{{${name}}}}`, str).replaceAll(`{{${name}}}`, str);
  }
  return out;
}

/** Translate with interpolation vars and manual fallback for malformed locale templates. */
export function tVars(t: TFn, key: string, vars: I18nVars = {}): string {
  const options = Object.fromEntries(
    Object.entries(vars).filter(([, value]) => value !== undefined)
  );
  const result = t(key, options);
  return /\{\{/.test(result) ? applyVarFallback(result, vars) : result;
}

/** Singular/plural job count label (ID/EN/ZH). */
export function tJobCountLabel(t: TFn, count: number): string {
  if (count === 1) return t('home_jobs_found_one');
  return tVars(t, 'home_jobs_found_many', { count });
}

/** BCP 47 tag for `toLocaleDateString` / `toLocaleString`. */
export function localeDateTag(lang: AppLanguage): string {
  if (lang === 'zh') return 'zh-CN';
  if (lang === 'en') return 'en-US';
  return 'id-ID';
}

function syncDocumentLang(lang: AppLanguage) {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
}

syncDocumentLang(normalizeLanguage(i18n.language));

i18n.on('languageChanged', (lng) => {
  syncDocumentLang(normalizeLanguage(lng));
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(lng));
});

/** Keeps ?lang= query param in sync with i18next (HashRouter). */
export function LanguageUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { i18n: i18nInstance } = useTranslation();

  useEffect(() => {
    const param = searchParams.get('lang');
    if (!param || !SUPPORTED_LANGUAGES.includes(param as AppLanguage)) return;
    const next = param as AppLanguage;
    if (normalizeLanguage(i18nInstance.language) !== next) {
      void i18nInstance.changeLanguage(next);
    }
  }, [searchParams, i18nInstance]);

  useEffect(() => {
    const onChange = (lng: string) => {
      const lang = normalizeLanguage(lng);
      const current = searchParams.get('lang');
      const desired = lang === 'id' ? null : lang;
      if ((current ?? null) === desired) return;
      const next = new URLSearchParams(searchParams);
      if (desired) next.set('lang', desired);
      else next.delete('lang');
      setSearchParams(next, { replace: true });
    };
    i18nInstance.on('languageChanged', onChange);
    return () => {
      i18nInstance.off('languageChanged', onChange);
    };
  }, [i18nInstance, searchParams, setSearchParams]);

  return null;
}

/** Backward-compatible hook used across the app. */
export function useLanguage() {
  const { t, i18n: i18nInstance } = useTranslation('common');
  const language = normalizeLanguage(i18nInstance.language);

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      void i18nInstance.changeLanguage(lang);
    },
    [i18nInstance]
  );

  const toggleLanguage = useCallback(() => {
    const order: AppLanguage[] = ['id', 'en', 'zh'];
    const idx = order.indexOf(language);
    setLanguage(order[(idx + 1) % order.length]);
  }, [language, setLanguage]);

  const translateVars = useCallback(
    (key: string, vars: I18nVars = {}) => tVars(t, key, vars),
    [t]
  );

  const jobCountLabel = useCallback((count: number) => tJobCountLabel(t, count), [t]);

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    tVars: translateVars,
    tJobCountLabel: jobCountLabel,
  };
}

/** @deprecated Use LanguageUrlSync inside router; kept for App.tsx wrapper. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return children;
}

export default i18n;