import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
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
  compact?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  jobCount = 0,
  compact = false,
}) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
      return;
    }
    const q = searchQuery.trim();
    navigate(q ? `/vacancies?q=${encodeURIComponent(q)}` : '/vacancies');
  };

  return (
    <section
      className={`relative overflow-hidden text-white ${
        compact ? 'rounded-3xl mx-4 mt-4' : 'w-full'
      }`}
      aria-label={t('home_hero_aria')}
    >
      {/* Background slideshow */}
      <div className={`absolute inset-0 ${compact ? 'rounded-3xl' : ''}`}>
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
        {/* Elegant overlay — foto tetap terlihat */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-slate-950/92 via-blue-950/78 to-blue-900/45 ${
            compact ? 'rounded-3xl' : ''
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent ${
            compact ? 'rounded-3xl' : ''
          }`}
        />
      </div>

      <div
        className={`relative z-10 ${
          compact
            ? 'px-5 py-8'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24'
        }`}
      >
        <div className={`${compact ? '' : 'max-w-3xl'}`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 sm:text-xs">
            {t('home_hero_badge')}
          </span>

          <h1
            className={`mt-4 font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-lg ${
              compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl lg:text-5xl xl:text-6xl'
            }`}
          >
            {t('home_hero_headline')}
          </h1>

          <p
            className={`mt-3 font-medium text-slate-200/90 ${
              compact ? 'text-sm leading-relaxed' : 'text-base sm:text-lg lg:text-xl max-w-2xl'
            }`}
          >
            {t('home_hero_tagline')}
            {jobCount > 0 && (
              <span className="mt-1 block text-cyan-300/90 text-sm font-semibold">
                {t('home_hero_jobs_count').replace('{count}', String(jobCount))}
              </span>
            )}
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className={`mt-6 ${compact ? '' : 'max-w-2xl'}`}
            role="search"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="relative flex-1">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t('home_search_placeholder')}
                  className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-slate-800 shadow-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:text-base"
                  aria-label={t('home_search_placeholder')}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-amber-400 active:scale-[0.98] sm:text-base"
              >
                {t('home_hero_search_btn')}
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* CTA row */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/vacancies"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0056C6] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-[0.98] sm:px-6 sm:text-base"
            >
              {t('home_cta_button')}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/80 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-[0.98] sm:text-base"
            >
              {t('home_hero_apply_btn')}
            </Link>
            {!compact && (
              <Link
                to="/services"
                className="text-sm font-semibold text-cyan-200/90 underline-offset-4 hover:text-white hover:underline"
              >
                {language === 'id' ? 'Layanan Kami →' : 'Our Services →'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};