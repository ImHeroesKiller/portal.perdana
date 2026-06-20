import React from 'react';
import { useLanguage } from '../../services/i18n';
import { HOME_H_SCROLL, STAT_ITEMS } from './homeContent';

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

function MobileStatsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={HOME_H_SCROLL}>
      <div className="min-w-full rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
        <div className="grid min-w-[18rem] grid-cols-4 gap-1 sm:min-w-full">{children}</div>
      </div>
    </div>
  );
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  loading = false,
  variant = 'mobile',
  onStatClick,
}) => {
  const { t } = useLanguage();
  const isMobile = variant === 'mobile';

  if (loading && isMobile) {
    return (
      <MobileStatsShell>
        {STAT_ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className={`flex animate-pulse flex-col items-center px-1 py-2.5 text-center ${
              idx > 0 ? 'border-l border-slate-100' : ''
            }`}
          >
            <div className="h-8 w-8 rounded-full bg-slate-100" />
            <div className="mt-1.5 h-4 w-8 rounded bg-slate-100" />
            <div className="mt-1.5 h-2 w-10 rounded bg-slate-100" />
          </div>
        ))}
      </MobileStatsShell>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg lg:grid-cols-4">
        {STAT_ITEMS.map((item) => (
          <div
            key={item.key}
            className="min-h-[120px] animate-pulse rounded-2xl border border-slate-100 bg-white p-4"
          >
            <div className="mb-3 h-9 w-9 rounded-xl bg-slate-100" />
            <div className="h-7 w-12 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileStatsShell>
        {STAT_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const value = stats[item.key];
          const Wrapper = onStatClick ? 'button' : 'div';

          return (
            <Wrapper
              key={item.key}
              type={onStatClick ? 'button' : undefined}
              onClick={onStatClick ? () => onStatClick(item.key) : undefined}
              aria-label={`${t(item.labelKey)}: ${value}`}
              className={`group flex min-h-[6rem] flex-col items-center px-1 py-3 text-center transition active:scale-[0.97] ${
                idx > 0 ? 'border-l border-slate-100' : ''
              } ${onStatClick ? 'cursor-pointer rounded-xl hover:bg-slate-50 active:bg-slate-100/80' : ''}`}
            >
              <div
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ${item.bg} ${item.ring}`}
              >
                <Icon className={`h-4 w-4 ${item.color}`} aria-hidden="true" />
              </div>
              <p className={`mt-1 text-base font-black leading-none ${item.color}`}>{value}</p>
              <p className="mt-1.5 line-clamp-2 text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-500">
                {t(item.labelKey)}
              </p>
            </Wrapper>
          );
        })}
      </MobileStatsShell>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg lg:grid-cols-4">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];
        const Wrapper = onStatClick ? 'button' : 'div';

        return (
          <Wrapper
            key={item.key}
            type={onStatClick ? 'button' : undefined}
            onClick={onStatClick ? () => onStatClick(item.key) : undefined}
            className={`group relative min-h-[120px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-sm transition active:scale-[0.98] ${
              onStatClick ? 'cursor-pointer hover:border-[#003087]/25 hover:shadow-md' : ''
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-40 ${item.color}`}
            />
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-2 ${item.bg} ${item.ring}`}
            >
              <Icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className={`mt-2 text-3xl font-black leading-none lg:text-4xl ${item.color}`}>{value}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-700">
              {t(item.labelKey)}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-slate-400">{t(item.hintKey)}</p>
          </Wrapper>
        );
      })}
    </div>
  );
};