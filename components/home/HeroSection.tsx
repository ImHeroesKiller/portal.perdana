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

const SLIDE_INTERVAL_MS = 6000;
const SLIDE_FADE_MS = 1400;

export interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  jobCount?: number;
  /** Mobile home — spacing & tipografi lebih ringkas */
  compact?: boolean;
}

function HeroBrand({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? 'mb-6' : 'mb-7 sm:mb-8'
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-2xl ring-2 ring-white/50 ${
          compact
            ? 'mb-3 h-[4.5rem] w-[4.5rem] p-2.5'
            : 'mb-3.5 h-[5rem] w-[5rem] p-3 sm:mb-4 sm:h-[5.5rem] sm:w-[5.5rem] sm:p-3.5'
        }`}
      >
        <img
          src="/assets/logo.png"
          alt="Logo PeRdana"
          className="h-full w-full object-contain"
        />
      </div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-cyan-300 sm:text-xs">
        PeRdana
      </p>
      <p
        className={`mt-1 font-black uppercase leading-tight tracking-[0.12em] text-white drop-shadow-sm ${
          compact ? 'text-[0.95rem]' : 'text-base sm:text-lg md:text-xl'
        }`}
      >
        PERDANA ADI YUDA
      </p>
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

  const align = compact ? 'items-center text-center' : 'items-start text-left sm:items-center sm:text-center lg:items-start lg:text-left';
  const contentPad = compact
    ? 'px-4 pb-10 pt-7'
    : 'px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8 lg:py-16';

  return (
    <div className={`relative z-10 flex w-full flex-col ${contentPad}`}>
      <div className={`mx-auto w-full ${compact ? 'max-w-md' : 'max-w-7xl'}`}>
        <div
          className={`mx-auto flex w-full flex-col ${align} ${
            compact ? 'max-w-md' : 'max-w-2xl lg:mx-0'
          }`}
        >
          <HeroBrand compact={compact} />

          <div
            className={`flex flex-wrap gap-2 ${
              compact ? 'mb-5 justify-center' : 'mb-5 justify-center lg:justify-start'
            }`}
          >
            <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200 sm:text-xs">
              {t('home_hero_badge')}
            </span>
            {jobCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 px-2.5 py-1 text-[10px] font-bold text-amber-100 sm:text-xs">
                <BriefcaseIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {t('home_hero_jobs_count').replace('{count}', String(jobCount))}
              </span>
            )}
          </div>

          <h1
            className={`font-black leading-[1.1] tracking-tight text-white drop-shadow-md ${
              compact
                ? 'text-[1.7rem]'
                : 'text-[1.9rem] sm:text-4xl lg:text-[2.75rem]'
            }`}
          >
            {t('home_hero_headline')}
          </h1>

          <p
            className={`mt-3 max-w-prose font-medium text-slate-100/90 ${
              compact
                ? 'text-[0.9rem] leading-relaxed'
                : 'text-base leading-relaxed sm:text-lg'
            }`}
          >
            {t('home_hero_tagline')}
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className={`mt-6 w-full sm:mt-7 ${compact ? '' : 'max-w-xl lg:mx-0'}`}
            role="search"
          >
            <div className="rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-white/60 sm:p-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                    className="w-full rounded-xl border-0 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/40 sm:py-4 sm:text-base"
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
            className={`mt-5 flex w-full flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:gap-2.5 ${
              compact ? '' : 'max-w-xl lg:mx-0'
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
              className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-white/90 bg-white/95 px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-lg transition hover:bg-white active:scale-[0.98] sm:w-auto sm:px-8 sm:py-4 sm:text-base"
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
  const minH = compact
    ? 'min-h-[26rem]'
    : 'min-h-[28rem] sm:min-h-[30rem] lg:min-h-[34rem]';

  return (
    <>
      <div className={`col-start-1 row-start-1 relative w-full overflow-hidden ${minH}`}>
        {HERO_IMAGES.map((src, idx) => {
          const isActive = activeImageIdx === idx;
          return (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover object-center will-change-[opacity,transform] ${
                isActive ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: `${SLIDE_FADE_MS}ms`,
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              referrerPolicy="no-referrer"
              {...(idx === 0 ? { fetchpriority: 'high' as const } : {})}
            />
          );
        })}
      </div>

      {/* Base scrim */}
      <div
        className={`col-start-1 row-start-1 w-full bg-slate-950/45 ${minH}`}
        aria-hidden="true"
      />
      {/* Gradient utama — teks & logo lebih jelas */}
      <div
        className={`col-start-1 row-start-1 w-full bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-blue-950/65 ${minH}`}
        aria-hidden="true"
      />
      <div
        className={`col-start-1 row-start-1 w-full bg-gradient-to-br from-slate-950/90 via-blue-950/70 to-transparent ${minH}`}
        aria-hidden="true"
      />
      {/* Vignette atas untuk area brand */}
      <div
        className={`col-start-1 row-start-1 w-full bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(15,23,42,0.55),transparent)] ${minH}`}
        aria-hidden="true"
      />
      <div
        className={`col-start-1 row-start-1 w-full bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent ${minH}`}
        aria-hidden="true"
      />
    </>
  );
}

function SlideDots({
  count,
  activeIdx,
  onSelect,
}: {
  count: number;
  activeIdx: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div
      className="relative z-10 flex justify-center pb-6 pt-2 sm:pb-8"
      role="tablist"
      aria-label="Hero slideshow"
    >
      <div className="flex items-center gap-2 rounded-full bg-slate-950/50 px-3 py-2 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
        {Array.from({ length: count }, (_, idx) => {
          const isActive = activeIdx === idx;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => onSelect(idx)}
              className={`rounded-full transition-all duration-300 ease-out ${
                isActive
                  ? 'h-2 w-6 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                  : 'h-2 w-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          );
        })}
      </div>
    </div>
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
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="grid w-full text-white" aria-label={t('home_hero_aria')}>
      <HeroBackground activeImageIdx={activeImageIdx} compact={compact} />

      <div className="col-start-1 row-start-1 flex flex-col">
        <HeroContent
          {...rest}
          compact={compact}
          jobCount={rest.jobCount ?? 0}
          t={t}
        />
        <SlideDots
          count={HERO_IMAGES.length}
          activeIdx={activeImageIdx}
          onSelect={setActiveImageIdx}
        />
      </div>
    </section>
  );
}

export const HeroSection: React.FC<HeroSectionProps> = (props) => {
  const { t } = useLanguage();
  const { compact = false, ...rest } = props;

  return <HeroSlideshow {...rest} compact={compact} t={t} />;
};