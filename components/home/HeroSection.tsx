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
  /** Padding lebih ringkas (mobile home) — tetap pakai foto background */
  compact?: boolean;
}

function HeroBrand({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 ${
        compact ? 'mb-4' : 'mb-5 sm:mb-6'
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-xl ring-2 ring-white/40 ${
          compact ? 'h-14 w-14 p-2' : 'h-16 w-16 p-2.5 sm:h-[4.75rem] sm:w-[4.75rem] sm:p-3'
        }`}
      >
        <img
          src="/assets/logo.png"
          alt="Logo PeRdana"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-300 sm:text-xs">
          PeRdana
        </p>
        <p
          className={`font-black uppercase leading-tight tracking-wide text-white ${
            compact ? 'text-sm' : 'text-base sm:text-lg md:text-xl'
          }`}
        >
          PERDANA ADI YUDA
        </p>
      </div>
    </div>
  );
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
    ? 'px-4 pb-8 pt-6'
    : 'px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16';

  return (
    <div className={`relative z-10 w-full ${contentPad}`}>
      <div className={compact ? 'w-full' : 'mx-auto max-w-7xl'}>
        <div className={compact ? 'w-full' : 'max-w-2xl'}>
          <HeroBrand compact={compact} />

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
            className={`mt-3 font-black leading-[1.08] tracking-tight text-white ${
              compact ? 'text-[1.65rem]' : 'text-[1.85rem] sm:text-4xl lg:text-[2.75rem]'
            }`}
          >
            {t('home_hero_headline')}
          </h1>

          <p
            className={`mt-2 font-medium text-slate-200/95 ${
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-blue-800 active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              {t('home_cta_button')}
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/apply"
              className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-white bg-white/95 px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg transition hover:bg-white active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4 sm:text-base"
            >
              {t('home_hero_apply_btn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroBackground({
  activeImageIdx,
  compact,
}: {
  activeImageIdx: number;
  compact: boolean;
}) {
  const minH = compact ? 'min-h-[22rem]' : 'min-h-[24rem] sm:min-h-[28rem] lg:min-h-[32rem]';

  return (
    <>
      <div className={`col-start-1 row-start-1 relative w-full overflow-hidden ${minH}`}>
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

      {/* Overlay gradient — kontras teks & logo di mobile */}
      <div
        className={`col-start-1 row-start-1 w-full bg-gradient-to-br from-slate-950/92 via-blue-950/75 to-blue-900/50 ${minH}`}
        aria-hidden="true"
      />
      <div
        className={`col-start-1 row-start-1 w-full bg-gradient-to-r from-slate-950/88 via-blue-950/50 to-transparent ${minH}`}
        aria-hidden="true"
      />
      <div
        className={`col-start-1 row-start-1 w-full bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-cyan-500/10 ${minH}`}
        aria-hidden="true"
      />
    </>
  );
}

function HeroSlideshow({
  compact,
  ...contentProps
}: Omit<HeroSectionProps, 'compact'> & {
  compact: boolean;
  t: (key: string) => string;
}) {
  const { t, ...rest } = contentProps;
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="grid w-full text-white" aria-label={t('home_hero_aria')}>
      <HeroBackground activeImageIdx={activeImageIdx} compact={compact} />

      <div className="col-start-1 row-start-1">
        <HeroContent
          {...rest}
          compact={compact}
          jobCount={rest.jobCount ?? 0}
          t={t}
        />

        <div className="relative z-10 -mt-1 mb-5 flex justify-center gap-1.5 sm:mb-6" aria-hidden="true">
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

  return <HeroSlideshow {...rest} compact={compact} t={t} />;
};