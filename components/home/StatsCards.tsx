import React from 'react';
import { useLanguage } from '../../services/i18n';
import { STAT_ITEMS } from './homeContent';

export type HomeStats = {
  jobs: number;
  applicants: number;
  clients: number;
  projects: number;
};

interface StatsCardsProps {
  stats: HomeStats;
  loading?: boolean;
  variant?: 'mobile' | 'desktop';
  onStatClick?: (key: keyof HomeStats) => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  loading = false,
  variant = 'mobile',
  onStatClick,
}) => {
  const { t } = useLanguage();
  const isMobile = variant === 'mobile';

  if (loading) {
    return (
      <div
        className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'} ${
          isMobile ? '' : 'rounded-2xl border border-slate-100 bg-white p-4 shadow-lg'
        }`}
      >
        {STAT_ITEMS.map((item) => (
          <div
            key={item.key}
            className={`animate-pulse rounded-2xl border border-slate-100 bg-white p-4 ${
              isMobile ? 'min-h-[108px]' : 'min-h-[120px]'
            }`}
          >
            <div className="mb-3 h-9 w-9 rounded-xl bg-slate-100" />
            <div className="h-7 w-12 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={
        isMobile
          ? 'grid grid-cols-2 gap-3'
          : 'grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg lg:grid-cols-4'
      }
    >
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];
        const Wrapper = onStatClick ? 'button' : 'div';

        return (
          <Wrapper
            key={item.key}
            type={onStatClick ? 'button' : undefined}
            onClick={onStatClick ? () => onStatClick(item.key) : undefined}
            className={`group relative overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition active:scale-[0.98] ${
              isMobile ? 'p-3.5 min-h-[108px]' : 'p-5 min-h-[120px]'
            } ${onStatClick ? 'cursor-pointer hover:border-blue-200 hover:shadow-md' : ''}`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 ${item.color}`}
            />
            <div
              className={`inline-flex items-center justify-center rounded-xl ring-2 ${item.bg} ${item.ring} ${
                isMobile ? 'h-9 w-9' : 'h-11 w-11'
              }`}
            >
              <Icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${item.color}`} />
            </div>
            <p className={`mt-2 font-black leading-none ${item.color} ${isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'}`}>
              {value}
            </p>
            <p className={`mt-1 font-bold uppercase tracking-wide text-slate-700 ${isMobile ? 'text-[11px]' : 'text-xs'}`}>
              {t(item.labelKey)}
            </p>
            <p className={`mt-0.5 leading-snug text-slate-400 ${isMobile ? 'text-[10px] line-clamp-2' : 'text-xs'}`}>
              {t(item.hintKey)}
            </p>
          </Wrapper>
        );
      })}
    </div>
  );
};