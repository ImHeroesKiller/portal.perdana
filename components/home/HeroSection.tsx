import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../services/i18n';
import { COMPANY_LOGO_PNG } from '../../lib/brand-assets';
import { OptimizedImage } from '../ui/OptimizedImage';

/** Compressed hero assets (~70% smaller than originals) */
const HERO_IMAGES = [
  '/assets/hero/site_workers.jpg',
  '/assets/hero/site_scaffolding.jpg',
  '/assets/hero/site_bricklaying.jpg',
  '/assets/hero/site_shoveling.jpg',
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

function HeroBrand({
  compact,
  companyName,
}: {
  compact: boolean;
  companyName: string;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? 'mb-5' : 'mb-6 sm:mb-7'
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-white shadow-2xl ring-2 ring-white/50 ${
          compact
            ? 'mb-3.5 h-[5.75rem] w-[5.75rem] p-3'
            : 'mb-4 h-[6.25rem] w-[6.25rem] p-3.5 sm:h-[7.25rem] sm:w-[7.25rem] sm:p-4'
        }`}
      >
        <OptimizedImage
          src={COMPANY_LOGO_PNG}
          alt="Logo PT Perdana Adi Yuda"
          className="h-full w-full object-contain"
          priority
          width={256}
          height={256}
        />
      </div>
      <p
        className={`max-w-[18rem] font-bold leading-snug text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:max-w-md ${
          compact ? 'text-sm' : 'text-base sm:text-lg md:text-xl'
        }`}
      >
        {companyName}
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
  tVars,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  jobCount: number;
  compact: boolean;
  t: (key: string) => string;
  tVars: (key: string, vars?: Record<string, string | number | undefined>) => string;
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
    ? 'px-4 pb-11 pt-8'
    : 'px-4 pb-12 pt-9 sm:px-6 sm:pb-14 sm:pt-11 lg:px-8 lg:py-16';

  return (
    <div className={`relative z-20 flex w-full flex-col ${contentPad}`}>
      <div className={`mx-auto w-full ${compact ? 'max-w-md' : 'max-w-3xl'}`}>
        <div
          className={`mx-auto flex w-full max-w-2xl flex-col items-center text-center ${
            compact ? 'max-w-md' : ''
          }`}
        >
          <HeroBrand compact={compact} companyName={t('home_hero_company_name')} />

          <div className="mb-5 flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200 sm:text-xs">
              {t('home_hero_badge')}
            </span>
            {jobCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 px-2.5 py-1 text-[10px] font-bold text-amber-100 sm:text-xs">
                <BriefcaseIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {tVars('home_hero_jobs_count', { count: jobCount })}
              </span>
            )}
          </div>

          <h1
            className={`font-black leading-[1.12] tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)] ${
              compact
                ? 'text-[1.75rem]'
                : 'text-[2rem] sm:text-4xl lg:text-[2.75rem]'
            }`}
          >
            {t('home_hero_headline')}
          </h1>

          <p
            className={`mx-auto mt-3.5 font-medium text-slate-100/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.35)] ${
              compact
                ? 'max-w-[21rem] text-sm leading-relaxed'
                : 'max-w-xl text-sm leading-relaxed sm:text-base'
            }`}
          >
            {t('home_hero_tagline')}
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-6 w-full max-w-xl sm:mt-7"
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
                    className="w-full rounded-xl border-0 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003087]/35 sm:py-4 sm:text-base"
                    aria-label={t('home_search_placeholder')}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-extrabold text-slate-900 shadow-md transition hover:bg-amber-400 active:scale-[0.98] sm:w-auto sm:min-w-[6.5rem]"
                >
                  {t('home_hero_search_btn')}
                </button>
              </div>
            </div>
          </form>

          <div className="mx-auto mt-5 flex w-full max-w-xl flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row sm:gap-2.5">
            <Link
              to="/vacancies"
              className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#003087] px-6 text-sm font-extrabold text-white shadow-lg transition hover:bg-blue-900 active:scale-[0.98] sm:w-auto sm:px-8"
            >
              {t('home_cta_button')}
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/apply"
              className="inline-flex w-full min-h-[48px] items-center justify-center rounded-2xl border-2 border-white/90 bg-white/95 px-6 text-sm font-extrabold text-[#003087] shadow-lg transition hover:bg-white active:scale-[0.98] sm:w-auto sm:px-8"
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
    ? 'min-h-[27rem]'
    : 'min-h-[29rem] sm:min-h-[31rem] lg:min-h-[34rem]';

  return (
    <>
      {/* Layer 0: slideshow images */}
      <div
        className={`col-start-1 row-start-1 relative z-0 w-full overflow-hidden ${minH}`}
      >
        {HERO_IMAGES.map((src, idx) => {
          const isActive = activeImageIdx === idx;
          return (
            <OptimizedImage
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              priority={idx === 0}
              width={1200}
              height={800}
              sizes="100vw"
              className={`absolute inset-0 z-0 h-full w-full object-cover object-center will-change-[opacity,transform] ${
                isActive ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: `${SLIDE_FADE_MS}ms`,
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              referrerPolicy="no-referrer"
            />
          );
        })}
      </div>

      {/* Layer 1: scrim — foto tetap terlihat, teks & logo lebih kontras */}
      <div
        className={`col-start-1 row-start-1 relative z-[1] pointer-events-none w-full ${minH}`}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-slate-950/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/82 via-[#003087]/45 to-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(0,48,135,0.35),transparent_65%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/15 to-transparent" />
      </div>
    </>
  );
}

function SlideDots({
  count,
  activeIdx,
  onSelect,
  t,
  tVars,
}: {
  count: number;
  activeIdx: number;
  onSelect: (idx: number) => void;
  t: (key: string) => string;
  tVars: (key: string, vars?: Record<string, string | number | undefined>) => string;
}) {
  return (
    <div
      className="relative z-20 flex justify-center pb-7 pt-3 sm:pb-9"
      role="tablist"
      aria-label={t('home_hero_slideshow_aria')}
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
              aria-label={tVars('home_hero_slide_aria', { n: idx + 1 })}
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
  t,
  tVars,
  ...rest
}: Omit<HeroSectionProps, 'compact'> & {
  compact: boolean;
  t: (key: string) => string;
  tVars: (key: string, vars?: Record<string, string | number | undefined>) => string;
}) {
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

      <div className="relative z-10 col-start-1 row-start-1 flex flex-col">
        <HeroContent
          {...rest}
          compact={compact}
          jobCount={rest.jobCount ?? 0}
          t={t}
          tVars={tVars}
        />
        <SlideDots
          count={HERO_IMAGES.length}
          activeIdx={activeImageIdx}
          onSelect={setActiveImageIdx}
          t={t}
          tVars={tVars}
        />
      </div>
    </section>
  );
}

export const HeroSection: React.FC<HeroSectionProps> = (props) => {
  const { t, tVars } = useLanguage();
  const { compact = false, ...rest } = props;

  return <HeroSlideshow {...rest} compact={compact} t={t} tVars={tVars} />;
};