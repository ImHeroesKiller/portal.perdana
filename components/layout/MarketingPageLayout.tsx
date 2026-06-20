import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageTopBarProps {
  badge?: string;
}

export const PageTopBar: React.FC<PageTopBarProps> = ({ badge }) => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 border-b border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex min-h-[44px] items-center gap-2 text-[11px] font-extrabold text-[#003087] transition hover:text-blue-900 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" aria-hidden />
          Kembali ke Beranda
        </button>
        {badge && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#003087]">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  imageSrc?: string;
  imageAlt?: string;
  compact?: boolean;
}

export const PageHero: React.FC<PageHeroProps> = ({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  imageAlt,
  compact = false,
}) => (
  <div className="relative overflow-hidden rounded-2xl bg-[#003087] text-white shadow-sm">
    {imageSrc && (
      <div className="absolute inset-0" aria-hidden>
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover opacity-25"
          referrerPolicy="no-referrer"
        />
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-br from-[#003087]/95 via-[#003087]/85 to-slate-950/75" aria-hidden />
    <div
      className={`relative z-10 ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'} ${
        imageSrc ? 'flex flex-col gap-5 md:flex-row md:items-center' : ''
      }`}
    >
      <div className="flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
          {eyebrow}
        </span>
        <h1 className="mt-2 text-xl font-black leading-tight drop-shadow-sm sm:text-2xl md:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-prose text-sm font-medium leading-relaxed text-slate-100/90">
          {subtitle}
        </p>
      </div>
      {imageSrc && (
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl border border-white/20 md:h-44 md:w-56">
          <img
            src={imageSrc}
            alt={imageAlt || ''}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  </div>
);

interface MarketingPageShellProps {
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}

export const MarketingPageShell: React.FC<MarketingPageShellProps> = ({
  children,
  wide = false,
  className = '',
}) => (
  <main
    className={`mx-auto flex flex-col gap-8 px-4 pb-8 pt-6 ${
      wide ? 'max-w-7xl' : 'max-w-4xl'
    } ${className}`}
  >
    {children}
  </main>
);

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({ children, className = '' }) => (
  <section className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 md:p-8 ${className}`}>
    {children}
  </section>
);

export const NavyCtaBanner: React.FC<{
  title: string;
  subtitle: string;
  buttonLabel: string;
  onClick: () => void;
}> = ({ title, subtitle, buttonLabel, onClick }) => (
  <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#003087] p-5 text-white shadow-sm sm:flex-row sm:items-center">
    <div>
      <p className="text-sm font-extrabold leading-snug">{title}</p>
      <p className="mt-1 text-[11px] leading-snug text-blue-100">{subtitle}</p>
    </div>
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-[#003087] transition hover:bg-slate-50 active:scale-[0.98]"
    >
      {buttonLabel}
    </button>
  </div>
);