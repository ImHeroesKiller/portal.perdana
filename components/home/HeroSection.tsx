import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../services/i18n';

const HERO_IMAGES = [
  '/assets/site_workers.jpg',
  '/assets/site_scaffolding.jpg',
  '/assets/site_bricklaying.jpg',
  '/assets/site_shoveling.jpg',
];

export interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  jobCount?: number;
  /** true = tampilan mobile: tanpa foto, hanya gradient */
  compact?: boolean;
}

function HeroContent({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  jobCount,
  compact,
  t,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  jobCount: number;
  compact: boolean;
  t: (key: string) => string;
}) {
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
      return;
    }
    const q = searchQuery.trim();
    navigate(q ? `/vacancies?q=${encodeURIComponent(q)}` : '/vacancies');
  };

  const contentPad = compact
    ? 'px-4 py-10'
    : 'px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20';

  return (
    <div className={`relative z-10 w-full ${contentPad}`}>
      <div className={compact ? 'w-full' : 'mx-auto max-w-7xl'}>
        <div className={compact ? 'w-full' : 'max-w-2xl'}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.15em] text-cyan-300 sm:text-xs">
              {t('home_hero_badge')}
            </span>
            {jobCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-200 sm:text-xs">
                <BriefcaseIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('home_hero_jobs_count').replace('{count}', String(jobCount))}
              </span>
            )}
          </div>

          <h1
            className={`mt-3 font-black leading-[1.05] tracking-tight text-white ${
              compact ? 'text-[1.75rem]' : 'text-[2rem] sm:text-4xl lg:text-5xl'
            }`}
          >
            {t('home_hero_headline')}
          </h1>

          <p
            className={`mt-2 font-medium text-slate-200 ${
              compact ? 'text-sm leading-snug' : 'text-base sm:text-lg'
            }`}
          >
            {t('home_hero_tagline')}
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className={`mt-5 sm:mt-6 ${compact ? '' : 'max-w-xl'}`}
            role="search"
          >
            <div className="rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-white/50 sm:p-2">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t('home_search_placeholder')}
                    className="w-full rounded-xl border-0 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/40 sm:text-base"
                    aria-label={t('home_search_placeholder')}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-extrabold text-slate-900 shadow-md transition hover:bg-amber-400 active:scale-[0.98] sm:w-auto sm:min-w-[6.5rem] sm:text-base"
                >
                  {t('home_hero_search_btn')}
                </button>
              </div>
            </div>
          </form>

          <div
            className={`mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:items-center ${
              compact ? '' : 'max-w-xl'
            }`}
          >
            <Link
              to="/vacancies"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-blue-800 active:scale-[0.98] sm:w-auto sm:px-8 sm:text-base"
            >
              {t('home_cta_button')}
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/apply"
              className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-white bg-white/95 px-6 py-4 text-sm font-extrabold text-blue-700 shadow-lg transition hover:bg-white active:scale-[0.98] sm:w-auto sm:px-8 sm:text-base"
            >
              {t('home_hero_apply_btn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile: gradient saja, tanpa foto & slideshow */
function MobileHero(props: Omit<HeroSectionProps, 'compact'> & { t: (key: string) => string }) {
  const { t, ...contentProps } = props;
  return (
    <section
      className="w-full shrink-0 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white"
      aria-label={t('home_hero_aria')}
    >
      <HeroContent {...contentProps} compact jobCount={contentProps.jobCount ?? 0} t={t} />
    </section>
  );
}

/** Desktop: foto konstruksi + overlay gradient */
function DesktopHero(props: Omit<HeroSectionProps, 'compact'> & { t: (key: string) => string }) {
  const { t, ...contentProps } = props;
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="grid w-full text-white" aria-label={t('home_hero_aria')}>
      <div className="col-start-1 row-start-1 relative min-h-56 w-full overflow-hidden lg:min-h-64">
        {HERO_IMAGES.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${
              activeImageIdx === idx ? 'opacity-100' : 'opacity-0'
            }`}
            referrerPolicy="no-referrer"
            {...(idx === 0 ? { fetchpriority: 'high' as const } : {})}
          />
        ))}
      </div>

      <div
        className="col-start-1 row-start-1 min-h-56 w-full bg-gradient-to-br from-slate-950/90 via-blue-950/65 to-blue-800/30 lg:min-h-64"
        aria-hidden="true"
      />
      <div
        className="col-start-1 row-start-1 min-h-56 w-full bg-gradient-to-r from-slate-950/85 via-blue-950/45 to-transparent lg:min-h-64"
        aria-hidden="true"
      />
      <div
        className="col-start-1 row-start-1 min-h-56 w-full bg-gradient-to-t from-slate-950/80 via-transparent to-cyan-400/10 lg:min-h-64"
        aria-hidden="true"
      />

      <div className="col-start-1 row-start-1">
        <HeroContent {...contentProps} compact={false} jobCount={contentProps.jobCount ?? 0} t={t} />

        <div className="relative z-10 -mt-2 mb-6 flex justify-center gap-1.5" aria-hidden="true">
          {HERO_IMAGES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveImageIdx(idx)}
              className={`h-1 rounded-full transition-all ${
                activeImageIdx === idx ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/40'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export const HeroSection: React.FC<HeroSectionProps> = (props) => {
  const { t } = useLanguage();
  const { compact = false, ...rest } = props;

  if (compact) {
    return <MobileHero {...rest} t={t} />;
  }

  return <DesktopHero {...rest} t={t} />;
};